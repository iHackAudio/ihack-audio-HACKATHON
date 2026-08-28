import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRealtimeMastering, DEFAULT_REALTIME_PARAMS } from '../services/useRealtimeMastering';
import { Play, Pause, Waves, Headphones, Sliders, Activity, Sparkles, AlertCircle, Volume2, Mic2, FileAudio, Zap, Flame, EyeOff, Eye, Download, ShieldCheck, Speaker, ToggleLeft, ToggleRight, Split, Power } from 'lucide-react';
import { MasteringContext } from '../types/audioAnalyzerTypes';

const SpectrumViewer: React.FC<{ getSpectrum: () => { raw: Uint8Array; enhanced: Uint8Array } | null }> = ({ getSpectrum }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let animationFrame: number;
      const draw = () => {
        const spectrum = getSpectrum();
        if (spectrum) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const { raw, enhanced } = spectrum;
          const barWidth = canvas.width / (raw.length / 2);
          
          // Draw Raw (Input) - Ghostly White
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          for (let i = 0; i < raw.length / 2; i++) {
            const barHeight = (raw[i] / 255) * canvas.height * 0.8;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
          }
          
          // Draw Enhanced (Output) - Cyan Neon
          ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
          for (let i = 0; i < enhanced.length / 2; i++) {
            const barHeight = (enhanced[i] / 255) * canvas.height * 0.8;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
          }
        }
        animationFrame = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(animationFrame);
    }, [getSpectrum]);
    return <canvas ref={canvasRef} width={600} height={80} className="w-full h-24 bg-slate-950/50 rounded-xl border border-white/5" />;
};

export const RealtimeMasteringPanel: React.FC<{ initialFile?: File | null, forensicData?: MasteringContext | null }> = ({ initialFile, forensicData }) => {
  const {
    isInitialized, isPlaying, params, levels, initialize, loadAudio, togglePlayback, updateParam, setAllParams, getSpectrum, downloadProcessed
  } = useRealtimeMastering();

  const [ready, setReady] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);

  useEffect(() => {
    const startup = async () => {
        await initialize();
        if (initialFile) {
            await loadAudio(initialFile);
            setReady(true);
        }
    };
    startup();
  }, [initialize, initialFile, loadAudio]);

  const handleDownload = async () => {
      setIsProcessingDownload(true);
      try {
          const blob = await downloadProcessed();
          if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `neural_master_${Date.now()}.wav`;
              a.click();
              URL.revokeObjectURL(url);
          }
      } catch (e) { alert("Render failed."); }
      setIsProcessingDownload(false);
  };

  const Toggle = ({ label, active, onToggle, activeColor = '#22d3ee' }: any) => (
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${active ? 'bg-slate-900' : 'bg-slate-950 border-transparent text-slate-600'}`}
        style={{
            borderColor: active ? activeColor : 'rgba(255,255,255,0.05)',
            color: active ? activeColor : undefined,
            boxShadow: active ? `0 0 10px ${activeColor}10` : 'none'
        }}
      >
          {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {label}
      </button>
  );

  const Slider = ({ label, value, min, max, step = 1, unit = '', onChange, color = 'cyan', subLabel }: any) => (
    <div className="space-y-1.5 group">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
        <label className="flex items-center gap-2">{label}</label>
        <span className={`text-${color}-500`}>{value > 0 ? `+${value}` : value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-${color}-500`}
      />
      {subLabel && <p className="text-[8px] text-slate-600 uppercase font-bold">{subLabel}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Blueprint Data */}
      {forensicData && (
          <div className="bg-slate-900/40 rounded-[1.5rem] border border-white/5 p-4 grid grid-cols-4 gap-4">
              <div className="text-center">
                  <span className="text-[8px] text-slate-600 font-bold uppercase block">Noise</span>
                  <span className="text-xs font-black text-emerald-500">{Math.round(forensicData.noiseFloor)}dB</span>
              </div>
              <div className="text-center border-l border-white/5">
                  <span className="text-[8px] text-slate-600 font-bold uppercase block">Plosives</span>
                  <span className={`text-xs font-black ${forensicData.hasPlosives ? 'text-red-500' : 'text-slate-500'}`}>{forensicData.hasPlosives ? 'High' : 'Low'}</span>
              </div>
              <div className="text-center border-l border-white/5">
                  <span className="text-[8px] text-slate-600 font-bold uppercase block">Width</span>
                  <span className="text-xs font-black text-cyan-500 uppercase">{forensicData.bandwidth}</span>
              </div>
              <div className="text-center border-l border-white/5">
                   <button onClick={() => setAllParams(DEFAULT_REALTIME_PARAMS)} className="text-[8px] font-black text-amber-500 uppercase hover:text-white">Reset Engine</button>
              </div>
          </div>
      )}

      {/* Visual Analysis & Master Controls */}
      <div className="bg-slate-950 rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-5 bg-slate-900/50 border-b border-white/5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-cyan-500' : 'bg-slate-900'}`}>
                    <Activity className={`w-5 h-5 ${isPlaying ? 'text-slate-950' : 'text-slate-600'}`} />
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none">Sonic Forge Engine</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Manual Neural Node</span>
                        {params.bypass && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase">BYPASS ACTIVE</span>}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => updateParam('bypass', !params.bypass)} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all border ${params.bypass ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'}`}
                >
                    <Power className="w-4 h-4" />
                    {params.bypass ? 'Comparison Mode (On)' : 'Compare A/B'}
                </button>
                <button onClick={togglePlayback} className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all ${isPlaying ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500 text-slate-950'}`}>
                  {isPlaying ? 'Stop Signal' : 'Inject Audio'}
                </button>
                <button onClick={handleDownload} disabled={isProcessingDownload} className="p-2.5 bg-slate-800 text-cyan-400 rounded-xl hover:bg-slate-700">
                    {isProcessingDownload ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
            </div>
          </div>
          <div className="p-5 relative">
              <SpectrumViewer getSpectrum={getSpectrum} />
              <div className="absolute bottom-6 right-6 flex items-center gap-4 pointer-events-none">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/20"></div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Input</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-[8px] font-bold text-cyan-500 uppercase">Output</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SPECTRAL MODULE */}
        <div className={`bg-slate-900/40 p-5 rounded-[2rem] border transition-all space-y-6 ${params.hpfEnabled ? 'border-cyan-500/30' : 'border-white/5 opacity-80'}`}>
           <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                   <Waves className="w-3 h-3" /> Spectral Lab
               </h4>
               <Toggle label="Active" active={params.hpfEnabled} onToggle={() => updateParam('hpfEnabled', !params.hpfEnabled)} activeColor="#22d3ee" />
           </div>
           <div className={`space-y-5 transition-all ${!params.hpfEnabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <Slider 
                label="HPF / Morph Filter" 
                value={params.hpFreq} min={-200} max={200} 
                subLabel={params.hpFreq >= 0 ? "High-Pass Filter Mode" : "Low Shelf Morph Active"}
                onChange={(v:any) => updateParam('hpFreq', v)} 
              />
              <Slider label="Presence" value={params.presenceGain} min={-12} max={12} unit="dB" onChange={(v:any) => updateParam('presenceGain', v)} />
              <Slider label="Sparkle (Air)" value={params.airGain} min={-12} max={12} unit="dB" onChange={(v:any) => updateParam('airGain', v)} />
              <div className="pt-4 border-t border-white/5">
                <Slider label="Neural Saturator" value={Math.round(params.warmth * 100)} min={0} max={100} unit="%" color="amber" onChange={(v:any) => updateParam('warmth', v / 100)} />
              </div>
           </div>
        </div>

        {/* DYNAMICS MODULE */}
        <div className={`bg-slate-900/40 p-5 rounded-[2rem] border transition-all space-y-6 ${params.deessEnabled ? 'border-purple-500/30' : 'border-white/5 opacity-80'}`}>
           <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-3 h-3" /> Neural Dynamics
           </h4>
           <div className="space-y-5">
              <Slider 
                label="Threshold" 
                value={params.threshold} min={-60} max={60} unit="dB" color="purple" 
                subLabel={params.threshold > 0 ? "Upward Expansion: Amplifying Signal" : "Standard Downward Compression"}
                onChange={(v:any) => updateParam('threshold', v)} 
              />
              <Slider label="Ratio" value={params.ratio} min={1} max={10} step={0.5} unit=":1" color="purple" onChange={(v:any) => updateParam('ratio', v)} />
              
              <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Sibilance Node</span>
                      <Toggle label="Engage" active={params.deessEnabled} onToggle={() => updateParam('deessEnabled', !params.deessEnabled)} activeColor="#c084fc" />
                  </div>
                  <div className={`space-y-4 transition-all ${!params.deessEnabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      <Slider 
                        label="De-esser Morph" value={params.deessAmount} min={-1} max={1} step={0.1} color="purple" 
                        subLabel={params.deessAmount >= 0 ? "Sibilance Reduction" : "Top-End Excitation Mode"}
                        onChange={(v:any) => updateParam('deessAmount', v)} 
                      />
                  </div>
              </div>
           </div>
        </div>

        {/* OUTPUT MODULE */}
        <div className={`bg-slate-900/40 p-5 rounded-[2rem] border transition-all space-y-6 ${params.normalizeEnabled ? 'border-emerald-500/30' : 'border-white/5 opacity-80'}`}>
            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <Speaker className="w-3 h-3" /> Finalization
               </h4>
               <Toggle label="Normalize" active={params.normalizeEnabled} onToggle={() => updateParam('normalizeEnabled', !params.normalizeEnabled)} activeColor="#34d399" />
            </div>
            
            <div className="space-y-5">
               <div className={`space-y-5 transition-all ${!params.normalizeEnabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                   <Slider label="Normalize Target" value={params.normalizeTarget} min={-12} max={0} step={0.1} unit="dB" color="emerald" onChange={(v:any) => updateParam('normalizeTarget', v)} />
               </div>
               
               <div className="pt-4 border-t border-white/5">
                   <Slider label="Makeup Gain" value={params.makeupGain} min={0} max={20} unit="dB" color="emerald" onChange={(v:any) => updateParam('makeupGain', v)} />
               </div>

               <div className="p-4 bg-slate-950/80 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Broadcast Out</span>
                      <span>{(levels?.output || -100).toFixed(1)} dB</span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-75 ${levels.output > -1 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, Math.max(0, 100 + levels.output))}%` }}></div>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};