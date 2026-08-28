// audioWorklet/processor.js
// Real-time mastering processor with Adaptive Morphing and Upward Expansion

class MasteringProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Parameters (will be updated from main thread)
    this.params = {
      // EQ
      hpFreq: 80, // Acts as morph control: + (HPF), - (Low Shelf)
      hpfEnabled: 0,
      plosiveGain: 0,
      mudGain: -2,
      presenceGain: 2.5,
      deessGain: 0, 
      airGain: 2,
      
      // Dynamics
      threshold: -20, // + values amplify (Upward Expansion)
      ratio: 2.5,
      attack: 0.15,
      release: 1.2,
      makeupGain: 0,
      
      // Denoise
      denoiseEnabled: 0,
      noiseGate: -50,
      
      // Enhancers
      exciteAmount: 0, 
      warmth: 0,       
      bypass: 0,       
      
      // New DSP
      deessEnabled: 0,
      deessAmount: 0,  // + (Reduce), - (Boost)
      reverbMix: 0,    
      reverbSize: 0.5,
      
      // Normalization
      normalizeEnabled: 0,
      normalizeTarget: -1.0, // Peak target in dB
      limiterThreshold: -1
    };
    
    // Filter states
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
    this.limiterState = { env: 0, gain: 1 };
    this.deessState = { env: 0, gain: 1 };
    this.reverbBufferL = new Float32Array(48000 * 2);
    this.reverbBufferR = new Float32Array(48000 * 2);
    this.reverbWriteIdx = 0;
    
    this.updateCoefficients(44100);
    
    this.port.onmessage = (e) => {
      if (e.data.type === 'params') {
        Object.assign(this.params, e.data.params);
        this.updateCoefficients(sampleRate);
      }
    };
  }
  
  updateCoefficients(sr) {
    // HPF Logic: If hpFreq is positive, it's a HighPass. If negative, it's a Low Shelf Boost.
    const hpVal = this.params.hpFreq;
    if (hpVal >= 0) {
        this.calcHighpass(this.filters.hp, Math.max(20, hpVal), 0.7, sr);
    } else {
        // -80 becomes 80Hz Low Shelf with 6dB boost
        this.calcLowShelf(this.filters.lowShelf, Math.abs(hpVal), 0.7, 6, sr);
    }

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
    // AMPLIFICATION MODE: Threshold > 0
    if (threshold > 0) {
        if (state.env < threshLin) {
             const ratioVal = 1 + (ratio * 0.1); 
             const dbDiff = 20 * Math.log10(threshLin / (state.env + 0.0001));
             gain = Math.pow(10, (dbDiff * (ratioVal - 1)) / 20);
        }
    } else {
        // STANDARD COMPRESSION: Threshold < 0
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
          // Reduction Mode
          if (state.env > threshold) {
              const ratio = 2 + (amount * 6);
              const dbOver = 20 * Math.log10(state.env / threshold);
              gain = Math.pow(10, (-dbOver * (1 - 1/ratio)) / 20);
          }
      } else {
          // Enhancement Mode (Negative Amount)
          if (state.env > 0.01) {
              const boost = Math.abs(amount) * 2; // Up to 6dB boost
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

    if (this.params.bypass > 0.5) {
      outL.set(inL);
      return true;
    }
    
    for (let i = 0; i < inL.length; i++) {
      let sl = inL[i];
      
      // 1. HPF / Shelf Morph
      if (this.params.hpfEnabled > 0.5) {
          if (this.params.hpFreq >= 0) sl = this.processBiquad(this.filters.hp, sl);
          else sl = this.processBiquad(this.filters.lowShelf, sl);
      }

      // 2. EQ Chain
      sl = this.processBiquad(this.filters.plosive, sl);
      sl = this.processBiquad(this.filters.mud, sl);
      sl = this.processBiquad(this.filters.presence, sl);
      sl = this.processBiquad(this.filters.deess, sl);
      sl = this.processBiquad(this.filters.air, sl);
      
      // 3. Dynamic De-esser (Bi-directional)
      if (this.params.deessEnabled > 0.5) {
          sl = this.processDeesser(sl, this.params.deessAmount, this.deessState);
      }
      
      // 4. Harmonics & Warmth
      if (this.params.exciteAmount > 0) sl += (sl * Math.abs(sl)) * this.params.exciteAmount * 0.5;
      if (this.params.warmth > 0) {
        const drive = 1 + this.params.warmth * 2;
        let x = sl * drive;
        if (x > 1) x = 1; if (x < -1) x = -1;
        sl = x - (x * x * x) / 3;
      }

      // 5. Dynamics (Upward/Downward)
      sl = this.processDynamics(sl, this.params.threshold, this.params.ratio, this.params.attack, this.params.release, this.compState);
      
      // 6. Normalization Stage (Simplified peak normalization)
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