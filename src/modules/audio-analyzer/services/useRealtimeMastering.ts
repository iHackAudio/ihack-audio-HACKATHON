import { useState, useRef, useCallback, useEffect } from 'react';

// --- INLINED PROCESSOR CODE TO PREVENT LOADING ERRORS ---
const PROCESSOR_CODE = `
class MasteringProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.params = {
      hpFreq: 80, hpfEnabled: 0, plosiveGain: 0, mudGain: -2, presenceGain: 2.5, deessGain: 0, airGain: 2,
      threshold: -20, ratio: 2.5, attack: 0.15, release: 1.2, makeupGain: 0,
      denoiseEnabled: 0, noiseGate: -50,
      exciteAmount: 0, warmth: 0, bypass: 0,
      deessEnabled: 0, deessAmount: 0, reverbMix: 0, reverbSize: 0.5,
      normalizeEnabled: 0, normalizeTarget: -1.0, limiterThreshold: -1
    };
    this.filters = {
      hp: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      lowShelf: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      plosive: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      mud: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      presence: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      deess: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      air: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 },
      deessBand: { x1: 0, x2: 0, y1: 0, y2: 0, a0: 1, a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 }
    };
    this.compState = { env: 0, gain: 1 };
    this.deessState = { env: 0, gain: 1 };
    this.port.onmessage = (e) => {
      if (e.data.type === 'params') {
        Object.assign(this.params, e.data.params);
        this.updateCoefficients(sampleRate);
      }
    };
  }
  updateCoefficients(sr) {
    const hpVal = this.params.hpFreq;
    if (hpVal >= 0) this.calcHighpass(this.filters.hp, Math.max(20, hpVal), 0.7, sr);
    else this.calcLowShelf(this.filters.lowShelf, Math.abs(hpVal), 0.7, 6, sr);
    this.calcPeaking(this.filters.plosive, 120, 0.8, this.params.plosiveGain, sr);
    this.calcPeaking(this.filters.mud, 250, 1.0, this.params.mudGain, sr);
    this.calcPeaking(this.filters.presence, 3500, 0.8, this.params.presenceGain, sr);
    this.calcPeaking(this.filters.deess, 7000, 2.5, this.params.deessGain, sr);
    this.calcHighshelf(this.filters.air, 12000, 0.7, this.params.airGain, sr);
    this.calcHighpass(this.filters.deessBand, 5000, 0.7, sr);
  }
  calcHighpass(f, freq, Q, sr) {
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * Q);
    f.b0 = (1 + cosw0) / 2; f.b1 = -(1 + cosw0); f.b2 = (1 + cosw0) / 2;
    f.a0 = 1 + alpha; f.a1 = -2 * cosw0; f.a2 = 1 - alpha;
    this.normalize(f);
  }
  calcLowShelf(f, freq, Q, gain, sr) {
    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / 2 * Math.sqrt((A + 1/A) * (1/Q - 1) + 2);
    const sqrtA = Math.sqrt(A);
    f.b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * sqrtA * alpha);
    f.b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
    f.b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * sqrtA * alpha);
    f.a0 = (A + 1) + (A - 1) * cosw0 + 2 * sqrtA * alpha;
    f.a1 = -2 * ((A - 1) + (A + 1) * cosw0);
    f.a2 = (A + 1) + (A - 1) * cosw0 - 2 * sqrtA * alpha;
    this.normalize(f);
  }
  calcPeaking(f, freq, Q, gain, sr) {
    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * Q);
    f.b0 = 1 + alpha * A; f.b1 = -2 * cosw0; f.b2 = 1 - alpha * A;
    f.a0 = 1 + alpha / A; f.a1 = -2 * cosw0; f.a2 = 1 - alpha / A;
    this.normalize(f);
  }
  calcHighshelf(f, freq, Q, gain, sr) {
    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / 2 * Math.sqrt((A + 1/A) * (1/Q - 1) + 2);
    const sqrtA = Math.sqrt(A);
    f.b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * sqrtA * alpha);
    f.b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
    f.b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * sqrtA * alpha);
    f.a0 = (A + 1) - (A - 1) * cosw0 + 2 * sqrtA * alpha;
    f.a1 = 2 * ((A - 1) - (A + 1) * cosw0);
    f.a2 = (A + 1) - (A - 1) * cosw0 - 2 * sqrtA * alpha;
    this.normalize(f);
  }
  normalize(f) {
    f.b0 /= f.a0; f.b1 /= f.a0; f.b2 /= f.a0; f.a1 /= f.a0; f.a2 /= f.a0; f.a0 = 1;
  }
  processBiquad(f, input) {
    const output = f.b0 * input + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
    f.x2 = f.x1; f.x1 = input; f.y2 = f.y1; f.y1 = output;
    return output;
  }
  processDynamics(input, threshold, ratio, attack, release, state) {
    const threshLin = Math.pow(10, threshold / 20);
    const inputAbs = Math.abs(input);
    const attCoeff = Math.exp(-1 / (attack * sampleRate));
    const relCoeff = Math.exp(-1 / (release * sampleRate));
    if (inputAbs > state.env) state.env = attCoeff * state.env + (1 - attCoeff) * inputAbs;
    else state.env = relCoeff * state.env + (1 - relCoeff) * inputAbs;
    let gain = 1;
    if (threshold > 0) {
        if (state.env < threshLin) {
             const ratioVal = 1 + (ratio * 0.1); 
             const dbDiff = 20 * Math.log10(threshLin / (state.env + 0.0001));
             gain = Math.pow(10, (dbDiff * (ratioVal - 1)) / 20);
        }
    } else {
        if (state.env > threshLin) {
          const dbOver = 20 * Math.log10(state.env / threshLin);
          const dbGain = -dbOver * (1 - 1/ratio);
          gain = Math.pow(10, dbGain / 20);
        }
    }
    state.gain = 0.9 * state.gain + 0.1 * gain;
    return input * state.gain;
  }
  processDeesser(input, amount, state) {
      const highFreq = this.processBiquad(this.filters.deessBand, input);
      const highAbs = Math.abs(highFreq);
      const attCoeff = Math.exp(-1 / (0.002 * sampleRate));
      const relCoeff = Math.exp(-1 / (0.05 * sampleRate));
      if (highAbs > state.env) state.env = attCoeff * state.env + (1 - attCoeff) * highAbs;
      else state.env = relCoeff * state.env + (1 - relCoeff) * highAbs;
      const threshold = 0.05; 
      let gain = 1;
      if (amount >= 0) {
          if (state.env > threshold) {
              const ratio = 2 + (amount * 6);
              const dbOver = 20 * Math.log10(state.env / threshold);
              gain = Math.pow(10, (-dbOver * (1 - 1/ratio)) / 20);
          }
      } else {
          if (state.env > 0.01) {
              const boost = Math.abs(amount) * 2;
              gain = 1 + boost;
          }
      }
      return input * gain;
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;
    const inL = input[0];
    const outL = output[0];
    if (this.params.bypass > 0.5) { outL.set(inL); return true; }
    for (let i = 0; i < inL.length; i++) {
      let sl = inL[i];
      if (this.params.hpfEnabled > 0.5) {
          if (this.params.hpFreq >= 0) sl = this.processBiquad(this.filters.hp, sl);
          else sl = this.processBiquad(this.filters.lowShelf, sl);
      }
      sl = this.processBiquad(this.filters.plosive, sl);
      sl = this.processBiquad(this.filters.mud, sl);
      sl = this.processBiquad(this.filters.presence, sl);
      sl = this.processBiquad(this.filters.deess, sl);
      sl = this.processBiquad(this.filters.air, sl);
      if (this.params.deessEnabled > 0.5) {
          sl = this.processDeesser(sl, this.params.deessAmount, this.deessState);
      }
      if (this.params.exciteAmount > 0) sl += (sl * Math.abs(sl)) * this.params.exciteAmount * 0.5;
      if (this.params.warmth > 0) {
        const drive = 1 + this.params.warmth * 2;
        let x = sl * drive;
        if (x > 1) x = 1; if (x < -1) x = -1;
        sl = x - (x * x * x) / 3;
      }
      sl = this.processDynamics(sl, this.params.threshold, this.params.ratio, this.params.attack, this.params.release, this.compState);
      if (this.params.normalizeEnabled > 0.5) {
          const target = Math.pow(10, this.params.normalizeTarget / 20);
          if (Math.abs(sl) > target) sl *= (target / Math.abs(sl));
      }
      const mu = Math.pow(10, this.params.makeupGain / 20);
      sl *= mu;
      outL[i] = sl;
    }
    return true;
  }
}
registerProcessor('mastering-processor', MasteringProcessor);
`;

export interface RealtimeMasteringParams {
  hpFreq: number;
  hpfEnabled: boolean;
  plosiveGain: number;
  mudGain: number;
  presenceGain: number;
  deessGain: number;
  airGain: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeupGain: number;
  denoiseEnabled: boolean;
  noiseGate: number;
  targetLoudness: number;
  limiterThreshold: number;
  exciteAmount: number;
  warmth: number;
  bypass: boolean;
  deessEnabled: boolean;
  deessAmount: number;
  reverbMix: number;
  reverbSize: number;
  normalizeEnabled: boolean;
  normalizeTarget: number;
}

export const DEFAULT_REALTIME_PARAMS: RealtimeMasteringParams = {
  hpFreq: 80,
  hpfEnabled: true,
  plosiveGain: 0,
  mudGain: -2,
  presenceGain: 2.5,
  deessGain: 0,
  airGain: 2,
  threshold: -20,
  ratio: 2.5,
  attack: 0.15,
  release: 1.2,
  makeupGain: 0,
  denoiseEnabled: false,
  noiseGate: -50,
  targetLoudness: -16,
  limiterThreshold: -1,
  exciteAmount: 0.2,
  warmth: 0.1,
  bypass: false,
  deessEnabled: false,
  deessAmount: 0,
  reverbMix: 0,
  reverbSize: 0.5,
  normalizeEnabled: false,
  normalizeTarget: -1.0
};

export const useRealtimeMastering = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const rawAnalyserRef = useRef<AnalyserNode | null>(null);
  const enhancedAnalyserRef = useRef<AnalyserNode | null>(null);
  const fileBufferRef = useRef<AudioBuffer | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [params, setParams] = useState<RealtimeMasteringParams>(DEFAULT_REALTIME_PARAMS);
  const [levels, setLevels] = useState({ input: -100, output: -100, gainReduction: 0 });
  
  const initialize = useCallback(async () => {
    if (audioContextRef.current) return;
    const ctx = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = ctx;
    
    try {
        const blob = new Blob([PROCESSOR_CODE], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        const workletNode = new AudioWorkletNode(ctx, 'mastering-processor');
        workletNodeRef.current = workletNode;
        
        const rawAnalyser = ctx.createAnalyser();
        rawAnalyser.connect(workletNode);
        workletNode.connect(ctx.destination);
        
        const enhancedAnalyser = ctx.createAnalyser();
        workletNode.connect(enhancedAnalyser);
        
        enhancedAnalyserRef.current = enhancedAnalyser;
        rawAnalyserRef.current = rawAnalyser;

        const monitor = () => {
          if (enhancedAnalyserRef.current) {
            const data = new Float32Array(enhancedAnalyserRef.current.frequencyBinCount);
            enhancedAnalyserRef.current.getFloatTimeDomainData(data);
            let sum = 0; for(let i=0; i<data.length; i++) sum += data[i]*data[i];
            const db = 20 * Math.log10(Math.sqrt(sum/data.length) + 0.0001);
            setLevels(prev => ({ ...prev, output: db }));
          }
          requestAnimationFrame(monitor);
        };
        monitor();
        setIsInitialized(true);

    } catch (e) {
        console.error("Mastering Engine Initialization Failed:", e);
    }
  }, []);
  
  useEffect(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ 
          type: 'params', 
          params: { 
              ...params, 
              denoiseEnabled: params.denoiseEnabled ? 1 : 0,
              bypass: params.bypass ? 1 : 0,
              hpfEnabled: params.hpfEnabled ? 1 : 0,
              deessEnabled: params.deessEnabled ? 1 : 0,
              normalizeEnabled: params.normalizeEnabled ? 1 : 0
          } 
      });
    }
  }, [params]);
  
  const loadAudio = useCallback(async (file: File) => {
    if (!audioContextRef.current) await initialize();
    if (sourceNodeRef.current) sourceNodeRef.current.stop();
    setIsPlaying(false);
    const ctx = audioContextRef.current!;
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
    fileBufferRef.current = buffer;
    return buffer.duration;
  }, [initialize]);
  
  const togglePlayback = useCallback(() => {
    if (!audioContextRef.current || !fileBufferRef.current || !rawAnalyserRef.current) return;
    const ctx = audioContextRef.current;
    if (isPlaying) {
        if(sourceNodeRef.current) sourceNodeRef.current.stop();
        setIsPlaying(false);
    } else {
        if (ctx.state === 'suspended') ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = fileBufferRef.current;
        source.loop = true;
        // Check for graph validity before connecting
        if (rawAnalyserRef.current) {
            source.connect(rawAnalyserRef.current);
            source.start();
            sourceNodeRef.current = source;
            setIsPlaying(true);
        }
    }
  }, [isPlaying]);
  
  const updateParam = useCallback(<K extends keyof RealtimeMasteringParams>(key: K, value: RealtimeMasteringParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const setAllParams = useCallback((newParams: RealtimeMasteringParams) => {
      setParams(newParams);
  }, []);

  const getSpectrum = useCallback(() => {
      if (!rawAnalyserRef.current || !enhancedAnalyserRef.current) return null;
      const raw = new Uint8Array(rawAnalyserRef.current.frequencyBinCount);
      const enhanced = new Uint8Array(enhancedAnalyserRef.current.frequencyBinCount);
      rawAnalyserRef.current.getByteFrequencyData(raw);
      enhancedAnalyserRef.current.getByteFrequencyData(enhanced);
      return { raw, enhanced };
  }, []);

  const downloadProcessed = useCallback(async () => {
     if (!fileBufferRef.current) return null;
     const originalBuffer = fileBufferRef.current;
     const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);
     
     // Use inline processor for offline render too
     const blob = new Blob([PROCESSOR_CODE], { type: 'application/javascript' });
     const blobUrl = URL.createObjectURL(blob);
     await offlineCtx.audioWorklet.addModule(blobUrl);
     URL.revokeObjectURL(blobUrl);

     const source = offlineCtx.createBufferSource();
     source.buffer = originalBuffer;
     const worklet = new AudioWorkletNode(offlineCtx, 'mastering-processor');
     worklet.port.postMessage({ type: 'params', params: { ...params, hpfEnabled: params.hpfEnabled ? 1 : 0, deessEnabled: params.deessEnabled ? 1 : 0, bypass: 0 } });
     source.connect(worklet);
     worklet.connect(offlineCtx.destination);
     source.start();
     const renderedBuffer = await offlineCtx.startRendering();
     return await import('./audioUtils').then(m => m.audioBufferToWav(renderedBuffer));
  }, [params]);
  
  return { isInitialized, isPlaying, params, levels, initialize, loadAudio, togglePlayback, updateParam, setAllParams, getSpectrum, downloadProcessed };
};
