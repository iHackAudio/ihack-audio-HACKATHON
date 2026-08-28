import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Copy, 
  Check, 
  Save, 
  Trash2, 
  Cpu, 
  Sparkles, 
  Layers,
  FileText,
  Tv,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageBus } from '../utils/MessageBus';

interface StreamBlock {
  id: string;
  agentId: string;
  text: string;
}

interface LiveLogPanelProps {
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  latestApprovalMsg?: any;
  countdownSeconds?: number;
  isTimerPaused?: boolean;
  setIsTimerPaused?: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSend?: (text: string, skipUserMsg?: boolean) => Promise<void>;
  handleCancelPipeline?: () => Promise<void>;
}

export default function LiveLogPanel({ 
  onClose, 
  isExpanded = false, 
  onToggleExpand,
  latestApprovalMsg,
  countdownSeconds,
  isTimerPaused,
  setIsTimerPaused,
  triggerSend,
  handleCancelPipeline
}: LiveLogPanelProps) {
  // Tabs: 'logs' (Glass Box) | 'writer' (Live Script TV)
  const [activeTab, setActiveTab] = useState<'logs' | 'writer'>('writer');
  
  // Selected buffer in Live Script TV: 'all' | 'agentA' | 'agentB' | 'agentC' | 'jarvis'
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  
  // Streams for thought logs
  const [streams, setStreams] = useState<StreamBlock[]>([]);
  
  // Clean text buffers for real-time writing (strips <thinking> XML)
  const [buffers, setBuffers] = useState<Record<string, string>>({
    all: '',
    agentA: '',
    agentB: '',
    agentC: '',
    jarvis: ''
  });

  // Track the last active writing agent for the caret display
  const [activeTypist, setActiveTypist] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // General state
  const [copied, setCopied] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilename, setSaveFilename] = useState('live_script_draft.md');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live retry states for the TV Panel
  const [showLiveRetryInput, setShowLiveRetryInput] = useState(false);
  const [liveRetryFeedback, setLiveRetryFeedback] = useState('');

  const logsBottomRef = useRef<HTMLDivElement>(null);
  const writerBottomRef = useRef<HTMLDivElement>(null);

  // Strip <thinking>...</thinking> tags cleanly, even if currently open
  const stripThinkingLive = (text: string): string => {
    let cleaned = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    cleaned = cleaned.replace(/<thinking>[\s\S]*/gi, '');
    return cleaned;
  };

  useEffect(() => {
    const unsub = MessageBus.subscribe('websocket_message', (msg: any) => {
      if (msg.agentStream) {
        const { agentId, chunk } = msg.agentStream;
        
        // 1. Raw Stream Logs (Glass Box)
        setStreams(prev => {
          const last = prev[prev.length - 1];
          if (last && last.agentId === agentId) {
            const newPrev = [...prev];
            newPrev[newPrev.length - 1] = { ...last, text: last.text + chunk };
            return newPrev;
          } else {
            return [...prev, { id: Math.random().toString(), agentId, text: chunk }];
          }
        });

        // 2. Clearer Writer Buffers (Live Typewriter Editor)
        // Normalize names: 'gemma-middleman' maps to 'agentC'
        const normalizedId = agentId === 'gemma-middleman' ? 'agentC' : agentId;
        
        // Strip thinking block chunks or accumulate
        setBuffers(prev => {
          const cleanChunk = stripThinkingLive(chunk);
          const currentText = prev[normalizedId] || '';
          const currentAll = prev.all || '';
          
          return {
            ...prev,
            [normalizedId]: currentText + chunk, // We store raw, and strip on render
            all: currentAll + chunk
          };
        });

        // Set active writing indicator
        setActiveTypist(normalizedId);
        setIsTyping(true);
        
        if (typistTimeoutRef.current) clearTimeout(typistTimeoutRef.current);
        typistTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1500);

      } else if (msg.interrupted) {
         setStreams(prev => [...prev, { id: Math.random().toString(), agentId: 'SYSTEM', text: '\n\n[USER INTERRUPT - HALTING SWARM]\n' }]);
         setIsTyping(false);
      } else if (msg.agentChat) {
         const { agentId, text } = msg.agentChat;
         const normalizedId = agentId === 'gemma-middleman' ? 'agentC' : agentId;
         
         setStreams(prev => [...prev, { id: Math.random().toString(), agentId: `${normalizedId} TRACE`, text: `\n${text}\n` }]);
         
         // Update buffers if not already populated
         setBuffers(prev => {
           const cur = prev[normalizedId] || '';
           if (!cur.includes(text)) {
             return {
               ...prev,
               [normalizedId]: cur + '\n\n' + text,
               all: prev.all + '\n\n' + text
             };
           }
           return prev;
         });
      } else if (msg.glassBoxEvent) {
         setStreams(prev => [...prev, { id: Math.random().toString(), agentId: 'SYSTEM_EVENT', text: `\n${msg.glassBoxEvent}\n` }]);
      }
    });

    return () => {
      unsub();
      if (typistTimeoutRef.current) clearTimeout(typistTimeoutRef.current);
    };
  }, []);

  // Smooth auto-scroll behavior
  useEffect(() => {
    if (activeTab === 'logs') {
      logsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      writerBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streams, buffers, activeTab, selectedAgent]);

  const handleCopyBuffer = () => {
    const rawContent = buffers[selectedAgent] || '';
    const cleanContent = stripThinkingLive(rawContent);
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearBuffer = () => {
    if (window.confirm("Are you sure you want to clear the live editor buffer? This won't delete workspace files.")) {
      setBuffers({
        all: '',
        agentA: '',
        agentB: '',
        agentC: '',
        jarvis: ''
      });
      setStreams([]);
    }
  };

  const handleSaveBuffer = async () => {
    if (!saveFilename.trim()) return;
    try {
      const rawContent = buffers[selectedAgent] || '';
      const cleanContent = stripThinkingLive(rawContent);

      const res = await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: saveFilename, content: cleanContent })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowSaveDialog(false);
        }, 1500);
      }
    } catch (e) {
      console.error("Failed to save stream", e);
    }
  };

  const renderLogsText = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    const regex = /(<thinking>[\s\S]*?(?:<\/thinking>|$))|(\[DELEGATE(?:ING)?\s+TO[\s\S]*?\])|(WORKING \.\.\. ● Pulsing)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push({ type: 'text', content: text.substring(currentIndex, match.index) });
      }
      if (match[1]) {
        parts.push({ type: 'thinking', content: match[1] });
      } else if (match[2]) {
        parts.push({ type: 'delegate', content: match[2] });
      } else if (match[3]) {
        parts.push({ type: 'pulse', content: match[3] });
      }
      currentIndex = regex.lastIndex;
    }
    
    if (currentIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(currentIndex) });
    }
    
    return parts.map((part, i) => {
      if (part.type === 'thinking') {
        return <span key={i} className="text-emerald-400/85 italic font-mono">{part.content}</span>;
      }
      if (part.type === 'delegate') {
        return <span key={i} className="text-[#00d2ff] font-bold bg-[#00d2ff]/10 px-1 rounded font-mono">{part.content}</span>;
      }
      if (part.type === 'pulse') {
        return <span key={i} className="text-yellow-400 animate-pulse font-bold font-mono">{part.content}</span>;
      }
      return <span key={i} className="text-white/90 font-mono">{part.content}</span>;
    });
  };

  // Process clean text lines for the script screen
  const getEditorLines = () => {
    const rawContent = buffers[selectedAgent] || '';
    const cleanContent = stripThinkingLive(rawContent);
    if (!cleanContent.trim() && !isTyping) {
      return ["// Waiting for transmission... Start a pipeline to stream agent scripting live."];
    }
    return cleanContent.split('\n');
  };

  const editorLines = getEditorLines();

  const getAgentLabel = (agent: string) => {
    switch (agent) {
      case 'agentA': return 'Agent A (Researcher)';
      case 'agentB': return 'Agent B (Director)';
      case 'agentC': return 'Agent C (Assembler)';
      case 'jarvis': return 'J.A.R.V.I.S.';
      case 'all': return 'Unified Live Stream';
      default: return agent;
    }
  };

  return (
    <div className="w-full h-full bg-[#050810]/95 backdrop-blur-xl border-l border-white/10 flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* Absolute Left Floating Toggles */}
      <div className="absolute top-4 -left-8 z-40 flex flex-col gap-1">
        <button 
          onClick={onClose}
          className="bg-[#0c0e14] border border-[#00d2ff]/30 border-r-0 rounded-l-md p-1.5 text-[#00d2ff] bg-[#00d2ff]/5 cursor-pointer hover:bg-[#00d2ff]/10"
          title="Toggle Glass Box"
        >
          <Terminal className="w-4 h-4 animate-pulse" />
        </button>
      </div>

      {/* Main Top Header */}
      <div className="flex justify-between items-center px-4 h-12 border-b border-white/15 shrink-0 bg-[#0c0e14]">
        <div className="flex items-center gap-3">
          <Monitor className="w-4.5 h-4.5 text-[#00d2ff] animate-pulse" />
          <h2 className="font-mono text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
            AURA Swarm Stage
            {isTyping && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </h2>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center gap-1.5">
          {onToggleExpand && (
            <button 
              onClick={onToggleExpand} 
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
              title={isExpanded ? "Collapse View" : "Expand View"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Tabs Selector */}
      <div className="flex items-center justify-between px-3 h-10 bg-[#090c15] border-b border-white/5 shrink-0">
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('writer')}
            className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-semibold tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'writer' ? 'bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 shadow-[0_0_10px_rgba(0,210,255,0.1)]' : 'text-white/40 hover:text-white'}`}
          >
            <Tv className="w-3.5 h-3.5" />
            Live Script TV
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-semibold tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'logs' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-white/40 hover:text-white'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Thought Stream Logs
          </button>
        </div>

        {/* Global Toolbar actions for active editor */}
        {activeTab === 'writer' && buffers[selectedAgent] && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyBuffer}
              className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Copy Draft"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Save to Workspace File"
            >
              <Save className="w-3 h-3 text-[#00d2ff]" />
            </button>
            <button
              onClick={handleClearBuffer}
              className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-white/70 hover:text-red-400 transition-all cursor-pointer"
              title="Clear Buffer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* TENTATIVE SUB-AGENT SELECTOR PANEL (Exclusive to 'writer' tab) */}
      {activeTab === 'writer' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0d18] border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
          {['all', 'agentA', 'agentB', 'agentC', 'jarvis'].map((ag) => {
            const isSel = selectedAgent === ag;
            const hasData = (buffers[ag] || '').trim().length > 0;
            const isTyp = activeTypist === ag && isTyping;

            return (
              <button
                key={ag}
                onClick={() => setSelectedAgent(ag)}
                className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-all uppercase flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSel 
                    ? 'bg-white/10 text-white border-white/30' 
                    : hasData 
                    ? 'bg-white/[0.02] text-white/70 border-white/10 hover:bg-white/5' 
                    : 'bg-transparent text-white/30 border-transparent hover:text-white/50'
                }`}
              >
                {isTyp && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {ag === 'all' ? 'Unified Board' : ag.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Container based on Active Tab */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[#05070e]">
        
        {/* TAB 1: LIVE SCRIPT TV WRITER SCREEN */}
        {activeTab === 'writer' && (
          <div className="flex-1 flex flex-col overflow-hidden select-text">
            {/* Active writer title banner */}
            <div className="px-4 py-1.5 bg-black/40 border-b border-white/5 flex justify-between items-center text-[10px] font-mono text-white/40">
              <span className="flex items-center gap-1.5 text-[#00d2ff]">
                <FileText className="w-3 h-3" />
                {selectedAgent === 'all' ? 'active_pipeline_consolidation.md' : `${selectedAgent}_draft.md`}
              </span>
              <span className="uppercase text-[9px] tracking-widest text-slate-500 font-bold">
                {activeTypist && isTyping ? `● Typing: ${getAgentLabel(activeTypist)}` : '● SWARM STANDBY'}
              </span>
            </div>

            {/* Simulated TV CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-white/[0.005] to-transparent bg-[length:100%_4px] opacity-30" />

            {/* Custom Monospace Code Stage */}
            <div className="flex-1 overflow-y-auto p-4 flex custom-scrollbar relative">
              
              {/* Line Numbers Column */}
              <div className="w-8 shrink-0 text-right pr-3 font-mono text-[11px] text-white/20 select-none border-r border-white/5 flex flex-col pt-0.5 gap-1.5 leading-relaxed">
                {editorLines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Main Script Lines */}
              <div className="flex-1 pl-4 font-mono text-[12px] leading-relaxed text-slate-200 flex flex-col gap-1.5">
                {editorLines.map((line, idx) => {
                  const isLastLine = idx === editorLines.length - 1;
                  
                  // Style specific elements for dynamic retro highlighter
                  let lineClass = "text-slate-300";
                  if (line.trim().startsWith('#')) {
                    lineClass = "text-[#00d2ff] font-bold text-[13px] tracking-tight";
                  } else if (line.trim().startsWith('>')) {
                    lineClass = "text-emerald-400 italic bg-emerald-950/20 px-1 rounded border-l border-emerald-500/30";
                  } else if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
                    lineClass = "text-white/30 italic";
                  }

                  return (
                    <div key={idx} className={`${lineClass} min-h-[1.5rem] whitespace-pre-wrap relative`}>
                      {line}
                      {isLastLine && isTyping && (
                        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 shadow-[0_0_8px_#34d399] animate-pulse align-middle" />
                      )}
                    </div>
                  );
                })}
                <div ref={writerBottomRef} className="h-10" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THOUGHT STREAM LOGS (GLASS BOX) */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar font-mono select-text">
            {streams.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-white/20 text-xs mt-20 justify-center">
                <Zap className="w-5 h-5 opacity-40 animate-pulse" />
                Waiting for sub-agent raw thoughts...
              </div>
            ) : (
              streams.map((block) => (
                <div key={block.id} className="flex flex-col gap-1 border-l-2 border-white/5 pl-3 hover:border-[#00d2ff]/30 transition-all">
                  <span className="text-[9px] uppercase font-bold text-white/30 tracking-wider">
                    [{block.agentId} LOG STREAM]
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed text-[12px] font-mono">
                    {renderLogsText(block.text)}
                  </div>
                </div>
              ))
            )}
            <div ref={logsBottomRef} className="h-10" />
          </div>
        )}

      </div>

      {/* PERSISTENT LIVE PIPELINE CONTROL ON THE TV PANEL */}
      {latestApprovalMsg && (() => {
        const matchApproval = latestApprovalMsg.content.match(/=== AWAITING APPROVAL: Phase (\d+) ===/i);
        if (!matchApproval) return null;
        const phaseNum = parseInt(matchApproval[1]);
        
        return (
          <div className="shrink-0 bg-amber-950/25 border-t border-amber-500/20 px-4 py-3 flex flex-col gap-2 z-20 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Active Pipeline Phase {phaseNum} Awaiting Control
              </div>
              
              {countdownSeconds !== undefined && countdownSeconds > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span>AUTO-ACCEPT IN: {countdownSeconds}s</span>
                  {setIsTimerPaused && (
                    <button
                      onClick={() => setIsTimerPaused(p => !p)}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] text-slate-300 uppercase cursor-pointer"
                    >
                      {isTimerPaused ? "Resume" : "Pause"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {countdownSeconds !== undefined && countdownSeconds > 0 && (
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${countdownSeconds <= 10 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${(countdownSeconds / 60) * 100}%` }}
                />
              </div>
            )}

            {!showLiveRetryInput ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {triggerSend && (
                  <button
                    onClick={() => triggerSend(`@accept Phase ${phaseNum}`)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Phase {phaseNum}
                  </button>
                )}
                
                <button
                  onClick={() => setShowLiveRetryInput(true)}
                  className="px-4 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 hover:text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Retry Phase {phaseNum}
                </button>

                {handleCancelPipeline && (
                  <button
                    onClick={handleCancelPipeline}
                    className="px-4 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 hover:text-white rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer ml-auto"
                    title="Cancel whole pipeline and release lock"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel Pipeline
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <textarea
                  value={liveRetryFeedback}
                  onChange={(e) => setLiveRetryFeedback(e.target.value)}
                  placeholder="Provide feedback/instructions for the agents on how to retry this phase..."
                  className="w-full h-16 bg-black/50 border border-white/10 rounded p-2 text-xs font-sans text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
                <div className="flex items-center gap-2">
                  {triggerSend && (
                    <button
                      onClick={() => {
                        triggerSend(`@retry Phase ${phaseNum}${liveRetryFeedback.trim() ? ': ' + liveRetryFeedback.trim() : ''}`);
                        setShowLiveRetryInput(false);
                        setLiveRetryFeedback('');
                      }}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold tracking-wider uppercase border border-amber-500/30 cursor-pointer"
                    >
                      Submit Retry Request
                    </button>
                  )}
                  <button
                    onClick={() => setShowLiveRetryInput(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* SAVE BACKEND WORKSPACE FILE DIALOG */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0d16] border border-white/10 rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-[#00d2ff]">
                <Save className="w-4.5 h-4.5" />
                <h3 className="font-mono text-xs font-bold tracking-wider uppercase">Save to Workspace</h3>
              </div>
              
              <p className="text-[11px] text-white/50 leading-relaxed">
                Save the accumulated live stream buffer of <span className="text-white font-mono">{getAgentLabel(selectedAgent)}</span> as a file inside the project workspace directory.
              </p>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[9px] font-mono text-white/30 uppercase">Filename</label>
                <input 
                  type="text" 
                  value={saveFilename} 
                  onChange={(e) => setSaveFilename(e.target.value)}
                  placeholder="live_script_draft.md"
                  className="bg-black/50 border border-white/10 text-xs font-mono text-cyan-400 px-3 py-2 rounded focus:outline-none focus:border-[#00d2ff]/50"
                />
              </div>

              {saveSuccess ? (
                <div className="text-center py-1.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded text-xs font-mono">
                  ✓ File Written Successfully!
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveBuffer}
                    className="flex-1 py-1.5 bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/30 text-xs font-mono uppercase font-bold rounded cursor-pointer transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono uppercase rounded cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
