export type PodcastMode = 'SINGLE' | 'MULTI';

export type ViewState = 'STUDIO' | 'SONIC_FORGE' | 'MEDICAL_LAB' | 'FORENSIC';

export type TtsModel = 'LITE' | 'FLASH' | 'PRO';

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SYNTHESIZING = 'SYNTHESIZING',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface PresetTemplate {
  name: string;
  mode?: PodcastMode;
  voice?: string;
  duoEchoVoice?: string;
  duoNoiseVoice?: string;
  directorNotes?: string;
  directorNotesEcho?: string;
  directorNotesNoise?: string;
  context?: string;
}

export const AVAILABLE_VOICES = [
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede',
  'Leda',
  'Algenib',
  'Zephyr',
  'Orus'
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    name: 'Tech Banter (Echo & Noise)',
    mode: 'MULTI',
    duoEchoVoice: 'Leda',
    duoNoiseVoice: 'Algenib',
    directorNotesEcho: 'Playful, fast-paced, witty, slight vocal fry on sarcastic quips.',
    directorNotesNoise: 'Authoritative, grounded, analytical, clear lower midrange resonance.',
    context: 'Two veteran tech hosts reviewing breakthroughs in multimodal generative audio agents.'
  },
  {
    name: 'Solo Cinematic Narrative',
    mode: 'SINGLE',
    voice: 'Aoede',
    directorNotes: 'Warm, intimate, breathy pauses, dramatic gravity, measured pacing at 145 WPM.',
    context: 'Narrating a high-stakes psychological mystery in audio-first documentary style.'
  },
  {
    name: 'Medical Case Briefing',
    mode: 'SINGLE',
    voice: 'Kore',
    directorNotes: 'Crisp articulation, non-rhotic pronunciation of clinical terms, professional empathy.',
    context: 'Clinical case study presentation for healthcare professionals.'
  },
  {
    name: 'Investigative Deep Dive (Duo)',
    mode: 'MULTI',
    duoEchoVoice: 'Puck',
    duoNoiseVoice: 'Fenrir',
    directorNotesEcho: 'Curious investigative journalist asking sharp follow-up questions.',
    directorNotesNoise: 'Whistleblower engineer describing undisclosed laboratory findings.',
    context: 'Investigating anomalous telemetry logs inside an autonomous computing facility.'
  }
];

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
