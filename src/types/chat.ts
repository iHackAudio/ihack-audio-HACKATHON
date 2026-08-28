// Unified Chat & Pipeline System Types

export type PipelineToolName = 
  | 'run_scene_tournament'
  | 'run_story_polish' 
  | 'edit_script_line'
  | 'chat_edit_script'
  | 'get_story_bible'
  | 'synthesizeSpeech'
  | 'message_agent';

export interface ToolCall {
  name: PipelineToolName;
  params: Record<string, any>;
  id?: string;
}

export interface ToolResult {
  tool: PipelineToolName;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  executionTimeMs?: number;
  tokensUsed?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  tool: PipelineToolName;
  params: Record<string, any>;
  icon: string;
  description?: string;
  disabled?: boolean;
}

export interface TournamentResult {
  draftA: string;
  draftB: string;
  masterScene: string;
  emotionalBeat?: string;
  savedToBible?: boolean;
}

export interface PolishResult {
  slotA: string;
  slotB: string;
  slotC: string;
  jarvisScore: number;
  jarvisReport: string;
  finalScript: string;
  savedToBible?: boolean;
}

export interface LineEditResult {
  updatedScript: string;
  lineId: string;
  change: string;
}

export interface ChatEditResult {
  updatedScript: string;
  agentReply: string;
  change: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  stream?: boolean;
  toolParams?: Record<string, any>;
}

export interface ChatResponse {
  type?: 'chat' | 'pipeline_result' | 'error';
  text?: string;
  message?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  sessionId?: string;
  error?: string;
  logs?: any[];
}
