export type StoryFlixStep = 'core_idea' | 'personas' | 'scene_matrix' | 'cpsd_document';

export interface ConceptData {
  title: string;
  hook: string;
  summary: string;
  genre: string;
  targetEmotion: string;
  tone: string;
  targetAudience: string;
  format?: string;
  genreVibe?: string;
  corePremiseAndWorld?: string[];
  keyConflictPillars?: string[];
  thematicMotifs?: string[];
  emotionalArcAndStakes?: string[];
  narrativeMilestones?: string[];
}

export interface BiometricScanData {
  gender?: string;
  accent?: string;
  tone?: string;
  audioProfile?: string;
  styleDescription?: string;
  pace?: string;
  suggestedBaseVoice?: string;
}

export interface CharacterPersona {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'narrator';
  age: string;
  vocalProfile: string;
  voiceId: string; // Gemini/Edge TTS voice identifier (Kore, Puck, Charon, Fenrir, Zephyr, Aoede, Orpheus)
  background: string;
  speechQuirks: string;
  motivations: string;
  isLocked?: boolean;
  biometricScan?: BiometricScanData;
}

export interface SceneIdeaItem {
  id: string;
  agent: 'Agent A' | 'Agent B' | 'Agent C (Twisted)';
  title: string;
  summary: string;
  twistOrHook?: string;
  dramaticWant?: string;
  subtextAndTension?: string;
  keyDialogueBeats?: string[];
  emotionalTurningPoint?: string;
}

export interface DiscussionMessage {
  id: string;
  sender: 'user' | 'assistant' | 'agentC';
  text: string;
  timestamp: number;
}

export interface SceneMatrix3x3Result {
  id?: string;
  sceneNumber: number;
  title: string;
  summary?: string;
  userPlan?: string;
  agentA_ideas: SceneIdeaItem[];
  agentB_ideas: SceneIdeaItem[];
  agentC_ideas: SceneIdeaItem[];
  selectedIdea?: SceneIdeaItem;
  discussionNotes?: DiscussionMessage[];
  isLocked?: boolean;
}

export interface BibleScene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  charactersInScene: string[];
  summary: string;
  dramaticWant?: string;
  subtextAndTension?: string;
  keyDialogueBeats?: string[];
  twistOrHook?: string;
  emotionalTurningPoint?: string;
  agentSource?: string;
  cpsdDocument?: string; // Master Character-Plot-Setting Dossier scene blueprint
  rawProse?: string; // ~800 words of plain narration prose, present-tense, no dialogue
  scriptContent?: string; // Production notes, vocal guidance, acoustic and sound design cues
  status: 'draft' | 'approved';
  updatedAt: number;
}

export interface StoryFlixBible {
  version: number;
  updatedAt: number;
  concept: ConceptData;
  characterProfiles: CharacterPersona[];
  scenes: BibleScene[];
  sceneIdeaMatrix: SceneMatrix3x3Result[];
  cpsdSummary?: string;
  revisionHistory: Array<{
    id: string;
    timestamp: number;
    step: StoryFlixStep | string;
    action: string;
    details: string;
  }>;
}

export function createInitialStoryFlixBible(): StoryFlixBible {
  return {
    version: 1,
    updatedAt: Date.now(),
    concept: {
      title: '',
      hook: '',
      summary: '',
      genre: 'Sci-Fi / Suspense',
      targetEmotion: 'Intrigue, Atmospheric Dread, High Stakes',
      tone: 'Cinematic, Sharp, Immersive',
      targetAudience: 'Audio Drama & Fiction Audiophiles',
      format: 'Full-Cast Audio Drama',
      corePremiseAndWorld: [],
      keyConflictPillars: [],
      thematicMotifs: [],
      emotionalArcAndStakes: [],
      narrativeMilestones: []
    },
    characterProfiles: [],
    scenes: [],
    sceneIdeaMatrix: [],
    cpsdSummary: '',
    revisionHistory: [
      {
        id: `rev_${Date.now()}`,
        timestamp: Date.now(),
        step: 'core_idea',
        action: 'Initialized StoryFlix Workspace',
        details: 'Ready to draft core story idea, extract personas, and generate 3x3 scene matrix.'
      }
    ]
  };
}
