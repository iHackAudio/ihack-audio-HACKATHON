export class MessageBus {
  private static subscribers: Record<string, Function[]> = {};

  static subscribe(event: string, callback: Function) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(callback);
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  static publish(event: string, payload: any) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => cb(payload));
    }
  }

  static getConsolidatedInstructions() {
    return {
      jarvis: localStorage.getItem('jarvis_instruction_v2') || undefined,
      middlemanModel: localStorage.getItem('middleman_model') || 'gemini-3.1-flash-lite',
    };
  }

  static async requestResponse(
    text: string, 
    actualAgentId: string, 
    onStart: () => void,
    onSuccess: (data: any) => void,
    onFailure: (err: any) => void,
    onComplete: () => void,
    historyList: any[] = [],
    thinkingMode?: boolean
  ) {
    onStart();
    try {
      const config = this.getConsolidatedInstructions();
      
      const filteredHistory = historyList
        .filter(m => m.role === 'user' || (m.role === 'model' && m.agentId === 'jarvis'))
        .map(h => ({
          role: h.role,
          agentId: h.agentId,
          content: h.content
        }));

      const { getAccessToken } = await import('./auth');
      const token = await getAccessToken();

      const body = {
        message: text,
        history: filteredHistory,
        attachments: [],
        agentId: actualAgentId,
        instruction: config.jarvis,
        middlemanModel: config.middlemanModel,
        thinkingMode: thinkingMode,
        accessToken: token
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData = null;
        
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const dataStr = part.substring(6);
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'log') {
                  this.publish('websocket_message', parsed.payload);
                } else if (parsed.type === 'final') {
                  finalData = parsed.payload;
                }
              } catch (e) {}
            }
          }
        }
        if (finalData) {
          onSuccess(finalData);
        } else {
          onFailure(new Error('Stream ended without final payload'));
        }
      } else {
        const data = await res.json();
        if (res.ok) {
          onSuccess(data);
        } else {
          onFailure(new Error(data.error || 'Failed to fetch response'));
        }
      }
    } catch (e: any) {
      onFailure(e);
    } finally {
      onComplete();
    }
  }
}
