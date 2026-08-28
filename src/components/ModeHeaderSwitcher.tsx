import React from 'react';
import { Zap, MessageSquare, Lock, Shield, Sparkles } from 'lucide-react';
import { AppMode } from '../types/discussion';

interface ModeHeaderSwitcherProps {
  mode: AppMode;
  onModeChange: (newMode: AppMode) => void;
  lockedCount?: number;
  totalLocksCount?: number;
}

export default function ModeHeaderSwitcher({
  mode,
  onModeChange,
  lockedCount = 0,
  totalLocksCount = 0
}: ModeHeaderSwitcherProps) {
  return (
    <div className="flex items-center gap-1.5 bg-[#090e1a] p-1 rounded-lg border border-white/10 shadow-inner select-none">
      <button
        type="button"
        onClick={() => onModeChange('hardcore')}
        className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
          mode === 'hardcore'
            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300'
            : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
        }`}
        title="Hardcore Pipeline Mode: Rigid 5-Phase Tournament & CPSD Generation"
      >
        <Zap className={`w-3.5 h-3.5 ${mode === 'hardcore' ? 'text-slate-950 animate-pulse' : 'text-amber-400'}`} />
        <span>HARDCORE MODE</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
          mode === 'hardcore' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500/20 text-amber-300'
        }`}>
          STRICT 5P
        </span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange('discussion')}
        className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
          mode === 'discussion'
            ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-[0_0_14px_rgba(14,165,233,0.5)] border border-sky-300/60'
            : 'text-slate-400 hover:text-sky-300 hover:bg-white/5'
        }`}
        title="Discussion Mode: Subtextual AI Conversational Studio with Story Bible Locking System"
      >
        <MessageSquare className={`w-3.5 h-3.5 ${mode === 'discussion' ? 'text-sky-200 animate-bounce' : 'text-sky-400'}`} />
        <span>DISCUSSION MODE</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-1 ${
          mode === 'discussion' ? 'bg-slate-950/40 text-sky-200 border border-sky-300/40' : 'bg-sky-500/20 text-sky-300'
        }`}>
          <Lock className="w-2.5 h-2.5 text-amber-300" />
          <span>{lockedCount} LOCKED</span>
        </span>
      </button>
    </div>
  );
}
