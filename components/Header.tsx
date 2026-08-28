import React from 'react';
import { Settings, Database, Headphones, Film, Terminal, BarChart3, Home, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { ViewState } from '../types';
import { useAuth } from '../src/context/AuthContext';

export function Header({ 
  currentView,
  onSelectView,
  auphonicUsername, 
  setAuphonicUsername, 
  auphonicPassword, 
  setAuphonicPassword, 
  onOpenLedger, 
  ledgerMetrics, 
  hasUnsavedChanges, 
  onWipeBackup 
}: any) {
  const { user, loginWithGoogle, logout } = useAuth();
  const isTtsActive = currentView === ViewState.HOME || currentView === ViewState.QUICK_LAB || currentView === ViewState.STUDIO_SYNTHESIS || currentView === ViewState.SONIC_FORGE || currentView === ViewState.MEDICAL_SCRIPT;
  const isStoryActive = currentView === ViewState.STORY_STUDIO;
  const isJarvisActive = currentView === ViewState.JARVIS_AURA || currentView === ViewState.JARVIS_CONSOLE || currentView === ViewState.JOJO_ENGINE;
  const isForensicActive = currentView === ViewState.FORENSIC_DOSSIER;

  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => onSelectView && onSelectView(ViewState.HOME)}
          className="font-black text-lg tracking-widest text-white flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <Home className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>IHACK<span className="text-emerald-500">VOICE</span></span>
        </button>

        {/* 4 Core Serialized Pipeline Apps Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-white/10 p-1 rounded-2xl">
          {/* Stage 1: Story Studio */}
          <button
            onClick={() => onSelectView && onSelectView(ViewState.STORY_STUDIO)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isStoryActive ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 font-mono font-black">1</span>
            <Film className="w-3.5 h-3.5" />
            <span>Story Studio</span>
          </button>

          <span className="text-slate-600 font-mono text-xs">➔</span>

          {/* Stage 2: Jarvis Aura Scripting */}
          <button
            onClick={() => onSelectView && onSelectView(ViewState.JARVIS_AURA)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isJarvisActive ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono font-black">2</span>
            <Terminal className="w-3.5 h-3.5" />
            <span>Jarvis Scripting</span>
          </button>

          <span className="text-slate-600 font-mono text-xs">➔</span>

          {/* Stage 3: iHack Audio TTS */}
          <button
            onClick={() => onSelectView && onSelectView(ViewState.QUICK_LAB)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isTtsActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono font-black">3</span>
            <Headphones className="w-3.5 h-3.5" />
            <span>iHack Audio TTS</span>
          </button>

          <span className="text-slate-600 font-mono text-xs">➔</span>

          {/* Stage 4: Audio Analyzer */}
          <button
            onClick={() => onSelectView && onSelectView(ViewState.FORENSIC_DOSSIER)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isForensicActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-300 font-mono font-black">4</span>
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Audio Analyzer</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
         <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-white/5 p-1 rounded-xl">
           <input type="text" placeholder="Auphonic User" value={auphonicUsername} onChange={e => setAuphonicUsername(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-emerald-500 w-28" />
           <input type="password" placeholder="Password" value={auphonicPassword} onChange={e => setAuphonicPassword(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-emerald-500 w-28" />
         </div>
         {hasUnsavedChanges && (
           <Button size="sm" onClick={onWipeBackup} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20 text-[11px]" icon={<Database className="w-3.5 h-3.5" />}>Purge Backup</Button>
         )}
         <Button size="sm" onClick={onOpenLedger} className="bg-slate-800 text-slate-300 hover:text-white border-white/10 text-[11px]" icon={<Settings className="w-3.5 h-3.5" />}>Ledger (${(ledgerMetrics?.cost || 0).toFixed(4)})</Button>

         {/* Firebase Auth Button / Avatar */}
         {user ? (
           <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1 pl-2.5 rounded-xl">
             {user.photoURL ? (
               <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-white/20" />
             ) : (
               <UserIcon className="w-4 h-4 text-emerald-400" />
             )}
             <span className="text-[11px] font-bold text-white max-w-[100px] truncate hidden md:inline">
               {user.displayName || user.email?.split('@')[0]}
             </span>
             <button
               onClick={logout}
               title="Sign Out"
               className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
             >
               <LogOut className="w-3.5 h-3.5" />
             </button>
           </div>
         ) : (
           <button
             onClick={loginWithGoogle}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
           >
             <LogIn className="w-3.5 h-3.5" />
             <span>Firebase Auth</span>
           </button>
         )}
      </div>
    </header>
  );
}

