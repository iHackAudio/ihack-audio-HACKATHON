import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Server, Sparkles, Network } from 'lucide-react';

interface CognitivePipelineVisualizerProps {
  messageText: string;
  targetAgentId: string;
}

export default function CognitivePipelineVisualizer({ messageText, targetAgentId }: CognitivePipelineVisualizerProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [telemetryVal, setTelemetryVal] = useState<string>('INITIATING_SYNAPSE_MATRIX');
  
  const textLower = messageText.toLowerCase();
  const isAgentAMentioned = textLower.includes('agenta') || targetAgentId === 'agenta' || (!textLower.includes('@agentb') && !textLower.includes('agentb'));
  const isAgentBMentioned = textLower.includes('agentb') || targetAgentId === 'agentb' || (!textLower.includes('@agenta') && !textLower.includes('agenta'));

  // Sequence active status highlights to mimic genuine execution pipelines
  useEffect(() => {
    let unmounted = false;
    const steps = [
      { delay: 400, label: 'J.A.R.V.I.S. COGNITIVE INGEST' },
      { delay: 1200, label: 'COMPREHENDING TASK SCHEMA' },
      { delay: 2400, label: 'DISPATCHING TO SUB-AGENTS' },
      { delay: 4200, label: 'AGENTS ENGAGING INFERENCE' },
      { delay: 6000, label: 'GEMMA SYNTHESIS COMPILATION' },
      { delay: 7800, label: 'ALIGNED DELIVERABLE PREPARATION' }
    ];

    const runSequence = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (unmounted) break;
        setActiveStep(i);
        setTelemetryVal(steps[i].label);
        await new Promise(resolve => setTimeout(resolve, steps[i].delay));
      }
    };
    
    runSequence();
    return () => {
      unmounted = true;
    };
  }, [messageText]);

  return (
    <div className="w-full max-w-2xl bg-[#090b11] border border-[#00d2ff]/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(0,210,255,0.05)] mx-auto my-4">
      {/* Dynamic scanline overlay for cybernetic grid look */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#00d2ff]/2 to-transparent pointer-events-none" />

      {/* Header telemetry info bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]"></span>
          </span>
          <span className="text-xs font-mono tracking-wider text-white/50 uppercase">Synaptic Grid Network</span>
        </div>
        <div className="text-[10px] font-mono text-[#00d2ff]/80 font-medium tracking-widest uppercase">
          STATE: <span className="animate-pulse">{telemetryVal}</span>
        </div>
      </div>

      {/* Core Node Grid Structure with Animated Connectors */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4 font-mono select-none py-4">
        
        {/* Connection Line SVGs behind components (for Desktop Layout) */}
        <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 600 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* J.A.R.V.I.S. to Agent A path */}
            {isAgentAMentioned && (
              <path 
                d="M 120,60 Q 200,20 280,30" 
                stroke={activeStep >= 2 ? '#ff00d2' : 'rgba(255,255,255,0.1)'} 
                strokeWidth="1.5" 
                strokeDasharray={activeStep === 3 ? "5 5" : "none"}
                className={activeStep === 3 ? "animate-[dash_10s_linear_infinite]" : ""}
              />
            )}
            
            {/* J.A.R.V.I.S. to Agent B path */}
            {isAgentBMentioned && (
              <path 
                d="M 120,60 Q 200,100 280,90" 
                stroke={activeStep >= 2 ? '#d2ff00' : 'rgba(255,255,255,0.1)'} 
                strokeWidth="1.5"
                strokeDasharray={activeStep === 3 ? "5 5" : "none"}
                className={activeStep === 3 ? "animate-[dash_10s_linear_infinite]" : ""}
              />
            )}

            {/* Agent A to Middleman path */}
            {isAgentAMentioned && (
              <path 
                d="M 320,30 Q 400,20 480,60" 
                stroke={activeStep >= 4 ? '#00d2ff' : 'rgba(255,255,255,0.05)'} 
                strokeWidth="1.5"
                strokeDasharray={activeStep === 4 ? "5 5" : "none"}
                className={activeStep === 4 ? "animate-[dash_10s_linear_infinite]" : ""}
              />
            )}

            {/* Agent B to Middleman path */}
            {isAgentBMentioned && (
              <path 
                d="M 320,90 Q 400,100 480,60" 
                stroke={activeStep >= 4 ? '#00d2ff' : 'rgba(255,255,255,0.05)'} 
                strokeWidth="1.5"
                strokeDasharray={activeStep === 4 ? "5 5" : "none"}
                className={activeStep === 4 ? "animate-[dash_10s_linear_infinite]" : ""}
              />
            )}

            {/* Flow Spark particles */}
            {activeStep === 2 && (
              <motion.circle r="3" fill="#00d2ff" initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 1.5, repeat: Infinity }}>
                <animateMotion path={isAgentAMentioned ? "M 120,60 Q 200,20 280,30" : "M 120,60 Q 200,100 280,90"} dur="1s" repeatCount="indefinite" />
              </motion.circle>
            )}
            {activeStep === 4 && (
              <motion.circle r="3" fill="#00d2ff" initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 1.5, repeat: Infinity }}>
                <animateMotion path={isAgentAMentioned ? "M 320,30 Q 400,20 480,60" : "M 320,90 Q 400,100 480,60"} dur="1s" repeatCount="indefinite" />
              </motion.circle>
            )}
          </svg>
        </div>

        {/* Node 1: JARVIS Core */}
        <div className="flex flex-col items-center gap-2 z-10 w-32">
          <motion.div 
            animate={{ 
              boxShadow: activeStep <= 2 ? ['0 0 10px rgba(0,210,255,0.2)', '0 0 25px rgba(0,210,255,0.5)', '0 0 10px rgba(0,210,255,0.2)'] : '0 0 5px rgba(255,255,255,0.05)',
              borderColor: activeStep <= 2 ? '#00d2ff' : 'rgba(255,255,255,0.1)'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full border bg-[#0d111d] flex items-center justify-center relative cursor-help"
          >
            <Server className={`w-6 h-6 ${activeStep <= 2 ? 'text-[#00d2ff]' : 'text-white/40'}`} />
            
            {/* Holographic Ring pulsing outside */}
            {activeStep <= 2 && (
              <span className="absolute inset-0 rounded-full border border-[#00d2ff] opacity-40 animate-ping" />
            )}
          </motion.div>
          <div className="text-center">
            <div className={`text-xs font-semibold ${activeStep <= 2 ? 'text-[#00d2ff]' : 'text-white/60'}`}>J.A.R.V.I.S.</div>
            <div className="text-[9px] text-white/30 tracking-tight">Main Orchestrator</div>
          </div>
        </div>

        {/* Sub-Agent Stack Columns */}
        <div className="flex flex-col gap-6 z-10 w-36">
          {/* Node 2A: Agent A (Analytical Core) */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
            !isAgentAMentioned ? 'opacity-25 filter grayscale' :
            activeStep === 3 ? 'bg-[#ff00d2]/10 border-[#ff00d2] shadow-[0_0_15px_rgba(255,0,210,0.15)] scale-105' : 'bg-[#0c0e16]/50 border-white/5'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeStep === 3 ? 'bg-[#ff00d2]/20 text-[#ff00d2]' : 'bg-white/5 text-white/30'}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-[11px] font-bold ${activeStep === 3 ? 'text-[#ff00d2]' : 'text-white/70'}`}>Agent A</div>
              <div className="text-[8px] text-white/30 tracking-tight">Analytical Core</div>
            </div>
          </div>

          {/* Node 2B: Agent B (Creative Core) */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
            !isAgentBMentioned ? 'opacity-25 filter grayscale' :
            activeStep === 3 ? 'bg-[#d2ff00]/10 border-[#d2ff00] shadow-[0_0_15px_rgba(210,255,0,0.15)] scale-105' : 'bg-[#0c0e16]/50 border-white/5'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeStep === 3 ? 'bg-[#d2ff00]/20 text-[#d2ff00]' : 'bg-white/5 text-white/30'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-[11px] font-bold ${activeStep === 3 ? 'text-[#d2ff00]' : 'text-white/70'}`}>Agent B</div>
              <div className="text-[8px] text-white/30 tracking-tight">Creative Brain</div>
            </div>
          </div>
        </div>

        {/* Node 3: Gemma Synthesis Middleman */}
        <div className="flex flex-col items-center gap-2 z-10 w-32">
          <motion.div 
            animate={{ 
              boxShadow: activeStep >= 4 ? ['0 0 10px rgba(0,210,255,0.2)', '0 0 25px rgba(0,210,255,0.4)', '0 0 10px rgba(0,210,255,0.2)'] : '0 0 5px rgba(255,255,255,0.05)',
              borderColor: activeStep >= 4 ? '#00d2ff' : 'rgba(255,255,255,0.1)'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full border bg-[#0d111d] flex items-center justify-center relative"
          >
            <Network className={`w-6 h-6 ${activeStep >= 4 ? 'text-[#00d2ff]' : 'text-white/40'}`} />
            {activeStep >= 4 && (
              <span className="absolute inset-0 rounded-full border border-[#00d2ff] opacity-40 animate-ping" />
            )}
          </motion.div>
          <div className="text-center">
            <div className={`text-xs font-semibold ${activeStep >= 4 ? 'text-[#00d2ff]' : 'text-white/60'}`}>Gemma Synthesis</div>
            <div className="text-[9px] text-white/30 tracking-tight">Synthesis Middleman</div>
          </div>
        </div>

      </div>

      {/* Footer System Telemetry Status Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 border border-white/5 rounded-xl p-3 mt-6 text-[10px] font-mono select-none">
        <div>
          <div className="text-white/30">QUANTUM FLOW</div>
          <div className="text-white/80 font-semibold">{isAgentAMentioned && isAgentBMentioned ? 'DUAL_SYNAPSE' : 'SINGLE_BUS'}</div>
        </div>
        <div>
          <div className="text-white/30">CPU STACK</div>
          <div className="text-[#00d2ff] font-semibold animate-pulse">OPTIMIZED (CJS)</div>
        </div>
        <div>
          <div className="text-white/30">LATENCY TRACE</div>
          <div className="text-green-400 font-semibold">{activeStep > 4 ? '112ms' : 'SYNAPSE_PENDING'}</div>
        </div>
        <div>
          <div className="text-white/30">MEMORY BUFFER</div>
          <div className="text-white/80 font-semibold">{activeStep >= 5 ? 'STABLE' : 'BUFFERING'}</div>
        </div>
      </div>
    </div>
  );
}
