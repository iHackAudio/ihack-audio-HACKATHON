import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AgentThinkingCharacterProps {
  agentId: string;
}

export default function AgentThinkingCharacter({ agentId }: AgentThinkingCharacterProps) {
  const agentLower = agentId?.toLowerCase() || 'jarvis';

  // State to trigger random blinking of eyes
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(interval);
  }, []);

  // Define visual themes & personalities
  let agentColor = '#ef4444'; // Red for Jarvis
  let agentGradient = 'from-[#ef4444]/20 to-[#f97316]/10';
  let agentName = 'J.A.R.V.I.S.';
  let agentRole = 'Executive Orchestrator';

  if (agentLower === 'agenta') {
    agentColor = '#ec4899'; // Pink
    agentGradient = 'from-[#ec4899]/20 to-[#a855f7]/10';
    agentName = 'Agent A';
    agentRole = 'Analytical Core';
  } else if (agentLower === 'agentb') {
    agentColor = '#eab308'; // Gold/Yellow
    agentGradient = 'from-[#eab308]/20 to-[#f97316]/10';
    agentName = 'Agent B';
    agentRole = 'Screenplay Screenwriter';
  } else if (agentLower === 'agentc' || agentLower === 'middleman' || agentLower === 'gemma-middleman') {
    agentColor = '#06b6d4'; // Teal
    agentGradient = 'from-[#06b6d4]/20 to-[#10b981]/10';
    agentName = 'Agent C';
    agentRole = 'Gemma Synthesizer';
  }

  // Eye blinking scale animation
  const eyeScaleY = blink ? 0.1 : 1;

  // Render the agent's character vector
  const renderCharacterSVG = () => {
    switch (agentLower) {
      case 'agenta':
        return (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Ambient Halo */}
            <div className="absolute inset-0 bg-[#ec4899]/5 rounded-full blur-xl animate-pulse" />
            
            {/* Spinning analytical frame */}
            <motion.div
              className="absolute inset-0 border-2 border-dashed border-[#ec4899]/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Rotating data node constellation */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#ec4899] shadow-[0_0_8px_#ec4899]"
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                }}
                style={{
                  transformOrigin: "56px 56px",
                  left: "calc(50% - 4px)",
                  top: "1px",
                }}
              />
            ))}

            {/* Main Face Container */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-[#090b11] border-2 border-[#ec4899] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            >
              {/* Crystalline mathematical overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ec48990d_1px,transparent_1px),linear-gradient(to_bottom,#ec48990d_1px,transparent_1px)] bg-[size:10px_10px] rounded-2xl" />

              {/* Eyes - Precise mathematical squares */}
              <div className="flex gap-4 mb-3 z-10">
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3.5 h-3.5 bg-[#ec4899] shadow-[0_0_8px_#ec4899] rounded-[2px]" 
                />
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3.5 h-3.5 bg-[#ec4899] shadow-[0_0_8px_#ec4899] rounded-[2px]" 
                />
              </div>

              {/* Mouth - Perfect math wave */}
              <div className="flex items-center justify-center gap-[2.5px] h-3.5 z-10">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-[#ec4899]/80 rounded-full"
                    animate={{
                      height: [
                        '20%',
                        i % 2 === 0 ? '90%' : '50%',
                        i % 3 === 0 ? '100%' : '30%',
                        '20%'
                      ]
                    }}
                    transition={{
                      duration: 0.8 + (i * 0.1),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        );

      case 'agentb':
        return (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Warm floating story embers */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]"
                initial={{ opacity: 0.2, y: 15 }}
                animate={{
                  y: [-15, -45],
                  x: [0, Math.sin(i) * 12],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
                style={{
                  left: `${20 + (i * 12)}px`,
                  top: '50%',
                }}
              />
            ))}

            {/* Glowing cloud aura */}
            <div className="absolute inset-0 bg-[#eab308]/5 rounded-full blur-xl animate-pulse" />

            {/* Smooth floating face container (Writers focus) */}
            <motion.div 
              animate={{ 
                y: [0, -5, 0],
                rotate: [-1, 1, -1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-[#090b11] border-2 border-[#eab308] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(234,179,8,0.3)]"
            >
              {/* Eyes - Soft Round warm dots */}
              <div className="flex gap-4 mb-3 z-10">
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3 h-3 bg-[#eab308] shadow-[0_0_8px_#eab308] rounded-full" 
                />
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3 h-3 bg-[#eab308] shadow-[0_0_8px_#eab308] rounded-full" 
                />
              </div>

              {/* Mouth - Flowing warm script curve */}
              <div className="w-6 h-3 flex items-center justify-center z-10">
                <svg viewBox="0 0 24 12" className="w-5 h-2.5">
                  <motion.path
                    d="M 2,2 Q 12,12 22,2"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{
                      d: [
                        "M 2,2 Q 12,12 22,2",
                        "M 2,4 Q 12,10 22,4",
                        "M 2,2 Q 12,12 22,2"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        );

      case 'agentc':
      case 'middleman':
      case 'gemma-middleman':
        return (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Nested crystalline rotation frame */}
            <motion.div
              className="absolute inset-2 border border-[#06b6d4]/40 rotate-45"
              animate={{ rotate: 405 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 border border-[#06b6d4]/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />

            <div className="absolute inset-0 bg-[#06b6d4]/5 rounded-full blur-xl animate-pulse" />

            {/* Main Face Container (Gemma Synthesizer) */}
            <motion.div 
              animate={{ 
                y: [0, -3, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-[#090b11] border-2 border-[#06b6d4] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              {/* Visor / Futuristic block eyes */}
              <motion.div 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  boxShadow: ['0 0 4px #06b6d4', '0 0 10px #06b6d4', '0 0 4px #06b6d4']
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-11 h-2 bg-[#06b6d4] rounded-full mb-3 z-10" 
              />

              {/* Mouth - Syntactic compile waveform */}
              <div className="flex gap-[1.5px] items-center justify-center h-3 z-10">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#06b6d4] rounded-sm"
                    animate={{
                      height: [
                        '30%',
                        i % 2 === 0 ? '100%' : '50%',
                        '30%'
                      ]
                    }}
                    transition={{
                      duration: 0.6 + (i * 0.08),
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        );

      case 'jarvis':
      default:
        return (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Orbiting ring */}
            <motion.div
              className="absolute inset-1.5 border border-dashed border-[#ef4444]/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Mini 4-pointed Spark */}
            <motion.div
              className="absolute top-1.5 right-1.5 text-[#ef4444]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 0c0 6.627-5.373 12-12 12 6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
              </svg>
            </motion.div>

            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-[#ef4444]/5 rounded-full blur-xl animate-pulse" />

            {/* Face Container (Jarvis ARC) */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-[#090b11] border-2 border-[#ef4444] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              {/* Outer pulse circle inside */}
              <div className="absolute inset-1 border border-[#ef4444]/15 rounded-full animate-pulse" />

              {/* Eyes - Glowing Crimson Nodes */}
              <div className="flex gap-4 mb-3.5 z-10">
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3 h-3 bg-[#ef4444] shadow-[0_0_10px_#ef4444] rounded-full" 
                />
                <motion.div 
                  style={{ scaleY: eyeScaleY }}
                  className="w-3 h-3 bg-[#ef4444] shadow-[0_0_10px_#ef4444] rounded-full" 
                />
              </div>

              {/* Mouth - Stylized speak wave */}
              <div className="w-10 h-3 flex items-center justify-center z-10">
                <svg viewBox="0 0 40 10" className="w-8 h-2">
                  <motion.path
                    d="M 0,5 Q 10,0 20,5 Q 30,10 40,5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{
                      d: [
                        "M 0,5 Q 10,0 20,5 Q 30,10 40,5",
                        "M 0,5 Q 10,10 20,5 Q 30,0 40,5",
                        "M 0,5 Q 10,5 20,5 Q 30,5 40,5",
                        "M 0,5 Q 10,0 20,5 Q 30,10 40,5"
                      ]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full text-center">
      {/* Animated Character */}
      {renderCharacterSVG()}

      {/* Label and processing status */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: agentColor }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: agentColor }}></span>
          </span>
          <span className="text-sm font-black tracking-widest text-white uppercase font-mono">{agentName}</span>
        </div>
        <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase">{agentRole} is processing...</div>
      </div>

      {/* Elegant minimalist glowing line */}
      <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_8px_rgba(255,255,255,0.05)]">
        <motion.div 
          className="absolute inset-y-0 bg-gradient-to-r rounded-full"
          style={{ width: '200%', backgroundImage: `linear-gradient(to right, transparent, ${agentColor}, transparent)` }}
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
}
