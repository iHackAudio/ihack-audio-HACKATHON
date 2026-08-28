import React from 'react';
import { Film, Sparkles, Users, Grid, BookOpen, RefreshCw, CheckCircle2, Download, Upload, MessageSquare, FileText } from 'lucide-react';
import { StoryFlixStep, StoryFlixBible } from '../types/storyFlix';

interface StoryFlixHeaderProps {
  currentStep: StoryFlixStep;
  onStepChange: (step: StoryFlixStep) => void;
  bible: StoryFlixBible;
  isSyncing: boolean;
  onToggleViewer: () => void;
  onExportJson: () => void;
  onExportMd: () => void;
  onOpenImport: () => void;
  onOpenCritique: () => void;
}

export const StoryFlixHeader: React.FC<StoryFlixHeaderProps> = ({
  currentStep,
  onStepChange,
  bible,
  isSyncing,
  onToggleViewer,
  onExportJson,
  onExportMd,
  onOpenImport,
  onOpenCritique
}) => {
  const steps: Array<{ id: StoryFlixStep; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'core_idea', label: '1. Core Idea', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'personas', label: '2. Personas', icon: <Users className="w-3.5 h-3.5" />, count: bible.characterProfiles?.length || 0 },
    { id: 'scene_matrix', label: '3. Scene Matrix', icon: <Grid className="w-3.5 h-3.5" />, count: bible.sceneIdeaMatrix?.length || 0 },
    { id: 'cpsd_document', label: '4. CPSD Document', icon: <FileText className="w-3.5 h-3.5" />, count: bible.scenes?.length || 0 }
  ];

  return (
    <header className="bg-[#0b0f19]/95 backdrop-blur-md border-b border-sky-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none shadow-lg">
      {/* Brand & Story Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-sky-400/30 px-3 py-1.5 rounded-xl">
          <Film className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-black text-sm tracking-wider bg-gradient-to-r from-amber-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            StoryFlix
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-sky-300/80 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-500/30">
            Engine
          </span>
        </div>

        {bible.concept.title && (
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-xl text-xs text-slate-300">
            <span className="text-slate-500 font-semibold">Story:</span>
            <span className="font-bold text-white max-w-[220px] truncate">{bible.concept.title}</span>
          </div>
        )}
      </div>

      {/* 3 Step Navigation Pills */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
        {steps.map((s) => {
          const isActive = currentStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onStepChange(s.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.4)] border border-sky-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {s.icon}
              <span>{s.label}</span>
              {typeof s.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Actions & CPSD Controls */}
      <div className="flex items-center gap-2">
        {/* Live Sync Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-[11px] font-mono text-slate-300">
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
          <span>v{bible.version} {isSyncing ? 'Syncing...' : 'CPSD Live'}</span>
        </div>

        {/* AI Narrative Critique Modal */}
        <button
          onClick={onOpenCritique}
          className="p-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          title="Run AI Story Bible Narrative Audit"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">AI Critique</span>
        </button>

        {/* Live CPSD & Story Bible Inspector Drawer */}
        <button
          onClick={onToggleViewer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          title="Open Live CPSD & Story Bible Inspector"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">CPSD Dossier</span>
        </button>

        {/* Quick Export & Import */}
        <button
          onClick={onExportMd}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs cursor-pointer"
          title="Download CPSD Markdown (.md)"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
        </button>

        <button
          onClick={onOpenImport}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs cursor-pointer"
          title="Import JSON / MD Story Bible"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>
    </header>
  );
};
