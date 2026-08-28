import React, { useState, useEffect } from 'react';

// Character Spark Particle
interface CharacterSpark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const COLOR_GLOW_SCHEMES = [
  { text: 'text-cyan-400', glow: 'rgba(6, 182, 212, 0.9)', bg: 'rgba(6, 182, 212, 0.4)' },
  { text: 'text-pink-500', glow: 'rgba(236, 72, 153, 0.9)', bg: 'rgba(236, 72, 153, 0.4)' },
  { text: 'text-purple-500', glow: 'rgba(168, 85, 247, 0.9)', bg: 'rgba(168, 85, 247, 0.4)' },
  { text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.9)', bg: 'rgba(16, 185, 129, 0.4)' },
  { text: 'text-amber-400', glow: 'rgba(245, 158, 11, 0.9)', bg: 'rgba(245, 158, 11, 0.4)' }
];

interface LetterProps {
  char: string;
  index: number;
}

const InteractiveLetter: React.FC<LetterProps> = ({ char, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [sparks, setSparks] = useState<CharacterSpark[]>([]);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (!isHovered) return;

    // Cycle through a different glowing color scheme on hover
    setColorIndex((prev) => (prev + 1) % COLOR_GLOW_SCHEMES.length);

    // Spawn 6 high-speed micro-sparks going outwards
    const newSparks: CharacterSpark[] = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 2.5;
      return {
        id: Math.random(),
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLOR_GLOW_SCHEMES[Math.floor(Math.random() * COLOR_GLOW_SCHEMES.length)].glow
      };
    });

    setSparks(newSparks);

    // Particle lifecycle: fly away, damp, then dissolve
    let animId: number;
    let frames = 0;
    const animateSparks = () => {
      frames++;
      setSparks((prevSparks) =>
        prevSparks
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            vx: s.vx * 0.92, // speed friction
            vy: s.vy * 0.92
          }))
          .filter(() => frames < 35) // live for 35 frames
      );

      if (frames < 35) {
        animId = requestAnimationFrame(animateSparks);
      }
    };

    animId = requestAnimationFrame(animateSparks);

    return () => cancelAnimationFrame(animId);
  }, [isHovered]);

  const activeColor = COLOR_GLOW_SCHEMES[colorIndex];

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'inline-block',
        whiteSpace: 'pre',
        perspective: '1000px',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.3s, text-shadow 0.3s',
        transform: isHovered ? 'scale(1.22) translateY(-14px) rotate(4deg)' : 'scale(1) translateY(0px) rotate(0deg)',
        textShadow: isHovered 
          ? `0 0 15px ${activeColor.glow}, 0 0 35px ${activeColor.glow}` 
          : '2px 2px 8px rgba(168, 85, 247, 0.3)'
      }}
      className={`cursor-alias relative ${isHovered ? activeColor.text : 'text-white'}`}
    >
      {char}

      {/* Sparks Overlay */}
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${spark.x}px), calc(-50% + ${spark.y}px))`,
            backgroundColor: spark.color,
            boxShadow: `0 0 8px ${spark.color}`,
            transition: 'opacity 0.4s ease, transform 0.4s',
            opacity: 1 - Math.max(0, Math.abs(spark.vx) + Math.abs(spark.vy)) / 4
          }}
        />
      ))}
    </span>
  );
};

export const InteractiveHeader: React.FC = () => {
  const [hudMessage, setHudMessage] = useState('1 click automation workflow.');
  const [hudIndex, setHudIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // High-tech contextual diagnostic logs that swap periodically
  const highTechPhrases = [
    '1 click automation workflow.',
    'System: [STATUS: READY FOR INTAKE]',
    'iHack: [PIPELINE: SYNAPTIC AUTO-PILOT]',
    'Ready: [CHIP: NEURAL MASTER ACTIVE]'
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentFullText = highTechPhrases[phraseIndex];

    if (isTyping) {
      if (hudIndex < currentFullText.length) {
        timer = setTimeout(() => {
          setHudIndex((prev) => prev + 1);
          setHudMessage(currentFullText.substring(0, hudIndex + 1));
        }, 50);
      } else {
        // Pause at completion
        timer = setTimeout(() => {
          setIsTyping(false);
        }, 3500);
      }
    } else {
      // Backspacing
      if (hudIndex > 0) {
        timer = setTimeout(() => {
          setHudIndex((prev) => prev - 1);
          setHudMessage(currentFullText.substring(0, hudIndex - 1));
        }, 25);
      } else {
        setIsTyping(true);
        setPhraseIndex((prev) => (prev + 1) % highTechPhrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [hudIndex, isTyping, phraseIndex]);

  const handleTitleHover = () => {
    // Shuffles or triggers extra HUD telemetry
  };

  return (
    <div className="mb-24 flex flex-col items-center justify-center relative select-none">
      {/* Background frequency bars layout to contain title visually */}
      <div className="absolute top-20 flex gap-1 items-end h-24 pointer-events-none -z-10">
        {[...Array(24)].map((_, i) => (
          <div 
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500/30 to-purple-500/30 animate-[pulse_1.5s_infinite]"
            style={{
              height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}px`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>
      
      {/* Visual cyber target layout frames */}
      <div className="flex gap-2 mb-4 text-xs font-mono text-slate-500 uppercase tracking-[0.4em] justify-center items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        NODE INTEGRITY: ONLINE
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
      </div>

      <h1 
        onMouseEnter={handleTitleHover}
        className="text-7xl md:text-9xl font-black mb-4 tracking-tighter leading-none select-none flex justify-center items-center gap-0.5"
      >
        {"iHack Audio".split("").map((char, index) => (
          <InteractiveLetter key={index} char={char} index={index} />
        ))}
      </h1>

      {/* Cyberpunk HUD interactive typewriter ticker */}
      <div className="relative min-h-[38px] flex items-center justify-center">
        <h2 className="text-xl md:text-3xl font-black text-slate-300 font-mono tracking-normal text-center bg-slate-900/10 px-6 py-2 rounded-xl border border-white/5 shadow-2xl">
          <span className="text-cyan-400 mr-2 text-base md:text-lg select-none">&gt;</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-white to-slate-400">
            {hudMessage}
          </span>
          <span className="w-2.5 h-6 bg-cyan-400 inline-block align-middle ml-1 select-none animate-flicker" style={{ animation: 'border-flicker 0.9s infinite shadow' }} />
        </h2>
      </div>
    </div>
  );
};
