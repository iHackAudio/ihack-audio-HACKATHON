import React, { useState } from 'react';
import { 
  FileText, Cpu, ShieldCheck, Database, Terminal, Sparkles, Zap, ArrowLeft, 
  Activity, Play, Check, Copy, RefreshCw, AlertCircle, RefreshCcw
} from 'lucide-react';
import { Button } from './Button';
import { ViewState } from '../types/ihackAudioTypes';

interface MedicalScriptPanelProps {
  scriptText: string;
  setScriptText: (val: string) => void;
  onGoBack: () => void;
  logApiRequest: (title: string, model: string, type: 'TEXT' | 'IMAGE' | 'AUDIO', details: any) => void;
  setToast: (msg: string | null) => void;
  // State from App.tsx passed down
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  podcastMode: 'SINGLE' | 'MULTI';
  setPodcastMode: (val: 'SINGLE' | 'MULTI') => void;
}

export const MODELS_LIST = [
  'gemini-3.1-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.5-flash-lite'
];

export const MedicalScriptPanel: React.FC<MedicalScriptPanelProps> = ({
  scriptText,
  setScriptText,
  onGoBack,
  logApiRequest,
  setToast,
  selectedModel,
  setSelectedModel,
  podcastMode,
  setPodcastMode
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localEditText, setLocalEditText] = useState(scriptText);

  // Sync internal edit buffer with parent script text when changed externally
  React.useEffect(() => {
    setLocalEditText(scriptText);
  }, [scriptText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localEditText);
    setCopied(true);
    setToast('Script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToMain = () => {
    setScriptText(localEditText);
    setToast('Applied modifications directly to the main TTS Script Engine.');
  };

  const handlePhoneticOptimize = async () => {
    if (!localEditText.trim()) {
      setToast('Script is empty! Please write or paste or let JOJO generate it first.');
      return;
    }

    setIsOptimizing(true);
    try {
      // Execute live optimization call
      const { optimizeScriptWithKineticTags } = await import('../services/geminiService');
      const { text, nodeId } = await optimizeScriptWithKineticTags(localEditText, selectedModel);
      
      setLocalEditText(text);
      setScriptText(text); // auto-sync to parent on success
      setToast(`Clinical optimization complete using Node ${nodeId}.`);
    } catch (e: any) {
      console.error(e);
      setToast(`Optimization failed: ${e.message || String(e)}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const prefillSample = () => {
    const sample = `Dr. Liang: Welcome, Dr. Brown. Today we are conducting a clinical review on Adenomyosis (add-eh-no-my-OH-sis).
Dr. Brown: Yes, Dr. Liang. It's crucial to analyze these atypical uterine cases thoroughly before performing a Hysterectomy (hiss-teh-REC-tuh-mee).`;
    setLocalEditText(sample);
    setScriptText(sample);
    setToast('Prefilled Adenomyosis Clinical script sample.');
  };

  return (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn font-sans">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-6">
          <Button onClick={onGoBack} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0 hover:border-pink-500/30 hover:bg-slate-800 transition-all duration-300" />
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <FileText className="w-8 h-8 text-pink-500 animate-pulse" />
              Medical Script Lab
            </h2>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold mt-1">Clinical Audio Engineering Interface</p>
          </div>
        </div>

        {/* Live Audio Keys Overview */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-white/5 font-mono text-[9px]">
          <div className="flex items-center gap-2 border-r border-white/5 pr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-500">Node-1A (Audio):</span>
            <span className="text-slate-300">AIzaSyB...yWY</span>
          </div>
          <div className="flex items-center gap-2 border-r border-white/5 pr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-500">Node-2A (Script):</span>
            <span className="text-slate-300">AIzaSyD...Go</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-500">Node-4A (Backup):</span>
            <span className="text-slate-300">AIzaSyD...Ni9c</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Controller / Options */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI MODEL CONFIG */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/5 flex flex-col gap-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <Cpu className="w-5 h-5 text-pink-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Neural Brain Setting</h3>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-pink-500/80">Active Medical Model</label>
              <div className="relative">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 font-mono text-xs border border-white/10 rounded-xl p-3.5 focus:border-pink-500/50 focus:outline-none cursor-pointer appearance-none"
                >
                  {MODELS_LIST.map(model => (
                    <option key={model} value={model} className="bg-slate-950 text-slate-200">{model}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs font-mono">▼</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-400/80">Production Alignment</label>
              <div className="bg-slate-950/80 p-1 rounded-2xl border border-white/10 flex items-center">
                <button 
                  onClick={() => setPodcastMode('SINGLE')} 
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'SINGLE' ? 'bg-pink-500 text-slate-950 font-black' : 'text-slate-500 hover:text-pink-400'}`}
                >
                  Mono Speaker
                </button>
                <button 
                  onClick={() => setPodcastMode('MULTI')} 
                  className={`flex-1 py-12 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'MULTI' ? 'bg-pink-500 text-slate-950 font-black' : 'text-slate-500 hover:text-pink-400'}`}
                  style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                >
                  Duo Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* JOJO LIVE INTEG STATUS */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">JOJO Voice Link</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Telem Alive</span>
            </div>

            <div className="flex flex-col gap-3 font-mono text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <span>Telemetry Sync Interval:</span>
                <span className="text-emerald-400 font-bold">Realtime (HMR Off)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>JOJO Script Read Access:</span>
                <span className="text-emerald-400 font-bold">Granted (Snapshot)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>JOJO Script Write Access:</span>
                <span className="text-emerald-400 font-bold">Enabled (Auto-Pilot)</span>
              </div>
              <div className="mt-2 border-t border-white/5 pt-2 text-[9px] text-slate-500 text-center">
                Tell JOJO "write standard medical guidelines" or "update script context" to see her write lines directly into this script workspace.
              </div>
            </div>
          </div>

          {/* ACTIONS AND PREFILL */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/5 flex flex-col gap-3 shadow-xl">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quick Actions / Tools</h4>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={prefillSample}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl py-3 text-[10px] tracking-widest uppercase font-black text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer"
              >
                Prefill Clinical Sample
              </button>
              <button 
                onClick={() => {
                  setLocalEditText('');
                  setScriptText('');
                  setToast('Cleared active script workspace.');
                }}
                className="w-full bg-slate-950 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/20 rounded-xl py-3 text-[10px] tracking-widest uppercase font-black text-rose-400 transition-all cursor-pointer"
              >
                Clear Script Area
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Large Editor / Read-Write syncing script Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-[2rem] bg-slate-900/60 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-pink-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Active Script Workspace</h3>
                <span className="font-mono text-[9px] text-slate-500 font-medium">({Math.round(localEditText.length / 4)} tokens)</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 rounded-lg border border-white/5 hover:border-white/20 text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <button
                  onClick={handleApplyToMain}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 rounded-lg border border-white/5 hover:border-slate-400/20 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Text
                </button>
              </div>
            </div>

            {/* TEXTAREA WRITING WORKSPACE */}
            <div className="relative">
              <textarea
                value={localEditText}
                onChange={(e) => {
                  setLocalEditText(e.target.value);
                  // Continuously syncing to parent
                  setScriptText(e.target.value);
                }}
                placeholder="Write medical transcript narrative here or ask JOJO to assist writing..."
                className="w-full h-[450px] bg-slate-950/70 p-5 rounded-2xl border border-white/10 font-mono text-xs text-slate-200 placeholder:text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-pink-500/40 custom-scrollbar"
              />
              {isOptimizing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
                  <RefreshCw className="w-10 h-10 text-pink-500 animate-spin" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-200">Optimizing Phonetics</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">Routing request through model {selectedModel}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                <AlertCircle className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
                <span className="font-bold uppercase tracking-wider text-slate-400">Rules applied:</span>
                <span className="text-slate-500">Australian Phonetic Cadence, Verbatim Retention, High Realism.</span>
              </div>
              <Button
                onClick={handlePhoneticOptimize}
                disabled={isOptimizing || !localEditText.trim()}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl h-11 px-6 text-xs font-black uppercase w-full sm:w-auto tracking-wider cursor-pointer"
                icon={<Sparkles className="w-4 h-4 animate-pulse" />}
              >
                Live Phonetic Optimizer
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
