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

export interface AudioMetrics {
  [key: string]: any;
}

export interface NarratorAuditResult {
  totalWords?: number;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  pacingWpm?: number;
  pacingStatus?: 'OPTIMAL' | 'TOO_FAST' | 'TOO_SLOW' | 'PASS';
  pronunciationAccuracy?: number;
  pronunciationStatus?: 'PASS' | 'FLAGGED';
  emotionalArcAdherence?: number;
  breathControlScore?: number;
  monotonyIndex?: number;
  dynamicRangeScore?: number;
  [key: string]: any;
}

export interface EnvironmentAuditResult {
  roomProfile?: string;
  reverbRt60Ms?: number;
  reverbStatus?: 'DRY' | 'SLIGHT_ROOM' | 'WET' | 'OPTIMAL';
  dcOffset?: number;
  stereoCorrelation?: number;
  noiseFloorDbfs?: number;
  [key: string]: any;
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
  acousticSignature?: {
    lufsIntegrated?: number;
    lufsTarget?: number;
    lufsStatus?: 'PASS' | 'FAIL';
    truePeakDbfs?: number;
    truePeakTarget?: number;
    truePeakStatus?: 'PASS' | 'FAIL';
    crestFactorDb?: number;
    spectralCentroidHz?: number;
    noiseFloorDbfs?: number;
    noiseFloorStatus?: 'PASS' | 'FAIL';
    snrDb?: number;
  };
  narratorAudit?: NarratorAuditResult;
  environmentAudit?: EnvironmentAuditResult;
  executiveVerdict?: {
    commercialReadinessGrade?: string;
    distributionClearance?: 'CERTIFIED' | 'CONDITIONAL' | 'REJECTED';
    score?: number;
    executiveSummary?: string;
    actionableFixes?: string[];
  };
}

export interface ForensicData {
  noiseFloorDb?: number;
  dynamicRangeDb?: number;
  clippingEvents?: number;
  spectralBalance?: string;
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

export interface MasteringContext {
  segments: any[];
  globalLoudness: number;
  noiseFloor: number;
  hasPlosives: boolean;
  hasSibilance: boolean;
  bandwidth: 'narrow' | 'full' | 'extended';
  sampleRate: number;
}
