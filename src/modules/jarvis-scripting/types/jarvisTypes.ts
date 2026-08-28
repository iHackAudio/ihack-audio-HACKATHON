export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'model';
  text: string;
  timestamp: string;
  reasoning?: string;
  thought?: string;
  nodeId?: string;
  model?: string;
  status?: 'sending' | 'complete' | 'error';
  audioUrl?: string;
}

export interface AgentLog {
  id: string;
  agentName: string;
  timestamp: string;
  action: string;
  status: 'info' | 'running' | 'success' | 'warning' | 'error';
  details?: string;
  latencyMs?: number;
}

export interface ThinkingState {
  isThinking: boolean;
  currentAgent?: string;
  currentStep?: string;
  thoughts?: string[];
}

export interface JojoSettings {
  dryWitLevel: number;
  creativity: number;
  verbosity: 'concise' | 'balanced' | 'deep';
  agentPersona: string;
  selectedModel: string;
  ttsEnabled: boolean;
  ttsVoice: string;
  contextMemoryTokens: number;
  strictJsonProtocol: boolean;
}

export interface ScriptTournamentOption {
  id: string;
  title: string;
  premise: string;
  tone: string;
  sceneBeats: string[];
  votes: number;
}

export interface SubtextNote {
  sceneId: string;
  character: string;
  unspokenSubtext: string;
  physicalTells: string[];
  tensionRating: number;
}

export interface CinematicScene {
  id: string;
  sceneNumber: number;
  header: string; // e.g. INT. SECURE SERVER VAULT - NIGHT
  location: string;
  timeOfDay: string;
  dramaticQuestion: string;
  dialogueBeats: string[];
  subtext: string;
  cpsdReference?: string;
}

export interface ScreenplayState {
  title: string;
  logline: string;
  genre: string;
  scenes: CinematicScene[];
  currentDraft: string;
}
