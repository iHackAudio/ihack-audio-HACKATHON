import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Square, Sliders, X, Sparkles, Zap, RotateCcw } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { TTSPresetName } from '../utils/tts';

interface TTSSettingsModalProps {
  tts: ReturnType<typeof useTTS>;
  onClose: () => void;
}

export default function TTSSettingsModal({ tts, onClose }: TTSSettingsModalProps) {
  const [testScript, setTestScript] = useState('Welcome to Jarvis OS. Auto text-to-speech synthesis engine is active and ready.');

  const presets: { id: TTSPresetName; label: string; desc: string }[] = [
    { id: 'narrator', label: 'Narrator', desc: 'Balanced 0.85x speed for cinematic storytelling' },
    { id: 'dramatic', label: 'Dramatic', desc: 'Slow 0.72x speed with lowered pitch' },
    { id: 'slow', label: 'Slow / Deep', desc: 'Deep resonance at 0.60x speed' },
    { id: 'podcast', label: 'Podcast', desc: 'Clear natural 1.0x conversational pace' },
    { id: 'fast', label: 'Fast Read', desc: 'Brisk 1.40x review speed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0c0f1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans relative">
        {/* Holographic Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#070912] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${tts.isSpeaking ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                TTS Speech Studio
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                Web Speech API // System Voice Synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Auto-TTS Toggle */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase">Auto-Vocalize Responses</span>
                {tts.autoSpeak && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically speak incoming agent messages as they complete
              </p>
            </div>
            <button
              onClick={tts.toggleAutoSpeak}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                tts.autoSpeak
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {tts.autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {tts.autoSpeak ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Preset Chips */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Voice Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map(p => {
                const isActive = tts.activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => tts.applyPreset(p.id)}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold uppercase">{p.label}</div>
                    <div className="text-[9px] text-slate-400 truncate">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Selector */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Browser System Voice ({tts.voices.length} available)
            </label>
            <select
              value={tts.voices.findIndex(v => v.name === tts.selectedVoice?.name)}
              onChange={(e) => tts.setSelectedVoiceIndex(parseInt(e.target.value))}
              className="w-full bg-[#070912] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            >
              {tts.voices.map((v, i) => (
                <option key={i} value={i}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate & Pitch Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 uppercase">Rate (Speed)</span>
                <span className="text-cyan-400 font-bold">{tts.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.0"
                step="0.05"
                value={tts.rate}
                onChange={(e) => tts.setRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 uppercase">Pitch</span>
                <span className="text-cyan-400 font-bold">{tts.pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={tts.pitch}
                onChange={(e) => tts.setPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Test Playground */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Speech Test Studio
            </label>
            <textarea
              value={testScript}
              onChange={(e) => setTestScript(e.target.value)}
              rows={3}
              placeholder="Type script here to test audio output..."
              className="w-full bg-[#070912] border border-white/10 rounded-lg p-2.5 text-xs font-sans text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (tts.isSpeaking) {
                    tts.stop();
                  } else {
                    tts.speak(testScript);
                  }
                }}
                className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tts.isSpeaking
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                }`}
              >
                {tts.isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {tts.isSpeaking ? 'Stop Speaking' : 'Test Speech'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Status Bar */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#070912] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tts.isSpeaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-slate-400">
              {tts.isSpeaking ? 'Engine Speaking...' : 'Ready'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-mono uppercase text-[10px] font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
