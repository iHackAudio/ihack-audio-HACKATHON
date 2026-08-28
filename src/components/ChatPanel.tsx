import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/index';
import { Send, Loader2, Volume2, VolumeX, Cpu, Sparkles, Server, Trash2, Copy, Check, Paperclip, ChevronDown, ChevronUp, Download, XCircle, Sliders, Folder } from 'lucide-react';
import { useVoiceSession } from '../hooks/useVoiceSession';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { MessageBus } from '../utils/MessageBus';
import AnalysisTerminal from './AnalysisTerminal';
import LiveLogPanel from './LiveLogPanel';
import AgentThinkingCharacter from './AgentThinkingCharacter';
import { useTTS } from '../hooks/useTTS';
import TTSSettingsModal from './TTSSettingsModal';
import SkillBibleSelectorModal from './SkillBibleSelectorModal';

const getAgentColor = (agentId: string) => {
  switch (agentId?.toLowerCase()) {
    case 'middleman': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]', header: 'text-emerald-400 font-semibold uppercase tracking-wide', icon: <Sparkles className="w-3 h-3 text-emerald-400" /> };
    case 'jarvis': return { bg: 'bg-[#00d2ff]/5', border: 'border-[#00d2ff]/30', header: 'text-[#00d2ff]', icon: <Server className="w-3 h-3" /> };
    case 'agenta': return { bg: 'bg-[#ff00d2]/5', border: 'border-[#ff00d2]/30', header: 'text-[#ff00d2]', icon: <Cpu className="w-3 h-3" /> };
    case 'agentb': return { bg: 'bg-[#d2ff00]/5', border: 'border-[#d2ff00]/30', header: 'text-[#d2ff00]', icon: <Sparkles className="w-3 h-3" /> };
    case 'agentc': return { bg: 'bg-[#00d2ff]/5', border: 'border-[#00d2ff]/30', header: 'text-[#00d2ff]', icon: <Server className="w-3 h-3" /> };
    default: return { bg: 'bg-white/5', border: 'border-white/10', header: 'text-white/70', icon: <Server className="w-3 h-3" /> };
  }
};

export default function ChatPanel({ 
  voiceHook, 
  messages, 
  setMessages,
  setAgentStatuses,
  showGlassBox,
  setShowGlassBox
}: { 
  voiceHook?: ReturnType<typeof useVoiceSession>,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setAgentStatuses?: React.Dispatch<React.SetStateAction<Record<string, 'active' | 'idle' | 'offline' | 'working' | 'thinking' | 'preparing' | 'sending'>>>,
  showGlassBox?: boolean,
  setShowGlassBox?: (val: boolean) => void
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string>('jarvis');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [isGlassBoxExpanded, setIsGlassBoxExpanded] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<Record<string, string>>({});
  const [showRetryInput, setShowRetryInput] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const tts = useTTS();
  const [showTTSModal, setShowTTSModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const lastApprovalMsgIdRef = useRef<string | null>(null);

  let latestApprovalMsg = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user' && (msg.content.includes('@accept') || msg.content.includes('@retry'))) {
       break;
    }
    if (msg.role === 'model' && (msg.content.includes('PIPELINE COMPLETE') || msg.content.includes('PIPELINE FAILED') || msg.content.includes('FINAL MASTER SCRIPT READY') || msg.content.includes('FINAL SCRIPT READY'))) {
       break;
    }
    if (msg.content && msg.content.match(/=== AWAITING APPROVAL: Phase (\d+) ===/i)) {
       latestApprovalMsg = msg;
       break;
    }
  }

  useEffect(() => {
    if (latestApprovalMsg) {
      if (lastApprovalMsgIdRef.current !== latestApprovalMsg.id) {
        lastApprovalMsgIdRef.current = latestApprovalMsg.id;
        setCountdownSeconds(60);
        setIsTimerPaused(false);
      }
    } else {
      lastApprovalMsgIdRef.current = null;
    }
  }, [latestApprovalMsg?.id]);

  useEffect(() => {
    if (!latestApprovalMsg || isTimerPaused || loading) return;

    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const match = latestApprovalMsg.content.match(/=== AWAITING APPROVAL: Phase (\d+) ===/i);
          if (match) {
            const phaseNum = parseInt(match[1]);
            triggerSend(`@accept Phase ${phaseNum}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [latestApprovalMsg?.id, isTimerPaused, loading]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: voiceHook?.sessionId || 'default' })
      });
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: 'cancel-' + Date.now(),
          role: 'system',
          content: '🛑 **Pipeline execution has been explicitly cancelled and state reset by user.** The command lock is now released and you can chat normally.',
          timestamp: Date.now()
        }]);
      } else {
        const data = await res.json();
        alert(`Failed to cancel pipeline: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error cancelling pipeline: ${err.message}`);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const parseMention = (text: string) => {
    const match = text.match(/^@(\w+)\s*(.*)/);
    if (match) return { target: match[1].toLowerCase(), payload: match[2] };
    return { target: null, payload: text };
  };

  const triggerSend = async (text: string, skipUserMsg = false) => {
    const { target } = parseMention(text);
    
    if (!skipUserMsg) {
      const userMsg: ChatMessage = {
        id: 'msg-' + Date.now().toString() + Math.random(),
        role: 'user',
        content: text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);
    }
    
    // Send to Jarvis live protocol if active and no targeted sub-agent
    if (!target && voiceHook && voiceHook.state === 'connected' && voiceHook.sendTextMessage) {
      setLoading(true);
      setActiveAgentId('jarvis');
      if (setAgentStatuses) {
        setAgentStatuses(prev => ({ ...prev, jarvis: 'thinking' }));
      }
      voiceHook.sendTextMessage(text);
      MessageBus.publish('voice_transmit', { text });
      return;
    }

    const actualAgentId = target || 'jarvis';
    
    await MessageBus.requestResponse(
      text,
      actualAgentId,
      () => {
        setLoading(true);
        setActiveAgentId(actualAgentId);
        if (setAgentStatuses) {
          setAgentStatuses(prev => ({ ...prev, [actualAgentId]: 'working' }));
        }
        MessageBus.publish('request_start', { agentId: actualAgentId });
      },
      (data) => {
        let agentName = data.agentId || actualAgentId;
        const modelMsg: ChatMessage = {
          id: 'msg-' + Date.now().toString() + Math.random(),
          role: 'model',
          agentId: agentName,
          content: data.text || 'No response',
          timestamp: Date.now(),
          isComplete: true
        };

        const addedMsgs: ChatMessage[] = [];
        if (data.refinedPrompt) {
          addedMsgs.push({
            id: 'gemma-' + Date.now() + Math.random(),
            role: 'model',
            agentId: 'middleman',
            content: `### G.E.M.M.A Input Stabilized & Aligned\nProcessed voice dictation matching and mapped workspace file similarity:\n\n* **Original transcript:** _"${text}"_\n* **Refined directive:** _"${data.refinedPrompt}"_`,
            timestamp: Date.now(),
            isComplete: true
          });
        }
        
        if (data.logs && Array.isArray(data.logs)) {
          const mappedLogs: ChatMessage[] = data.logs.map((lg: any) => ({
             id: 'log-' + Math.random() + Date.now(),
             role: 'model',
             agentId: lg.agentId,
             content: lg.text,
             timestamp: lg.timestamp || Date.now(),
             isComplete: true
          }));
          setMessages(prev => [...prev, ...addedMsgs, ...mappedLogs, modelMsg]);
        } else if (data.isStreamed) {
          if (addedMsgs.length > 0) {
            setMessages(prev => [...prev, ...addedMsgs]);
          }
        } else {
          setMessages(prev => [...prev, ...addedMsgs, modelMsg]);
        }
        
        MessageBus.publish('request_success', { agentId: actualAgentId, response: data.text });
      },
      (err) => {
        const errorMsg: ChatMessage = {
          id: 'msg-' + Date.now().toString() + Math.random(),
          role: 'system',
          content: err.message || 'Failed to process request',
          timestamp: Date.now(),
          isComplete: true
        };
        setMessages(prev => [...prev, errorMsg]);
        MessageBus.publish('request_failure', { agentId: actualAgentId, error: err.message });
      },
      () => {
        setLoading(false);
        if (setAgentStatuses) {
          setAgentStatuses(prev => ({ ...prev, [actualAgentId]: 'idle' }));
        }
        MessageBus.publish('request_complete', { agentId: actualAgentId });
      },
      messages,
      thinkingMode
    );
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    triggerSend(text);
  };

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    
    let markdown = `# Jarvis OS - Scripting Session & AI Behavior Analysis Log\n`;
    markdown += `*Exported on: ${new Date().toLocaleString()}*\n`;
    markdown += `*Total Messages: ${messages.length}*\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg) => {
      const isUser = msg.role === 'user';
      const timestampStr = new Date(msg.timestamp || Date.now()).toLocaleString();
      
      let label = 'UNKNOWN';
      if (isUser) {
        label = 'USER // INTENT_CAPTURE';
      } else if (msg.role === 'system') {
        label = 'SYSTEM // PIPELINE_EVENT';
      } else {
        const agentIdLower = msg.agentId?.toLowerCase() || '';
        if (agentIdLower === 'jarvis') {
          label = 'JARVIS // COMPUTE_CORE';
        } else if (agentIdLower === 'agenta') {
          label = 'AGENT_A // COGNITIVE_MATH';
        } else if (agentIdLower === 'agentb') {
          label = 'AGENT_B // CREATION_MATRIX';
        } else if (agentIdLower === 'agentc' || agentIdLower === 'gemma-middleman' || agentIdLower === 'middleman') {
          label = 'AGENT_C // GEMMA_CORE';
        } else {
          label = `AGENT // ${agentIdLower.toUpperCase()}`;
        }
      }

      markdown += `### [${label}] - ${timestampStr}\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jarvis_session_analysis_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (messages.length === 0) return;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        agentId: msg.agentId || null,
        content: msg.content,
        timestamp: msg.timestamp,
        isComplete: msg.isComplete ?? true
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jarvis_session_analysis_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hook into voice session messages
  useEffect(() => {
    if (voiceHook && voiceHook.onMessageReceivedRef) {
      voiceHook.onMessageReceivedRef.current = (msg: any) => {
        MessageBus.publish('websocket_message', msg);
        if (msg.type === 'interrupted') {
           // Silently handle interrupt, don't show in UI to avoid clutter
        } else if (msg.type === 'userText') {
           setMessages(prev => [...prev, { id: 'msg-' + Date.now().toString() + Math.random(), role: 'user', content: msg.text, timestamp: Date.now() }]);
           const text = msg.text.trim();
           const match = text.match(/^@(\w+)\s*(.*)/i);
           if (match) {
             triggerSend(text, true);
           }
        } else if (msg.type === 'modelText') {
           setMessages(prev => {
             const lastMsg = prev[prev.length - 1];
             if (lastMsg && lastMsg.role === 'model' && lastMsg.agentId === 'jarvis' && !lastMsg.isComplete) {
               const newPrev = [...prev];
               newPrev[newPrev.length - 1] = {
                 ...lastMsg,
                 content: lastMsg.content + msg.text
               };
               return newPrev;
             } else {
               return [...prev, { id: 'msg-' + Date.now().toString() + Math.random(), role: 'model', agentId: 'jarvis', content: msg.text, timestamp: Date.now(), isComplete: false }];
             }
           });
        } else if (msg.type === 'turnComplete') {
           setLoading(false);
           if (setAgentStatuses) {
             setAgentStatuses(prev => ({ ...prev, jarvis: 'idle' }));
           }
           setMessages(prev => {
             if (prev.length === 0) return prev;
             const lastMsg = prev[prev.length - 1];
             if (lastMsg && lastMsg.role === 'model' && lastMsg.agentId === 'jarvis' && !lastMsg.isComplete) {
               const DELEGATE_REGEX = /\[DELEGATE to @(\w+)\]\s*(.+)/i;
               const match = lastMsg.content.match(DELEGATE_REGEX);
               if (match) {
                 const triggeredTask = { agentId: match[1], payload: match[2].trim() };
                 setTimeout(() => {
                   triggerSend(`@${triggeredTask.agentId} ${triggeredTask.payload}`, true);
                 }, 0);
               }
               const newPrev = [...prev];
               newPrev[newPrev.length - 1] = { ...lastMsg, isComplete: true };
               return newPrev;
             }
             return prev;
           });
        }
      };
    }
  }, [voiceHook]);

  // Listen for raw websocket_messages (e.g. from the SSE text stream)
  useEffect(() => {
    const unsub = MessageBus.subscribe('websocket_message', (msg: any) => {
      // msg may come from VoiceSession (with a .type wrapper) or from SSE stream (raw payload)
      if (msg.agentChat || msg.type === 'agentChat') {
        const payload = msg.agentChat || msg.payload;
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now().toString() + Math.random(),
          role: 'model',
          agentId: payload.agentId,
          content: payload.text,
          timestamp: Date.now(),
          isComplete: true
        }]);

        if (tts.autoSpeak && payload.text) {
          tts.speak(payload.text);
        }
      }
      if (msg.agentStatus || msg.type === 'agentStatus') {
        const payload = msg.agentStatus || msg.payload;
        if (setAgentStatuses) {
          setAgentStatuses(prev => ({ ...prev, [payload.agentId]: payload.status }));
        }
        if (payload.status === 'working' || payload.status === 'thinking') {
          setActiveAgentId(payload.agentId);
          setLoading(true);
        } else if (payload.status === 'idle') {
          setLoading(false);
        }
      }
    });
    return () => unsub();
  }, [setAgentStatuses, tts.autoSpeak, tts.speak]);

  return (
    <div className="flex h-full bg-transparent text-white relative overflow-hidden">
      {/* Main Left Panel: Chat Console */}
      <div className={`flex flex-col h-full relative overflow-hidden transition-all duration-500 ease-in-out border-r border-white/5 ${editorFocused ? 'w-0 shrink-0 opacity-0 border-none' : 'flex-1'}`}>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            const timestampStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Build custom styling variables for each agent in the holographic console
            let speakerTag = '[JARVIS // COMPUTE_CORE]';
            let tagColor = 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]';
            let rowBg = 'bg-red-950/10 border-red-900/15 hover:border-red-500/30';
            let borderStyle = 'border-l-2 border-l-red-500';
            
            if (isUser) {
              speakerTag = '[USER // INTENT_CAPTURE]';
              tagColor = 'text-[#00d2ff] drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]';
              rowBg = 'bg-[#00d2ff]/5 border-[#00d2ff]/10 hover:border-[#00d2ff]/25';
              borderStyle = 'border-l-2 border-l-[#00d2ff]';
            } else {
              const agentIdLower = msg.agentId?.toLowerCase() || '';
              if (agentIdLower === 'agenta') {
                speakerTag = '[AGENT_A // COGNITIVE_MATH]';
                tagColor = 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]';
                rowBg = 'bg-pink-950/5 border-pink-900/15 hover:border-pink-500/25';
                borderStyle = 'border-l-2 border-l-pink-500';
              } else if (agentIdLower === 'agentb') {
                speakerTag = '[AGENT_B // CREATION_MATRIX]';
                tagColor = 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]';
                rowBg = 'bg-yellow-950/5 border-yellow-900/15 hover:border-yellow-400/25';
                borderStyle = 'border-l-2 border-l-yellow-400';
              } else if (agentIdLower === 'agentc' || agentIdLower === 'gemma-middleman' || agentIdLower === 'middleman') {
                speakerTag = '[AGENT_C // GEMMA_CORE]';
                tagColor = 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]';
                rowBg = 'bg-teal-950/5 border-teal-900/15 hover:border-teal-400/25';
                borderStyle = 'border-l-2 border-l-teal-400';
              } else if (msg.role === 'system') {
                speakerTag = '[SYSTEM // PIPELINE_EVENT]';
                tagColor = 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]';
                rowBg = 'bg-amber-950/10 border-amber-900/15 hover:border-amber-400/25';
                borderStyle = 'border-l-2 border-l-amber-500';
              }
            }

            return (
              <motion.div 
                initial={{ opacity: 0, x: isUser ? 15 : -15, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                key={msg.id} 
                className="w-full flex"
              >
                <div className={`w-full relative p-3 py-2 rounded-lg border border-white/[0.05] ${rowBg} backdrop-blur-md overflow-hidden transition-all duration-300 ${borderStyle} group`}>
                  {/* Absolute holographic corner brackets */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />

                  {/* Header containing meta indicators & transcript context */}
                  <div className="flex items-center justify-between mb-2 border-b border-white/[0.04] pb-1.5 text-[10px]">
                    <div className="flex items-center gap-3 pointer-events-none">
                      <span className="font-mono text-slate-500 tracking-widest">{timestampStr}</span>
                      <span className={`font-mono font-bold tracking-widest uppercase ${tagColor}`}>{speakerTag}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (tts.isSpeaking && tts.activeText === msg.content) {
                            tts.stop();
                          } else {
                            tts.speak(msg.content);
                          }
                        }}
                        className="p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                        title={tts.isSpeaking && tts.activeText === msg.content ? "Stop speech" : "Listen (Text-To-Speech)"}
                      >
                        {tts.isSpeaking && tts.activeText === msg.content ? (
                          <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100 text-slate-400 hover:text-cyan-400 transition-opacity" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-40 hover:opacity-100 text-slate-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded cursor-pointer flex items-center"
                        title="Copy transcript row"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Log body content (ReactMarkdown formatted) */}
                  <div className="text-sm prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 select-text font-sans pb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Interactive Approval Panel */}
                  {(() => {
                    const matchApproval = msg.content.match(/=== AWAITING APPROVAL: Phase (\d+) ===/i);
                    if (matchApproval) {
                      const phaseNum = parseInt(matchApproval[1]);
                      const isLatest = latestApprovalMsg && msg.id === latestApprovalMsg.id;

                      if (!isLatest) {
                        return (
                          <div className="mb-4 p-4 border border-white/5 bg-white/[0.02] rounded-lg text-xs font-mono text-slate-500 flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-slate-600" />
                            <span>This approval step has been processed or deactivated.</span>
                          </div>
                        );
                      }

                      const isRetryOpen = showRetryInput[msg.id] || false;
                      const feedback = retryFeedback[msg.id] || '';

                      return (
                        <div className="mb-4 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg flex flex-col gap-3 font-sans relative z-10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              Approval Pipeline Control Required
                            </div>
                            
                            {/* Live Timer Indicator */}
                            <div className="flex items-center gap-2 text-xs font-mono font-bold">
                              {countdownSeconds > 0 ? (
                                <>
                                  <span className={countdownSeconds <= 10 ? "text-red-400 animate-pulse" : "text-amber-400"}>
                                    AUTO-ACCEPT IN: {countdownSeconds}s
                                  </span>
                                  <button
                                    onClick={() => setIsTimerPaused(p => !p)}
                                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-slate-300 uppercase transition-colors cursor-pointer"
                                  >
                                    {isTimerPaused ? "Resume" : "Pause"}
                                  </button>
                                </>
                              ) : (
                                <span className="text-emerald-400">EXECUTING AUTO-ACCEPT...</span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar representing the remaining seconds */}
                          {countdownSeconds > 0 && (
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ease-linear ${countdownSeconds <= 10 ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${(countdownSeconds / 60) * 100}%` }}
                              />
                            </div>
                          )}
                          
                          {!isRetryOpen ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => triggerSend(`@accept Phase ${phaseNum}`)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 shadow-md shadow-emerald-950/40 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Accept Phase {phaseNum}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowRetryInput(prev => ({ ...prev, [msg.id]: true }));
                                }}
                                className="px-4 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 hover:text-white rounded text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Retry Phase {phaseNum}
                              </button>

                              <button
                                onClick={handleCancelPipeline}
                                className="px-4 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 hover:text-white rounded text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer ml-auto"
                                title="Deactivate pipeline, clear session locks and unlock normal chat mode"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel Pipeline
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={feedback}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRetryFeedback(prev => ({ ...prev, [msg.id]: val }));
                                }}
                                placeholder="Provide specific instructions or feedback for the retry run..."
                                className="w-full h-20 bg-black/40 border border-white/10 rounded p-2 text-xs font-sans text-white focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    triggerSend(`@retry Phase ${phaseNum}${feedback.trim() ? ': ' + feedback.trim() : ''}`);
                                    setShowRetryInput(prev => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 border border-amber-500/30 cursor-pointer"
                                >
                                  Submit Retry Request
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRetryInput(prev => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-xs font-mono transition-all duration-200 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            className="w-full flex items-center justify-center my-4"
          >
            <AgentThinkingCharacter agentId={activeAgentId} />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky/Fixed Pipeline Controls Block (Never Scrolls with Chat) */}
      {latestApprovalMsg && (() => {
        const matchApproval = latestApprovalMsg.content.match(/=== AWAITING APPROVAL: Phase (\d+) ===/i);
        if (!matchApproval) return null;
        const phaseNum = parseInt(matchApproval[1]);
        const isRetryOpen = showRetryInput[latestApprovalMsg.id] || false;
        const feedback = retryFeedback[latestApprovalMsg.id] || '';
        
        return (
          <div className="shrink-0 border-t border-amber-500/20 bg-amber-500/[0.04] p-3 flex flex-col gap-2 font-mono relative z-15 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-400 uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Pipeline Phase {phaseNum} Awaiting Control
              </div>
              
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                {countdownSeconds > 0 ? (
                  <>
                    <span>AUTO-ACCEPT IN: {countdownSeconds}s</span>
                    <button
                      onClick={() => setIsTimerPaused(p => !p)}
                      className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] text-slate-300 uppercase transition-colors cursor-pointer"
                    >
                      {isTimerPaused ? "Resume" : "Pause"}
                    </button>
                  </>
                ) : (
                  <span className="text-emerald-400">EXECUTING AUTO-ACCEPT...</span>
                )}
              </div>
            </div>

            {countdownSeconds > 0 && (
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${countdownSeconds <= 10 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${(countdownSeconds / 60) * 100}%` }}
                />
              </div>
            )}

            {!isRetryOpen ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button
                  onClick={() => triggerSend(`@accept Phase ${phaseNum}`)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-emerald-500/30 flex items-center gap-1 cursor-pointer animate-pulse-glow"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept Phase {phaseNum}
                </button>
                
                <button
                  onClick={() => setShowRetryInput(prev => ({ ...prev, [latestApprovalMsg.id]: true }))}
                  className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-200 hover:text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-red-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Retry Phase {phaseNum}
                </button>

                <button
                  onClick={handleCancelPipeline}
                  className="px-3 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 hover:text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-rose-500/30 flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Pipeline
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                <textarea
                  value={feedback}
                  onChange={(e) => setRetryFeedback(prev => ({ ...prev, [latestApprovalMsg.id]: e.target.value }))}
                  placeholder="Provide specific instructions or feedback for the retry run..."
                  className="w-full h-14 bg-black/40 border border-white/10 rounded p-1.5 text-xs font-sans text-white focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerSend(`@retry Phase ${phaseNum}${feedback.trim() ? ': ' + feedback.trim() : ''}`);
                      setShowRetryInput(prev => ({ ...prev, [latestApprovalMsg.id]: false }));
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-amber-500/30 cursor-pointer"
                  >
                    Submit Retry Request
                  </button>
                  <button
                    onClick={() => setShowRetryInput(prev => ({ ...prev, [latestApprovalMsg.id]: false }))}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className={`border-t border-white/10 bg-[#0c0e14] transition-all duration-300 ${isChatMinimized ? 'p-2' : 'p-4'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <button
               onClick={() => setIsChatMinimized(!isChatMinimized)}
               className="flex items-center gap-2 text-[11px] font-mono font-medium text-white/50 hover:text-white transition-colors"
            >
               {isChatMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
               {isChatMinimized ? 'EXPAND TERMINAL' : 'MINIMIZE TERMINAL'}
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-mono text-white/50 hover:text-[#00d2ff] transition-colors">
              <input 
                type="checkbox" 
                checked={thinkingMode}
                onChange={(e) => setThinkingMode(e.target.checked)}
                className="rounded border-white/10 bg-black/40 text-emerald-400 focus:ring-0 cursor-pointer w-3.5 h-3.5 accent-emerald-500"
              />
              🧠 GEMMA THINKING MODE (VOICE DICTATION STABILIZER)
            </label>
          </div>
          
          {!isChatMinimized && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                className={`px-2.5 py-1 flex items-center gap-1.5 border rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  isExplorerOpen
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,210,255,0.15)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                }`}
                title="Toggle Left Workspace Explorer Panel"
              >
                <Folder className="w-3 h-3 text-cyan-400" />
                <span>Files</span>
              </button>

              <button
                onClick={() => setShowSkillModal(true)}
                className="px-2.5 py-1 flex items-center gap-1.5 bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 rounded text-[11px] font-mono font-medium transition-all shadow-[0_0_10px_rgba(0,210,255,0.15)] cursor-pointer"
                title="Open Interactive Skill & Bible Checkbox Matrix"
              >
                <Sliders className="w-3 h-3 text-[#00d2ff]" />
                <span>Skill Matrix 🛠️</span>
              </button>

              <button
                onClick={() => setShowTTSModal(true)}
                className={`px-2 py-1 flex items-center gap-1.5 border rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  tts.isSpeaking
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : tts.autoSpeak
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                }`}
                title="Configure Text-To-Speech Studio & Auto-Vocalize"
              >
                <Volume2 className="w-3 h-3" />
                <span>TTS Studio</span>
                {tts.autoSpeak && <span className="text-[9px] bg-cyan-400/20 px-1 rounded text-cyan-300">AUTO</span>}
              </button>

              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExportMarkdown}
                    className="px-2 py-1 flex items-center gap-1.5 bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 border border-[#00d2ff]/20 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    title="Export chat session as Markdown (Readable for humans/AI analysis)"
                  >
                    <Download className="w-3 h-3" />
                    Export Markdown
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="px-2 py-1 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    title="Export chat session as raw JSON data"
                  >
                    <Download className="w-3 h-3" />
                    Export JSON
                  </button>

                  <button
                    onClick={async () => {
                      setMessages([]);
                      try {
                        await fetch('/api/clear-history', { 
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionId: voiceHook?.sessionId || null })
                        });
                      } catch (e) {
                        console.error("Failed to clear backend sub-agent memory:", e);
                      }
                    }}
                    className="px-2 py-1 flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    title="Clear Chat History & Backend Sub-Agent Memory"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!isChatMinimized && (
          <div className="relative flex items-center bg-[#1a1e26] rounded-xl border border-white/5 focus-within:border-[#00d2ff]/30 p-2 gap-2 mt-2">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".txt,.json,.md,.js,.ts,.html,.css,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (re) => {
                  const text = re.target?.result as string;
                  if (text) {
                    setInput(prev => prev + (prev.trim() ? '\n\n' : '') + `[File: ${file.name}]\n` + text);
                  }
                };
                reader.readAsText(file);
                e.target.value = ''; // Reset
              }}
            />
            <button 
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-white/5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              title="Attach Text File"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message, attach a file, or @mention an agent..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none min-h-[44px] max-h-[200px] text-sm px-2 text-white placeholder:text-white/30 outline-none py-3 custom-scrollbar"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-white/5 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Right Sidebar: Workspace Explorer / Analysis Terminal */}
      <div 
        className={`h-full flex transition-all duration-500 ease-in-out z-20 ${editorFocused ? 'flex-1' : isExplorerOpen ? 'w-64 sm:w-72 shrink-0' : 'w-0 shrink-0'}`} 
      >
        {!showGlassBox ? (
          <AnalysisTerminal 
            isOpen={isExplorerOpen}
            setIsOpen={setIsExplorerOpen}
            isGlassBoxOpen={showGlassBox}
            onToggleGlassBox={setShowGlassBox ? () => setShowGlassBox(!showGlassBox) : undefined}
            onFocusChange={setEditorFocused}
            onAnalyzeRequest={(filenameOrMessage) => {
              let msg = filenameOrMessage;
              if (!filenameOrMessage.startsWith('@')) {
                msg = `@jarvis please review the file "${filenameOrMessage}" from the workspace. Analyze the content, summarize key findings.`;
              }
              triggerSend(msg);
            }}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {showGlassBox && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`absolute top-0 right-0 h-full z-40 shadow-2xl border-l border-white/10 ${isGlassBoxExpanded ? 'w-full' : 'w-96'} transition-all duration-300`}
          >
            <LiveLogPanel 
              onClose={() => setShowGlassBox && setShowGlassBox(false)} 
              isExpanded={isGlassBoxExpanded}
              onToggleExpand={() => setIsGlassBoxExpanded(!isGlassBoxExpanded)}
              latestApprovalMsg={latestApprovalMsg}
              countdownSeconds={countdownSeconds}
              isTimerPaused={isTimerPaused}
              setIsTimerPaused={setIsTimerPaused}
              triggerSend={triggerSend}
              handleCancelPipeline={handleCancelPipeline}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showTTSModal && (
        <TTSSettingsModal tts={tts} onClose={() => setShowTTSModal(false)} />
      )}

      <SkillBibleSelectorModal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        onExecute={(cmd) => {
          triggerSend(cmd);
        }}
      />
    </div>
  );
}
