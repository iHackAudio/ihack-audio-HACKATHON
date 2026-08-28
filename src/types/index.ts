export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded data
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  agentId?: string;
  content: string;
  audioUrl?: string;
  timestamp: number;
  attachment?: Attachment;
  isComplete?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  instruction: string;
  voiceModel?: string;      // Only for Jarvis
  voiceApiKey?: string;     // Only for Jarvis
  voiceName?: string;       // Only for Jarvis: Puck, Aoede, Zephyr, etc.
  thinkingLevel?: string;   // Only for Jarvis: minimal, low, medium, high
  provider1: string;
  model1: string;
  apiKey1: string;
  provider2: string;
  model2: string;
  apiKey2: string;
  switchStrategy: 'auto' | 'model1' | 'model2' | 'alternate';
  endpoint1?: string;
  endpoint2?: string;
}

export interface APILog {
  timestamp: number;
  agentId: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
  status: 'success' | 'error' | 'rate_limited';
  errorMessage?: string;
}

export type VoiceSessionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';
