import React, { useState } from 'react';
import { StoryFlixApp } from './modules/storyflix/StoryFlixApp';
import JarvisScriptingApp from './modules/jarvis-scripting/JarvisScriptingApp';
import { IHackAudioTtsApp } from './modules/ihack-audio-tts/IHackAudioTtsApp';
import { AudioAnalyzerApp } from './modules/audio-analyzer/AudioAnalyzerApp';
import { Sparkles, Film, Headphones, BarChart3, ChevronRight, Layers } from 'lucide-react';

export type AppModuleId = 'storyflix' | 'jarvis' | 'ihack' | 'audio';

interface ModuleConfig {
  id: AppModuleId;
  stageNumber: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBg: string;
  borderColor: string;
  activeTextColor: string;
}

const MODULES: ModuleConfig[] = [
  {
    id: 'storyflix',
    stageNumber: '1',
    name: 'StoryFlix',
    subtitle: 'Manuscript & Narrative Engine',
    icon: Sparkles,
    accentColor: 'amber',
    activeBg: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    activeTextColor: 'text-amber-400'
  },
  {
    id: 'jarvis',
    stageNumber: '2',
    name: 'Jarvis Scripting',
    subtitle: '5-Phase Cinematic Pipeline',
    icon: Film,
    accentColor: 'indigo',
    activeBg: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/40',
    activeTextColor: 'text-indigo-400'
  },
  {
    id: 'ihack',
    stageNumber: '3',
    name: 'iHack Audio TTS',
    subtitle: 'Neural Studio & Sonic Forge',
    icon: Headphones,
    accentColor: 'emerald',
    activeBg: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    activeTextColor: 'text-emerald-400'
  },
  {
    id: 'audio',
    stageNumber: '4',
    name: 'Audio Analyzer',
    subtitle: 'Forensic Dossier & QA Delivery',
    icon: BarChart3,
    accentColor: 'cyan',
    activeBg: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    activeTextColor: 'text-cyan-400'
  }
];

export default function App() {
  const [activeModule, setActiveModule] = useState<AppModuleId>('storyflix');

  return (
    <div className="w-full h-screen bg-[#070a13] text-white flex flex-col font-sans overflow-hidden">
      {/* Top Global Command Hub Switcher */}
      <header className="px-4 py-2.5 bg-[#090d19]/95 backdrop-blur-xl border-b border-white/10 z-50 shrink-0 shadow-2xl">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-indigo-500 to-cyan-500 p-[1px] shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent font-mono">
                  JARVIS OS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10">
                  v4.2 Modular
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-400">Audiobook, Scripting & Acoustic Mastering Suite</p>
            </div>
          </div>

          {/* 4 Pipeline Stages Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {MODULES.map((mod, idx) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;

              return (
                <React.Fragment key={mod.id}>
                  <button
                    onClick={() => setActiveModule(mod.id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 group text-left ${
                      isActive
                        ? `${mod.activeBg} ${mod.borderColor} shadow-lg shadow-black/40`
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-black ${
                      isActive ? `${mod.activeBg} ${mod.activeTextColor}` : 'bg-white/5 text-slate-400 group-hover:text-white'
                    }`}>
                      {mod.stageNumber}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? mod.activeTextColor : 'text-slate-400 group-hover:text-white'}`} />
                        <span className={`text-xs font-bold font-mono tracking-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {mod.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 hidden xl:inline-block font-mono">
                        {mod.subtitle}
                      </span>
                    </div>
                  </button>

                  {idx < MODULES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Module Content Mount */}
      <main className="flex-1 overflow-hidden relative z-10">
        {activeModule === 'storyflix' && <StoryFlixApp />}
        {activeModule === 'jarvis' && <JarvisScriptingApp />}
        {activeModule === 'ihack' && <IHackAudioTtsApp />}
        {activeModule === 'audio' && <AudioAnalyzerApp />}
      </main>
    </div>
  );
}
