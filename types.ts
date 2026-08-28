export enum ViewState {
  HOME = 'HOME',
  QUICK_LAB = 'QUICK_LAB',
  SONIC_FORGE = 'SONIC_FORGE',
  LIBRARY = 'LIBRARY',
  PLAYGROUND = 'PLAYGROUND',
  PRODUCTION_ANALYSIS = 'PRODUCTION_ANALYSIS',
  SFX_MAP = 'SFX_MAP',
  IHACK_PODCAST = 'IHACK_PODCAST',
  CREATE = 'CREATE',
  QUAD_TTS = 'QUAD_TTS',
  SCRIPT_OPTIMIZER = 'SCRIPT_OPTIMIZER',
  VIRAL_ENGINE = 'VIRAL_ENGINE',
  STUDIO_SYNTHESIS = 'STUDIO_SYNTHESIS',
  MEDICAL_SCRIPT = 'MEDICAL_SCRIPT',
  JARVIS_CONSOLE = 'JARVIS_CONSOLE',
  JOJO_ENGINE = 'JOJO_ENGINE',
  STORY_STUDIO = 'STORY_STUDIO',
  JARVIS_AURA = 'JARVIS_AURA',
  FORENSIC_DOSSIER = 'FORENSIC_DOSSIER',
  MODULE_HOST = 'MODULE_HOST'
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SYNTHESIZING = 'SYNTHESIZING',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  REFINING = 'REFINING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'model';
  text: string;
  sender?: string;
  isThinking?: boolean;
}

export interface PersonaResult {
  name: string;
  description: string;
  systemInstruction: string;
  suggestedVoices?: string[];
  sampleText?: string;
}

export interface Persona {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  baseVoice?: string;
  analysis?: {
    tone?: string;
    pace?: string;
    styleDescription?: string;
  };
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface AudioSegment {
  start: number;
  end: number;
  type: 'speech' | 'music' | 'background' | 'silence';
  loudness: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  confidence: number;
}

export interface MasteringContext {
  segments: AudioSegment[];
  globalLoudness: number;
  noiseFloor: number;
  hasPlosives: boolean;
  hasSibilance: boolean;
  bandwidth: 'narrow' | 'full' | 'extended';
  sampleRate: number;
}

export type MasteringPreset = 
  | 'BROADCAST_READY' 
  | 'CINEMATIC_WARM' 
  | 'CRISP_VOCAL' 
  | 'VOCAL_CLARITY' 
  | 'AUPHONIC_CLOUD';

export interface MasteringSettings {
  filteringMethod: 'highpass' | 'voice_auto_eq' | 'bandwidth_extension' | 'none';
  adaptiveLeveler: boolean;
  loudnessTarget: number;
  normalizationMethod: 'program' | 'dialog' | 'rms';
  denoiseMethod: 'static' | 'dynamic' | 'speech_isolation' | 'none';
  noiseReductionDb: number;
  removeBreaths: boolean;
  removeReverb: boolean;
  exciteAmount?: number;
  warmth?: number;
  deessAmount?: number;
  reverbMix?: number;
  reverbSize?: number;
  reverbDecay?: number;
}

export interface AuphonicConfig {
  apiKey: string;
  presetUuid: string;
}

export interface ProductionAnalysisResult {
  ratings?: any;
  realityCheck?: string;
  conversionChance?: string;
  nichePosition?: string;
  productionQuality?: string;
  voicePerformance?: string;
  soundDesign?: string;
  listenerEngagement?: string;
  globalBenchmarking?: string;
  recommendations?: any;
  predictiveReport?: string;
  estimatedMarketValue?: string;
  retentionRisk?: string;
  acousticSignature?: any;
  narratorAudit?: any;
  environmentAudit?: any;
  executiveVerdict?: any;
}

export interface ForensicData {
  noiseFloorDb?: number;
  [key: string]: any;
}

export interface AudioMetrics {
  [key: string]: any;
}

export interface NarratorAuditResult {
  monotonyIndex?: number;
  dynamicRangeScore?: number;
  [key: string]: any;
}

export interface EnvironmentAuditResult {
  [key: string]: any;
}

export interface ClientAudioReport {
  projectName?: string;
  clientName?: string;
  dateGenerated?: string;
  audioDuration?: string;
  masterQualityGrade?: string;
  complianceChecklist?: any;
  distributionStatus?: any;
  overallScore?: number;
  gradeLabel?: string;
  summary?: string;
  vocalClarity?: { score: number; description: string };
  technicalQuality?: { score: number; description: string };
  dynamicRange?: { score: number; description: string };
  stereoQuality?: { type: string; description: string };
  qualityAssurance?: string[];
  platformCompliance?: Record<string, { required: string; actual: string; compliant: boolean }>;
  technicalSpecs?: {
    lufs: number;
    truePeak: number;
    noiseFloor: number;
    crestFactor: number;
    sampleRate: string;
    bitDepth: string;
    stereoWidth: string;
    duration: string;
  };
  recommendation?: string;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  role?: string;
  voiceProfile?: string;
  accent?: string;
  pitch?: string;
  pacingWpm?: number;
  consistencyScore?: number;
}

export interface AudioAnalysis {
  speakers: SpeakerProfile[];
}

export interface ViralStrategy {
  appleTitle: string;
  appleSummary: string;
  linkedInPost: string;
}
