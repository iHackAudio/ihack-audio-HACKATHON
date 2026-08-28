import React, { useState } from 'react';
import { 
  Activity, Award, Sliders, Upload, BarChart3, 
  ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, 
  Download, RefreshCw, FileAudio, Headphones, Terminal
} from 'lucide-react';
import { ConsolidatedDossierReport } from './components/ConsolidatedDossierReport';
import { ClientDeliveryReport } from './components/ClientDeliveryReport';
import { RealtimeMasteringPanel } from './components/RealtimeMasteringPanel';
import { analyzeAudioBufferHeuristic } from './services/audioAnalysisService';
import { 
  ProductionAnalysisResult, 
  ForensicData, 
  AudioMetrics, 
  NarratorAuditResult, 
  EnvironmentAuditResult, 
  ClientAudioReport, 
  SpeakerProfile 
} from './types/audioAnalyzerTypes';

interface AudioAnalyzerAppProps {
  onBackToHub?: () => void;
}

const INITIAL_SPEAKERS: SpeakerProfile[] = [
  { id: 'narrator', name: 'Dr. Liang', role: 'Lead Specialist', accent: 'Cultivated English', pitch: 'Mid-Low', pacingWpm: 155, consistencyScore: 98 },
  { id: 'anchor', name: 'Anchor System', role: 'Acoustic Co-Host', accent: 'Neutral North American', pitch: 'Grounded Baritone', pacingWpm: 160, consistencyScore: 96 }
];

const INITIAL_PROD_RESULT: ProductionAnalysisResult = {
  acousticSignature: {
    lufsIntegrated: -16.2,
    lufsTarget: -16.0,
    lufsStatus: 'PASS',
    truePeakDbfs: -1.2,
    truePeakTarget: -1.0,
    truePeakStatus: 'PASS',
    crestFactorDb: 14.8,
    spectralCentroidHz: 2150,
    noiseFloorDbfs: -68.4,
    noiseFloorStatus: 'PASS',
    snrDb: 52.2
  },
  narratorAudit: {
    totalWords: 1420,
    estimatedDurationMinutes: 9.16,
    actualDurationMinutes: 9.22,
    pacingWpm: 155,
    pacingStatus: 'OPTIMAL',
    pronunciationAccuracy: 99.4,
    pronunciationStatus: 'PASS',
    emotionalArcAdherence: 97.5,
    breathControlScore: 95.0,
    monotonyIndex: 12.4,
    dynamicRangeScore: 94.0
  },
  environmentAudit: {
    roomProfile: 'High-Fidelity Anechoic Chamber',
    reverbRt60Ms: 145,
    reverbStatus: 'OPTIMAL',
    dcOffset: 0.000012,
    stereoCorrelation: 0.99,
    noiseFloorDbfs: -68.4
  },
  executiveVerdict: {
    commercialReadinessGrade: 'A+ (Broadcast Certified)',
    distributionClearance: 'CERTIFIED',
    score: 96,
    executiveSummary: 'Full-spectrum acoustic compliance verified. Excellent transient control, compliant true peak headroom, and certified delivery specs.',
    actionableFixes: ['Audio passes all QC criteria for Audible ACX, Spotify, Apple Podcasts, and BBC Broadcast.']
  }
};

const INITIAL_CLIENT_REPORT: ClientAudioReport = {
  projectName: 'Master Audio Delivery Audit',
  clientName: 'Enterprise Audio Publisher',
  dateGenerated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  audioDuration: '9m 13s',
  overallScore: 96,
  gradeLabel: 'Certified Broadcast Master',
  summary: 'Audio exceeds commercial streaming and broadcast delivery standards. High vocal clarity, perfectly balanced spectral profile, and full multi-platform compliance.',
  vocalClarity: {
    score: 98,
    description: 'Pristine vocal intelligibility with zero frequency masking or harsh sibilance.'
  },
  technicalQuality: {
    score: 95,
    description: 'Complies with EBU R128 (-16.2 LUFS) and TruePeak ceiling (-1.2 dBFS).'
  },
  dynamicRange: {
    score: 93,
    description: 'Natural speech dynamics preserved with a crest factor of 14.8 dB.'
  },
  stereoQuality: {
    type: 'Monophonic Centered',
    description: 'Clean mono-compatibility, zero phase cancellation detected.'
  },
  qualityAssurance: [
    'Integrated Loudness: -16.2 LUFS (Target: -16.0 ± 1.0 LUFS)',
    'True Peak Maximum: -1.2 dBFS (Ceiling: -1.0 dBFS)',
    'Noise Floor Floor: -68.4 dBFS (Threshold: < -60 dBFS)',
    'Phase Correlation: +0.99 (In-Phase Standard)'
  ],
  platformCompliance: {
    'Audible (ACX)': { required: 'Peak < -3.0 dB, Noise < -60 dB, RMS -23 to -18 dB', actual: 'Peak: -1.2 dB, Noise: -68.4 dB, LUFS: -16.2', compliant: true },
    'Apple Podcasts': { required: 'Loudness: -16 ± 1 LUFS, Peak < -1.0 dB', actual: 'LUFS: -16.2, Peak: -1.2 dB', compliant: true },
    'Spotify Podcasts': { required: 'Loudness: -14 LUFS, Peak < -1.0 dB', actual: 'LUFS: -16.2, Peak: -1.2 dB', compliant: true },
    'Broadcast TV (EBU R128)': { required: 'Loudness: -23 ± 0.5 LUFS, TruePeak < -1.0 dB', actual: 'LUFS: -16.2, Peak: -1.2 dB', compliant: false }
  },
  technicalSpecs: {
    lufs: -16.2,
    truePeak: -1.2,
    noiseFloor: -68.4,
    crestFactor: 14.8,
    sampleRate: '48,000 Hz',
    bitDepth: '24-bit PCM Linear',
    stereoWidth: 'Balanced Center',
    duration: '09:13.200'
  },
  recommendation: 'Approved for global distribution across major commercial platforms.'
};

export const AudioAnalyzerApp: React.FC<AudioAnalyzerAppProps> = ({ onBackToHub }) => {
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'CLIENT' | 'REALTIME'>('DOSSIER');
  
  const [prodResult, setProdResult] = useState<ProductionAnalysisResult>(INITIAL_PROD_RESULT);
  const [clientReport, setClientReport] = useState<ClientAudioReport>(INITIAL_CLIENT_REPORT);
  const [speakers] = useState<SpeakerProfile[]>(INITIAL_SPEAKERS);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsAuditing(true);
    setAuditMessage(`Analyzing acoustic profile of "${file.name}"...`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      
      const { productionResult, forensicData, clientReport: newReport } = await analyzeAudioBufferHeuristic(decoded);
      
      newReport.projectName = file.name;
      setProdResult(productionResult);
      setClientReport(newReport);
      setAuditMessage(`Audit complete for ${file.name}. Metrics updated!`);
    } catch (err: any) {
      console.error('Audio audit failed:', err);
      setAuditMessage(`Failed to inspect file: ${err.message || 'Corrupted audio'}`);
    } finally {
      setIsAuditing(false);
      setTimeout(() => setAuditMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
              >
                <ArrowLeft className="w-4 h-4" /> Hub
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Stage 4</span>
                <span className="text-slate-500">•</span>
                <h1 className="text-sm font-black text-white font-mono tracking-tight uppercase">Audio Analyzer & Forensic Dossier</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Loudness Compliance, Acoustic Telemetry & Commercial Delivery QA</p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('DOSSIER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'DOSSIER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Forensic Dossier
            </button>
            <button
              onClick={() => setActiveTab('CLIENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'CLIENT'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Client Delivery Sheet
            </button>
            <button
              onClick={() => setActiveTab('REALTIME')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'REALTIME'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Live Spectrum QA
            </button>
          </div>

          {/* Quick File Audit Uploader */}
          <div className="flex items-center gap-3">
            <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>{isAuditing ? 'Auditing...' : 'Inspect Audio File'}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={isAuditing}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </header>

      {/* Live notification banner */}
      {auditMessage && (
        <div className="bg-cyan-950/80 border-b border-cyan-500/30 text-cyan-200 px-6 py-2 text-xs font-mono flex items-center justify-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{auditMessage}</span>
        </div>
      )}

      {/* Main Views */}
      <main className="flex-1 overflow-y-auto p-6 max-w-[1920px] mx-auto w-full">
        {activeTab === 'DOSSIER' && (
          <ConsolidatedDossierReport
            uploadedFile={uploadedFile}
            analysisResult={null}
            editableSpeakers={speakers}
            prodResult={prodResult}
            forensicResult={null}
            forensicMetrics={null}
            narratorResult={prodResult.narratorAudit || null}
            environmentResult={prodResult.environmentAudit || null}
            clientReportResult={clientReport}
          />
        )}

        {activeTab === 'CLIENT' && (
          <ClientDeliveryReport
            clientReportResult={clientReport}
            onDownloadPdf={() => {
              window.print();
            }}
          />
        )}

        {activeTab === 'REALTIME' && (
          <div className="space-y-6">
            <RealtimeMasteringPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default AudioAnalyzerApp;
