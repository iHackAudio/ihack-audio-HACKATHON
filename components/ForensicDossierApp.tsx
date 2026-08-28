import React, { useState } from 'react';
import { 
  BarChart3, FileCheck, ArrowLeft, Upload, Download, Sparkles, 
  Activity, ShieldAlert, FileText, CheckCircle2, Award, Headphones
} from 'lucide-react';
import { ConsolidatedDossierReport } from './ConsolidatedDossierReport';
import { ClientDeliveryReport } from './ClientDeliveryReport';
import { 
  ProductionAnalysisResult, 
  ForensicData, 
  AudioMetrics, 
  NarratorAuditResult, 
  EnvironmentAuditResult, 
  ClientAudioReport, 
  SpeakerProfile 
} from '../types';

interface ForensicDossierAppProps {
  onBackToHub?: () => void;
}

const SAMPLE_SPEAKERS: SpeakerProfile[] = [
  { id: 'narrator', name: 'Dr. Liang', role: 'Medical Specialist', accent: 'Australian Cultivated', pitch: 'Mid-Low', pacingWpm: 155, consistencyScore: 98 },
  { id: 'character', name: 'Academic Researcher', role: 'Case Subject', accent: 'Australian General', pitch: 'High-Mid', pacingWpm: 162, consistencyScore: 96 }
];

const SAMPLE_PROD_RESULT: ProductionAnalysisResult = {
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
    phoneticRespellingCompliance: 100
  },
  environmentAudit: {
    roomAcousticProfile: 'Treated Studio Whisper Room',
    reverbRt60Ms: 140,
    reverbStatus: 'PASS',
    backgroundArtifacts: 'None detected (Below -70 dBFS noise gate threshold)',
    stereoBalanceCorrelation: 0.98,
    dcOffsetPercent: 0.001
  },
  executiveVerdict: {
    overallGrade: 'A+',
    deliveryReadiness: 'READY_FOR_COMMERCIAL_DISTRIBUTION',
    keyFindings: [
      'Loudness perfectly aligned to EBU R128 / ACX standard (-16.2 LUFS).',
      'Non-rhotic Australian phonetics successfully synthesized for all clinical terminology.',
      'High dynamic range preserved (14.8 dB crest factor) with zero clipping.'
    ],
    recommendedRemediations: []
  }
};

const SAMPLE_CLIENT_REPORT: ClientAudioReport = {
  projectName: 'Clinical Audio Drama Episode 1',
  clientName: 'Medical Research Publishing',
  dateGenerated: new Date().toLocaleDateString(),
  audioDuration: '09:13',
  masterQualityGrade: 'Studio Master Tier 1',
  complianceChecklist: [
    { rule: 'Integrated Loudness (-16 ± 1 LUFS)', passed: true, details: '-16.2 LUFS (Compliant)' },
    { rule: 'True Peak (≤ -1.0 dBFS)', passed: true, details: '-1.2 dBFS (Compliant)' },
    { rule: 'Noise Floor (≤ -60 dBFS)', passed: true, details: '-68.4 dBFS (Compliant)' },
    { rule: 'Pacing (150-165 WPM)', passed: true, details: '155 WPM (Optimal)' },
    { rule: 'Pronunciation Guide Adherence', passed: true, details: '100% Medical Phonetic Accuracy' }
  ],
  distributionStatus: 'APPROVED_FOR_RELEASE'
};

export default function ForensicDossierApp({ onBackToHub }: ForensicDossierAppProps) {
  const [activeReportTab, setActiveReportTab] = useState<'dossier' | 'client'>('dossier');

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col font-sans animate-fadeIn">
      {/* Header */}
      <div className="h-14 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          {onBackToHub && (
            <button 
              onClick={onBackToHub}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2 font-mono">
                FORENSIC DOSSIER <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Mastering Audit</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveReportTab('dossier')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeReportTab === 'dossier'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Consolidated Forensic Dossier
          </button>
          <button
            onClick={() => setActiveReportTab('client')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeReportTab === 'client'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Client Delivery Sheet
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-[1800px] mx-auto w-full">
        {activeReportTab === 'dossier' ? (
          <ConsolidatedDossierReport
            uploadedFile={null}
            analysisResult={null}
            editableSpeakers={SAMPLE_SPEAKERS}
            prodResult={SAMPLE_PROD_RESULT}
            forensicResult={null}
            forensicMetrics={null}
            narratorResult={SAMPLE_PROD_RESULT.narratorAudit}
            environmentResult={SAMPLE_PROD_RESULT.environmentAudit}
            clientReportResult={SAMPLE_CLIENT_REPORT}
          />
        ) : (
          <ClientDeliveryReport
            clientReportResult={SAMPLE_CLIENT_REPORT}
            onDownloadPdf={() => {}}
          />
        )}
      </div>
    </div>
  );
}
