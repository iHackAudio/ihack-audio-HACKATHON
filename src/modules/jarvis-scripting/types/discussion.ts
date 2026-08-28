export type AppMode = 'hardcore' | 'discussion';

export type DiscussionPhase = 1 | 2 | 3 | 4 | 5;

export interface ParameterLockItem {
  key: string; // e.g. "concept.title", "concept.logline", "concept.tone", "character.char_1.motivations", "scene.scene_1.twist"
  label: string;
  value: string;
  isLocked: boolean;
  category: 'phase1_concept' | 'phase2_personas' | 'phase3_matrix' | 'phase4_cpsd' | 'phase5_script';
  proposedValue?: string;
  reason?: string;
  alternatives?: string[]; // Alternative creative options if user says No
  status?: 'pending' | 'accepted' | 'rejected' | 'modifying';
  rejectionReason?: string;
  updatedAt?: number;
}

export interface DiscussionThinkingTrace {
  userPerspectiveAnalysis: string; // Analyzing the user's intent, emotional motivation, and perspective
  subtextAndUnstatedNeeds: string; // Parsing underlying subtext, unsaid narrative desires, or creative friction
  storyBibleLocksCheck: string;   // Evaluating locked story bible rules vs fluid open parameters
  dramaticAndNarrativeReasoning: string; // Dramatic pacing, character psychology, and thematic alignment
}

export interface DiscussionMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  phase: DiscussionPhase;
  thinkingTrace?: DiscussionThinkingTrace;
  proposedLocks?: ParameterLockItem[];
  suggestedBibleUpdates?: Record<string, any>;
  isThinkingOpen?: boolean;
}

export type LocksMap = Record<string, ParameterLockItem>;
