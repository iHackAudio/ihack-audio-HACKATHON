import React, { useState } from 'react';
import { 
  Headphones, Radio, Sliders, FileText, Sparkles, 
  Volume2, ShieldCheck, Cpu, Mic, Settings
} from 'lucide-react';
import { NeuralStudioSynthesis } from './components/NeuralStudioSynthesis';
import { SonicForgePanel } from './components/SonicForgePanel';
import { MedicalScriptPanel } from './components/MedicalScriptPanel';
import EdgeTtsStudioModal from './components/EdgeTtsStudioModal';
import TTSSettingsModal from './components/TTSSettingsModal';
import VoiceModal from './components/VoiceModal';
import { useTTS } from './hooks/useTTS';
import { useVoiceSession } from './hooks/useVoiceSession';

interface IHackAudioTtsAppProps {
  onBackToHub?: () => void;
}

export type IHackSubView = 'STUDIO' | 'SONIC_FORGE' | 'MEDICAL_LAB';

export const IHackAudioTtsApp: React.FC<IHackAudioTtsAppProps> = ({ onBackToHub }) => {
  const [subView, setSubView] = useState<IHackSubView>('STUDIO');
  
  // Modals
  const [showEdgeTts, setShowEdgeTts] = useState<boolean>(false);
  const [showTtsSettings, setShowTtsSettings] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // Shared hooks for voice preview & live synthesis
  const ttsHook = useTTS();
  const voiceSessionHook = useVoiceSession();

  // State for Medical Script Lab
  const [medicalScript, setMedicalScript] = useState<string>(
    '# CLINICAL BRIEFING: HYPOTHALAMIC REGULATION\n\nPatient presents with acute autonomic dysregulation following cranial trauma. Standard protocol indicates immediate telemetry monitoring with real-time waveform tracking.'
  );
  const [medicalModel, setMedicalModel] = useState<string>('gemini-3.1-pro-preview');
  const [medicalMode, setMedicalMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sub-Header Navigation */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Stage 3</span>
                <span className="text-slate-500">•</span>
                <h1 className="text-sm font-black text-white font-mono tracking-tight">iHack Audio TTS</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Neural Speech Synthesis & Forensic Audio Engineering</p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSubView('STUDIO')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'STUDIO'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Neural Studio
            </button>
            <button
              onClick={() => setSubView('SONIC_FORGE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'SONIC_FORGE'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Sonic Forge
            </button>
            <button
              onClick={() => setSubView('MEDICAL_LAB')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'MEDICAL_LAB'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Medical Script Lab
            </button>
          </div>

          {/* Quick Utility Triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEdgeTts(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
              title="Open Edge-TTS Studio"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Edge-TTS
            </button>
            <button
              onClick={() => setShowTtsSettings(true)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
              title="Voice Synthesizer Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        {subView === 'STUDIO' && (
          <NeuralStudioSynthesis onBackToHub={onBackToHub} isStudio={true} />
        )}

        {subView === 'SONIC_FORGE' && (
          <SonicForgePanel />
        )}

        {subView === 'MEDICAL_LAB' && (
          <div className="max-w-6xl mx-auto p-6">
            <MedicalScriptPanel
              scriptText={medicalScript}
              setScriptText={setMedicalScript}
              onGoBack={() => setSubView('STUDIO')}
              logApiRequest={(title, model, type, details) => {
                console.log('[Medical Script Log]', title, model, details);
              }}
              setToast={(msg) => console.log(msg)}
              selectedModel={medicalModel}
              setSelectedModel={setMedicalModel}
              podcastMode={medicalMode}
              setPodcastMode={setMedicalMode}
            />
          </div>
        )}
      </main>

      {/* Edge-TTS Modal */}
      {showEdgeTts && (
        <EdgeTtsStudioModal onClose={() => setShowEdgeTts(false)} />
      )}

      {/* TTS Settings Modal */}
      {showTtsSettings && (
        <TTSSettingsModal tts={ttsHook} onClose={() => setShowTtsSettings(false)} />
      )}

      {/* Voice Assistant Session Modal */}
      {showVoiceModal && (
        <VoiceModal onClose={() => setShowVoiceModal(false)} sessionHook={voiceSessionHook} />
      )}
    </div>
  );
};

export default IHackAudioTtsApp;
