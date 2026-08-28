import React, { useState, useEffect } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { Mic, MicOff, Settings2, ShieldAlert, Download, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function VoiceModal({ 
  onClose,
  sessionHook
}: { 
  onClose: () => void,
  sessionHook: ReturnType<typeof useVoiceSession>
}) {
  const { state, error, modelName, connectVoice, disconnectVoice } = sessionHook;
  const [voice, setVoice] = useState('Despina');
  const [thinking, setThinking] = useState('minimal');
  const [agent, setAgent] = useState('jarvis');

  const [showStudioParams, setShowStudioParams] = useState(false);
  const [scene, setScene] = useState(() => localStorage.getItem('jarvis_studio_scene') || 'A cinematic laboratory embedded inside an advanced research facility. Soft navy glass consoles hum gently.');
  const [context, setContext] = useState(() => localStorage.getItem('jarvis_studio_context') || 'A deep analytical collaboration regarding advanced systems and cybernetic security.');
  const [singleSpeakerNote, setSingleSpeakerNote] = useState(() => localStorage.getItem('jarvis_studio_single_note') || 'Style:\n* Sophisticated, polite, but with subtle dry dry British wit.\n* Direct delivery, using precise scientific data.\n\nPace:\n* Measured, authoritative, and deliberate.');

  useEffect(() => {
    localStorage.setItem('jarvis_studio_scene', scene);
  }, [scene]);

  useEffect(() => {
    localStorage.setItem('jarvis_studio_context', context);
  }, [context]);

  useEffect(() => {
    localStorage.setItem('jarvis_studio_single_note', singleSpeakerNote);
  }, [singleSpeakerNote]);

  const compileDirectives = async () => {
    let baseInst = localStorage.getItem('jarvis_instruction_v2') || '';
    if (!baseInst) {
      try {
        const res = await fetch('/api/system-instructions');
        const data = await res.json();
        if (data && data.jarvis) {
          baseInst = data.jarvis;
        }
      } catch (err) {
        console.error("Failed to fetch system instructions:", err);
      }
    }
    return `${baseInst}\n\n=== CINEMATIC HUD SETUP DIRECTIVES ===\nSCENE: ${scene}\nTOPIC: ${context}\nStyle guidelines and Pace directives:\n${singleSpeakerNote}`;
  };

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-40 transition-opacity duration-300"
      />

      {/* Slide-out Terminal Panel */}
      <motion.div 
        id="jarvis-voice-hud-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-[#070a13]/95 border-l border-white/[0.08] shadow-[0_0_50px_rgba(128,0,32,0.15)] z-50 flex flex-col font-sans overflow-hidden custom-scrollbar"
      >
        {/* Layered glows inside the panel */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] -left-[30%] w-72 h-72 rounded-full bg-red-900/15 blur-[80px]" />
          <div className="absolute bottom-[20%] -right-[30%] w-80 h-80 rounded-full bg-sky-950/20 blur-[90px]" />
        </div>

        {/* Diagonal Corner Brackets/Notches around the main panel frame */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/20 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-white/20 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-white/20 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-white/20 pointer-events-none" />

        {/* Panel Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-[#0c0f1a]/85 z-10 flex justify-between items-center relative">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 animate-fadeIn">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse-glow shadow-[0_0_10px_#ef4444]" />
              <h3 className="text-white font-mono text-sm tracking-widest font-bold uppercase">
                JARVIS_LIVE_STREAM
              </h3>
            </div>
            <span className="text-[9px] font-mono text-[#00d2ff]/60 uppercase tracking-widest mt-0.5">
              SECURE TELEMETRY DECK // PORT_3000
            </span>
          </div>
          <button 
            id="close-hud-btn"
            onClick={onClose} 
            className="text-white/40 hover:text-white border border-white/5 hover:border-white/25 bg-white/[0.02] hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer font-mono text-base"
          >
            ×
          </button>
        </div>

        {/* Panel Scrollable Core */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar z-10 relative">
          
          {/* Reactive Intelligence Core Indicator */}
          <div className="flex flex-col items-center justify-center py-4 bg-black/30 border border-white/[0.04] rounded-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00d2ff]/30 to-transparent" />
            
            {/* Dynamic Core */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Concentric Glow Underlay */}
              <div className={`absolute inset-3 rounded-full blur-2xl transition-all duration-1000 ${
                state === 'idle' ? 'bg-red-950/25 shadow-[inset_0_0_30px_rgba(128,0,32,0.15)]' :
                state === 'connecting' ? 'bg-amber-950/40 animate-pulse' :
                state === 'connected' ? 'bg-[#00d2ff]/10 shadow-[0_0_60px_rgba(0,210,255,0.25)]' :
                'bg-red-950/40'
              }`} />

              {/* Concentric Ring 1: Outer Dash */}
              <div className={`absolute inset-0 rounded-full border border-dashed border-white/[0.05] transition-colors duration-500 ${
                state === 'connected' ? 'border-[#00d2ff]/40 animate-spin-slow' : 'animate-spin-slow'
              }`} />

              {/* Concentric Ring 2: Middle Dot */}
              <div className={`absolute inset-3 rounded-full border border-dotted border-white/[0.08] transition-colors duration-500 ${
                state === 'connected' ? 'border-red-500/40 animate-spin-reverse-medium' : 'animate-spin-reverse-slow'
              }`} />

              {/* Concentric Ring 3: Inner Solid Segment */}
              <div className={`absolute inset-6 rounded-full border-2 border-l-[#00d2ff]/40 border-r-transparent border-t-red-500/40 border-b-transparent transition-all duration-500 ${
                state === 'connected' ? 'animate-spin-fast scale-105 border-l-[#00d2ff] border-t-[#800020]' : 
                state === 'connecting' ? 'animate-spin-medium border-l-amber-400' : 'animate-spin-slow'
              }`} />

              {/* Center Core Floating Disk */}
              <div className={`absolute inset-10 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${
                state === 'idle' ? 'bg-gradient-to-tr from-[#12080f] to-[#070b13] border border-red-900/30 hover:border-red-500/30' :
                state === 'connecting' ? 'bg-gradient-to-tr from-amber-950 to-slate-950 border border-amber-500/40 animate-pulse' :
                state === 'connected' ? 'bg-gradient-to-tr from-[#00d2ff]/20 to-[#800020]/25 border border-[#00d2ff]/40 shadow-[0_0_25px_rgba(0,210,255,0.25)]' :
                'bg-red-950 border border-red-500/40'
              }`}>
                {state === 'connected' ? (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 w-8 h-8 rounded-full bg-emerald-500/30 animate-ping" />
                    <Mic className="w-5 h-5 text-emerald-400 z-10 drop-shadow-[0_0_8px_#10b981]" />
                  </div>
                ) : (
                  <Mic className={`w-5 h-5 transition-all duration-500 ${
                    state === 'connecting' ? 'text-amber-400 animate-pulse' :
                    state === 'error' ? 'text-rose-500' : 'text-white/35'
                  }`} />
                )}
              </div>

              {/* Absolute micro static telemetry indicators around it */}
              <div className="absolute top-1/2 left-0 -translate-x-[110%] text-[8px] font-mono text-slate-500 flex flex-col items-end uppercase pointer-events-none leading-none gap-0.5">
                <span>R_SYS_ACTX</span>
                <span className={state === 'connected' ? 'text-[#00d2ff]' : ''}>SYS_{state}</span>
              </div>
              <div className="absolute top-1/2 right-0 translate-x-[110%] text-[8px] font-mono text-slate-500 flex flex-col items-start uppercase pointer-events-none leading-none gap-0.5">
                <span>BITRATE // 16k</span>
                <span>AUDIO_24K</span>
              </div>
            </div>

            {/* Micro Telemetry lines below the active orb */}
            <div className="w-full mt-4 pt-4 border-t border-white/[0.04] px-4 flex justify-between items-center font-mono text-[9px] text-slate-500 tracking-wider">
              <span>STREAM: {state === 'connected' ? 'SECURE_LINK' : 'STANDBY'}</span>
              <span>AUDIO_HZ: 24000 // STEREO_L0</span>
            </div>
          </div>

          {/* Status feedback line */}
          <div className="p-3 bg-[#0c0e14]/60 border border-white/[0.04] rounded-lg flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">LINK_STATE:</span>
            {state === 'idle' && <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">IDLE_STANDBY</span>}
            {state === 'connecting' && <span className="text-xs font-mono font-medium text-amber-400 animate-pulse uppercase tracking-wider">CONNECTING...</span>}
            {state === 'connected' && <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />LIVE_STREAM</span>}
            {state === 'reconnecting' && <span className="text-xs font-mono font-medium text-amber-500 animate-pulse uppercase tracking-wider">RE-ESTABLISHING...</span>}
            {state === 'error' && <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider text-right flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />LINK_FAILED</span>}
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-mono border border-rose-500/20 bg-rose-950/15 p-3 rounded-lg flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold">SYSTEM ERROR: </span>{error}
              </div>
            </div>
          )}

          {/* Settings Section (Main Frame) */}
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
              <Settings2 className="w-4 h-4 text-[#00d2ff]" />
              <span className="text-xs font-mono text-[#00d2ff] tracking-widest font-bold uppercase">INTERFACE_PARAMS</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">Active Terminal</label>
                <div className="text-xs text-[#00d2ff] bg-black/40 p-2.5 rounded border border-white/[0.06] font-mono font-bold tracking-wider">
                  J.A.R.V.I.S. (MASTER_CORE)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">Voice Unit</label>
                  <select 
                    value={voice} 
                    onChange={e => setVoice(e.target.value)}
                    disabled={state !== 'idle'}
                    className="w-full bg-[#0c101a] border border-white/[0.08] hover:border-white/20 transition-colors rounded-lg p-2 text-xs text-white outline-none focus:border-[#00d2ff]/50 font-mono"
                  >
                    <option value="Zephyr font-mono">Zephyr (Default)</option>
                    <option value="Aoede">Aoede</option>
                    <option value="Puck">Puck</option>
                    <option value="Kore">Kore</option>
                    <option value="Fenrir">Fenrir</option>
                    <option value="Charon">Charon</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">Cognitive Delay</label>
                  <select 
                    value={thinking} 
                    onChange={e => setThinking(e.target.value)}
                    disabled={state !== 'idle'}
                    className="w-full bg-[#0c101a] border border-white/[0.08] hover:border-white/20 transition-colors rounded-lg p-2 text-xs text-white outline-none focus:border-[#00d2ff]/50 font-mono"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="low">Low Budget</option>
                    <option value="medium">Balanced</option>
                    <option value="high">Deep Think</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE STUDIO PARAMETERS (DIRECTOR'S BOARD) */}
          <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowStudioParams(!showStudioParams)}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-400" />
                <span className="text-xs font-mono text-red-500/85 tracking-widest font-bold uppercase">Studio Parameters</span>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors" id="expose-params-btn">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-black/40 border border-white/5 text-slate-400 rounded">
                  {showStudioParams ? 'HIDE' : 'EXPOSE'}
                </span>
              </button>
            </div>

            {showStudioParams && (
              <div 
                id="studio-params-fields"
                className="space-y-4 pt-2 border-t border-white/[0.04] transition-all overflow-hidden"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Scene Setup
                  </label>
                  <textarea 
                    value={scene} 
                    onChange={(e) => setScene(e.target.value)} 
                    className="w-full min-h-[90px] bg-[#090b12] border border-white/[0.08] rounded-xl p-3 text-[11px] text-white outline-none focus:border-red-500 transition-colors resize-y custom-scrollbar font-mono leading-relaxed" 
                    placeholder="Describe the environment..." 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Topic Context
                  </label>
                  <textarea 
                    value={context} 
                    onChange={(e) => setContext(e.target.value)} 
                    className="w-full min-h-[90px] bg-[#090b12] border border-white/[0.08] rounded-xl p-3 text-[11px] text-white outline-none focus:border-red-500 transition-colors resize-y custom-scrollbar font-mono leading-relaxed" 
                    placeholder="General context..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Directorial Delivery Note
                  </label>
                  <textarea 
                    value={singleSpeakerNote} 
                    onChange={(e) => setSingleSpeakerNote(e.target.value)} 
                    className="w-full min-h-[100px] bg-[#090b12] border border-white/[0.08] rounded-xl p-3 text-[11px] text-white outline-none focus:border-red-500 transition-colors resize-y custom-scrollbar font-mono leading-relaxed" 
                    placeholder="Delivery instructions..." 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-3 z-10 relative pt-2">
            <button 
              id="establish-neural-link-btn"
              onClick={state === 'idle' ? async () => {
                const instructions = await compileDirectives();
                const middlemanModel = localStorage.getItem('middleman_model') || 'gemma-4-31b-it';
                sessionHook.clearSessionAudio();
                connectVoice(agent, voice, instructions, middlemanModel);
              } : disconnectVoice}
              className={`w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 laser-hover cursor-pointer ${
                state === 'idle' 
                  ? 'bg-gradient-to-r from-red-950/40 via-[#00d2ff]/10 to-red-950/40 text-[#00d2ff] hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 shadow-[0_0_15px_rgba(0,210,255,0.1)]'
                  : 'bg-rose-950/40 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              {state === 'idle' ? (
                <>
                  <Mic className="w-4 h-4 animate-pulse text-[#00d2ff]" /> 
                  ESTABLISH_NEURAL_LINK
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4 text-rose-400" /> 
                  SEVER_NEURAL_LINK
                </>
              )}
            </button>

            <button
              onClick={() => sessionHook.downloadSessionAudio()}
              disabled={state === 'connected'}
              className="w-full py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-white/[0.02] text-slate-400 hover:bg-white/5 hover:text-white border border-white/[0.06] disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Wav Track
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
