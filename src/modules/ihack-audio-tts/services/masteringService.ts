

import { audioBufferToWav } from './audioUtils';
import { MasteringSettings, MasteringContext, AudioSegment, MasteringPreset } from '../types/ihackAudioTypes';

export const DEFAULT_MASTERING_SETTINGS: MasteringSettings = {
  filteringMethod: 'voice_auto_eq',
  adaptiveLeveler: true,
  loudnessTarget: -16,
  normalizationMethod: 'program',
  denoiseMethod: 'dynamic',
  noiseReductionDb: 12,
  removeBreaths: false,
  removeReverb: false,
  exciteAmount: 0,
  warmth: 0,
  deessAmount: 0,
  reverbMix: 0,
  reverbSize: 0.5,
  reverbDecay: 0.5
};

// Optimized FFT (Cooley-Tukey)
function fft(input: Float32Array): Float32Array {
  const n = input.length;
  const real = new Float32Array(input);
  const imag = new Float32Array(n);
  
  // Bit reversal
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let k = n / 2;
    while (k <= j) {
      j -= k;
      k /= 2;
    }
    j += k;
  }
  
  // Butterfly
  for (let len = 2; len <= n; len *= 2) {
    const angle = -2 * Math.PI / len;
    const wlen_r = Math.cos(angle);
    const wlen_i = Math.sin(angle);
    
    for (let i = 0; i < n; i += len) {
      let w_r = 1, w_i = 0;
      for (let j = 0; j < len / 2; j++) {
        const u_r = real[i + j], u_i = imag[i + j];
        const v_r = real[i + j + len / 2] * w_r - imag[i + j + len / 2] * w_i;
        const v_i = real[i + j + len / 2] * w_i + imag[i + j + len / 2] * w_r;
        
        real[i + j] = u_r + v_r;
        imag[i + j] = u_i + v_i;
        real[i + j + len / 2] = u_r - v_r;
        imag[i + j + len / 2] = u_i - v_i;
        
        const temp_r = w_r * wlen_r - w_i * wlen_i;
        w_i = w_r * wlen_i + w_i * wlen_r;
        w_r = temp_r;
      }
    }
  }
  
  const magnitudes = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  return magnitudes;
}

export class AnalyticalMasteringService {
  async masterAudio(
    audioBuffer: AudioBuffer,
    settings: MasteringSettings,
    onProgress?: (stage: string, percent?: number) => void
  ): Promise<AudioBuffer> {
    return this.processAudio(audioBuffer, settings, onProgress);
  }
  
  async processAudio(
    audioBuffer: AudioBuffer,
    settings: MasteringSettings,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<AudioBuffer> {
    
    onProgress?.('Analyzing audio...', 5);
    const context = await this.analyzeAudio(audioBuffer, onProgress);
    
    let processed = audioBuffer;
    
    // 1. Denoise
    if (settings.denoiseMethod !== 'none') {
      onProgress?.('Applying denoising...', 20);
      processed = await this.applyDenoising(processed, context, settings);
    }

    // 2. EQ & Filtering
    if (settings.filteringMethod !== 'none') {
      onProgress?.('Applying adaptive EQ...', 30);
      processed = await this.applyAdaptiveFiltering(processed, context, settings);
    }

    // 3. De-esser (Multiband Compression)
    if (settings.deessAmount && settings.deessAmount > 0) {
        onProgress?.('Applying Spectral De-esser...', 40);
        processed = await this.applyDeesser(processed, settings.deessAmount);
    }

    // 4. Enhancers (Exciter/Warmth)
    if ((settings.exciteAmount && settings.exciteAmount > 0) || (settings.warmth && settings.warmth > 0)) {
        onProgress?.('Applying Neural Saturation...', 50);
        processed = await this.applyEnhancers(processed, settings);
    }
    
    // 5. Reverb
    if (settings.reverbMix && settings.reverbMix > 0) {
        onProgress?.('Generating Spatial Reverb...', 60);
        processed = await this.applyReverb(processed, settings);
    }

    // 6. Leveling
    if (settings.adaptiveLeveler) {
      onProgress?.('Applying adaptive leveling...', 75);
      processed = await this.applyAdaptiveLeveling(processed, context, settings);
    }
    
    // 7. Normalization & Limiting
    onProgress?.('Normalizing loudness...', 90);
    processed = await this.applyLoudnessNormalization(processed, context, settings);
    
    onProgress?.('Complete!', 100);
    return processed;
  }

  // --- ANALYSIS ---
  
  public async analyzeAudio(
    buffer: AudioBuffer, 
    onProgress?: (stage: string, percent: number) => void
  ): Promise<MasteringContext> {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    
    const windowSize = 4096;
    const hopSize = 2048;
    const totalFrames = Math.floor((channelData.length - windowSize) / hopSize);
    
    const segments: AudioSegment[] = [];
    let noiseFloor = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const frame = channelData.slice(i, i + windowSize);
      const features = this.extractFeatures(frame, sampleRate);
      const time = i / sampleRate;
      
      totalEnergy += features.energy;
      
      const type = this.classifyFrame(features);
      const windowDuration = hopSize / sampleRate;
      
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.type === type && 
          (time - lastSegment.end) < windowDuration * 3) {
        lastSegment.end = time + windowDuration;
        lastSegment.loudness = lastSegment.loudness * 0.8 + features.rms * 0.2;
      } else {
        segments.push({
          start: time,
          end: time + windowDuration,
          type,
          loudness: features.rms,
          spectralCentroid: features.spectralCentroid,
          zeroCrossingRate: features.zcr,
          confidence: features.energy > 0.001 ? 0.9 : 0.5
        });
      }
      
      if (type === 'silence' || type === 'background') {
        noiseFloor = Math.max(noiseFloor, features.rms);
      }
      
      if (i % (hopSize * 1000) === 0 && onProgress) {
        const pct = Math.round((i / channelData.length) * 15);
        onProgress('Analyzing content...', pct);
      }
    }
    
    const hasPlosives = this.detectPlosives(channelData, sampleRate);
    const hasSibilance = this.detectSibilance(channelData, sampleRate);
    const bandwidth = this.estimateBandwidth(channelData, sampleRate);
    
    return {
      segments,
      globalLoudness: 20 * Math.log10((totalEnergy / totalFrames) + 0.0001),
      noiseFloor: 20 * Math.log10(noiseFloor + 0.0001),
      hasPlosives,
      hasSibilance,
      bandwidth,
      sampleRate
    };
  }
  
  private extractFeatures(frame: Float32Array, sampleRate: number) {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    
    let zcr = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) zcr++;
    }
    zcr /= frame.length;
    
    const magnitudes = fft(frame);
    let centroidSum = 0, magnitudeSum = 0;
    const binFreq = (sampleRate / 2) / magnitudes.length;
    
    for (let i = 0; i < magnitudes.length; i++) {
      centroidSum += (i * binFreq) * magnitudes[i];
      magnitudeSum += magnitudes[i];
    }
    
    return {
      rms: Math.max(rms, 0.0001),
      energy: rms,
      zcr,
      spectralCentroid: magnitudeSum > 0 ? centroidSum / magnitudeSum : 0
    };
  }
  
  private classifyFrame(features: { rms: number; zcr: number; spectralCentroid: number }): AudioSegment['type'] {
    const { rms, zcr, spectralCentroid } = features;
    if (rms < 0.005) return 'silence';
    if (spectralCentroid > 300 && spectralCentroid < 4500 && zcr > 0.02 && zcr < 0.4 && rms > 0.01) return 'speech';
    if (spectralCentroid > 1000 && rms > 0.02) return 'music';
    return 'background';
  }
  
  private detectPlosives(data: Float32Array, sampleRate: number): boolean {
    const limit = Math.min(data.length, sampleRate * 30);
    const window = Math.floor(sampleRate * 0.02);
    let count = 0;
    
    for (let i = 0; i < limit; i += window) {
      const slice = data.slice(i, i + window);
      const freqs = fft(slice);
      const binSize = sampleRate / window;
      let lowEnergy = 0, totalEnergy = 0;
      for (let f = 0; f < freqs.length; f++) {
        if (f * binSize < 200) lowEnergy += freqs[f];
        totalEnergy += freqs[f];
      }
      if (totalEnergy > 0 && (lowEnergy / totalEnergy) > 0.6) count++;
    }
    return count > 5;
  }
  
  private detectSibilance(data: Float32Array, sampleRate: number): boolean {
    const limit = Math.min(data.length, sampleRate * 10);
    const window = 2048;
    let sibilantFrames = 0;
    
    for (let i = 0; i < limit; i += window) {
      const freqs = fft(data.slice(i, i + window));
      const binSize = sampleRate / window;
      let highEnergy = 0, totalEnergy = 0;
      for (let f = 0; f < freqs.length; f++) {
        const freq = f * binSize;
        if (freq > 5000 && freq < 9000) highEnergy += freqs[f];
        totalEnergy += freqs[f];
      }
      if (totalEnergy > 0 && (highEnergy / totalEnergy) > 0.3) sibilantFrames++;
    }
    return sibilantFrames > 10;
  }
  
  private estimateBandwidth(data: Float32Array, sampleRate: number): MasteringContext['bandwidth'] {
    const samples = Math.min(data.length, sampleRate * 5);
    const frameSize = 4096;
    let highEnergy = 0, totalEnergy = 0;
    
    for (let i = 0; i < samples - frameSize; i += frameSize) {
      const freqs = fft(data.slice(i, i + frameSize));
      const binSize = sampleRate / frameSize;
      for (let f = 0; f < freqs.length; f++) {
        if (f * binSize > 10000) highEnergy += freqs[f];
        totalEnergy += freqs[f];
      }
    }
    const ratio = highEnergy / (totalEnergy + 0.0001);
    if (ratio < 0.005) return 'narrow';
    if (ratio < 0.05) return 'full';
    return 'extended';
  }
  
  // --- DSP MODULES ---

  private async applyDeesser(buffer: AudioBuffer, amount: number): Promise<AudioBuffer> {
     // Multiband approach for offline processing
     const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
     const source = offlineCtx.createBufferSource();
     source.buffer = buffer;

     // 1. High Split (Sibilance Range 5kHz - 10kHz)
     const hp = offlineCtx.createBiquadFilter();
     hp.type = 'highpass';
     hp.frequency.value = 5000;
     const lp = offlineCtx.createBiquadFilter();
     lp.type = 'lowpass';
     lp.frequency.value = 10000;

     // 2. Low Split (Body)
     const bodyLp = offlineCtx.createBiquadFilter();
     bodyLp.type = 'lowpass';
     bodyLp.frequency.value = 5000;

     // Path A: Sibilance Compression
     const compressor = offlineCtx.createDynamicsCompressor();
     compressor.threshold.value = -30 * amount; // Adaptive threshold
     compressor.ratio.value = 4 + (amount * 4); // Aggressive ratio
     compressor.attack.value = 0.002;
     compressor.release.value = 0.05;

     // Path B: Body (Untouched dynamics)
     
     // Routing
     source.connect(hp);
     hp.connect(lp);
     lp.connect(compressor);
     compressor.connect(offlineCtx.destination);

     source.connect(bodyLp);
     bodyLp.connect(offlineCtx.destination);
     
     // Path C: Super Highs (>10kHz, often safe) - re-add to avoid dullness
     const airHp = offlineCtx.createBiquadFilter();
     airHp.type = 'highpass';
     airHp.frequency.value = 10000;
     source.connect(airHp);
     airHp.connect(offlineCtx.destination);

     source.start();
     return await offlineCtx.startRendering();
  }

  private async applyReverb(buffer: AudioBuffer, settings: MasteringSettings): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Generate Synthetic Impulse Response (Schroeder/Exponential Decay)
    const duration = 2.0 * (settings.reverbDecay || 0.5);
    const decay = 2.0 * (settings.reverbSize || 0.5);
    const rate = offlineCtx.sampleRate;
    const length = rate * duration;
    const impulse = offlineCtx.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        // Noise * Exponential Decay
        const n = i / length;
        const e = Math.pow(1 - n, decay * 4); 
        impulseL[i] = (Math.random() * 2 - 1) * e;
        impulseR[i] = (Math.random() * 2 - 1) * e;
    }

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = impulse;
    
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = settings.reverbMix || 0;
    
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - (settings.reverbMix || 0);

    // Wet Path
    source.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(offlineCtx.destination);

    // Dry Path
    source.connect(dryGain);
    dryGain.connect(offlineCtx.destination);

    source.start();
    return await offlineCtx.startRendering();
  }

  private async applyEnhancers(buffer: AudioBuffer, settings: MasteringSettings): Promise<AudioBuffer> {
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      
      let lastNode: AudioNode = source;
      
      if (settings.warmth && settings.warmth > 0) {
          const shaper = offlineCtx.createWaveShaper();
          const curve = new Float32Array(4096);
          const drive = 1 + settings.warmth * 2;
          for (let i = 0; i < 4096; i++) {
              const x = (i * 2) / 4096 - 1;
              let val = x * drive;
              if (val > 1) val = 1;
              if (val < -1) val = -1;
              val = val - (val*val*val)/3; // Soft clip
              curve[i] = val;
          }
          shaper.curve = curve;
          lastNode.connect(shaper);
          lastNode = shaper;
      }
      
      // Basic exciter by adding high-pass distortion
      if (settings.exciteAmount && settings.exciteAmount > 0) {
          const hp = offlineCtx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 3000;
          
          const drive = offlineCtx.createGain();
          drive.gain.value = settings.exciteAmount;
          
          source.connect(hp);
          hp.connect(drive);
          
          // Mix back into main chain
          drive.connect(offlineCtx.destination);
      }
      
      lastNode.connect(offlineCtx.destination);
      source.start();
      return await offlineCtx.startRendering();
  }

  private async applyAdaptiveFiltering(buffer: AudioBuffer, context: MasteringContext, settings: MasteringSettings): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 80;
    hp.Q.value = 0.7;
    
    const mudCut = offlineCtx.createBiquadFilter();
    mudCut.type = 'peaking';
    mudCut.frequency.value = 250;
    mudCut.Q.value = 1.0;
    mudCut.gain.value = -2;
    
    source.connect(hp);
    hp.connect(mudCut);
    let lastNode: AudioNode = mudCut;
    
    if (settings.filteringMethod === 'voice_auto_eq') {
      if (context.hasPlosives) {
        const plosiveCut = offlineCtx.createBiquadFilter();
        plosiveCut.type = 'peaking';
        plosiveCut.frequency.value = 120;
        plosiveCut.Q.value = 0.8;
        plosiveCut.gain.value = -3;
        lastNode.connect(plosiveCut);
        lastNode = plosiveCut;
      }
      
      const presence = offlineCtx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3500;
      presence.Q.value = 0.8;
      presence.gain.value = 2.5;
      lastNode.connect(presence);
      lastNode = presence;
      
      // Additional static De-ess notch if severe
      if (context.hasSibilance) {
        const deess = offlineCtx.createBiquadFilter();
        deess.type = 'peaking';
        deess.frequency.value = 7000;
        deess.Q.value = 2.5;
        deess.gain.value = -3;
        lastNode.connect(deess);
        lastNode = deess;
      }
      
      const air = offlineCtx.createBiquadFilter();
      air.type = 'highshelf';
      air.frequency.value = 12000;
      air.Q.value = 0.7;
      air.gain.value = 2;
      lastNode.connect(air);
      lastNode = air;
    }
    
    lastNode.connect(offlineCtx.destination);
    source.start();
    
    return await offlineCtx.startRendering();
  }
  
  private async applyAdaptiveLeveling(buffer: AudioBuffer, context: MasteringContext, settings: MasteringSettings): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    const leveler = offlineCtx.createDynamicsCompressor();
    leveler.threshold.value = -20;
    leveler.knee.value = 15;
    leveler.ratio.value = 2.5;
    leveler.attack.value = 0.15;
    leveler.release.value = 1.2;
    
    const makeup = offlineCtx.createGain();
    const targetRMS = 0.1; 
    const currentRMS = Math.pow(10, context.globalLoudness / 20);
    const makeupDb = 20 * Math.log10(targetRMS / (currentRMS + 0.0001));
    const clampedMakeup = Math.max(-12, Math.min(12, makeupDb));
    makeup.gain.value = Math.pow(10, clampedMakeup / 20);
    
    source.connect(leveler);
    leveler.connect(makeup);
    makeup.connect(offlineCtx.destination);
    
    source.start();
    return await offlineCtx.startRendering();
  }
  
  private async applyDenoising(buffer: AudioBuffer, context: MasteringContext, settings: MasteringSettings): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    if (settings.denoiseMethod === 'static') {
      const hp = offlineCtx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 100;
      const lp = offlineCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 15000;
      source.connect(hp);
      hp.connect(lp);
      lp.connect(offlineCtx.destination);
    } else if (settings.denoiseMethod === 'dynamic') {
      const reduction = settings.noiseReductionDb;
      const threshold = context.noiseFloor + (20 - reduction);
      const expander = offlineCtx.createDynamicsCompressor();
      expander.threshold.value = Math.min(-40, threshold);
      expander.knee.value = 10;
      expander.ratio.value = 3;
      expander.attack.value = 0.005;
      expander.release.value = 0.1;
      source.connect(expander);
      expander.connect(offlineCtx.destination);
    } else {
      const hp = offlineCtx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;
      const comp = offlineCtx.createDynamicsCompressor();
      comp.threshold.value = -30;
      comp.ratio.value = 4;
      source.connect(hp);
      hp.connect(comp);
      comp.connect(offlineCtx.destination);
    }
    
    source.start();
    return await offlineCtx.startRendering();
  }
  
  private async applyLoudnessNormalization(buffer: AudioBuffer, context: MasteringContext, settings: MasteringSettings): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    let currentDb = context.globalLoudness;
    if (settings.normalizationMethod === 'dialog') {
      const speechSegments = context.segments.filter(s => s.type === 'speech');
      if (speechSegments.length > 0) {
        const avgSpeech = speechSegments.reduce((a, s) => a + s.loudness, 0) / speechSegments.length;
        currentDb = 20 * Math.log10(avgSpeech + 0.0001);
      }
    }
    
    const gainDb = settings.loudnessTarget - currentDb;
    const gainLinear = Math.pow(10, Math.min(gainDb / 20, 6)); 
    
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = gainLinear;
    
    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -1.0;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.05;
    
    source.connect(gainNode);
    gainNode.connect(limiter);
    limiter.connect(offlineCtx.destination);
    
    source.start();
    return await offlineCtx.startRendering();
  }
}

export const masterAudio = async (file: File, preset: MasteringPreset, onProgress?: (stage: string, percent: number) => void): Promise<Blob> => {
  const service = new AnalyticalMasteringService();
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const settings: MasteringSettings = { ...DEFAULT_MASTERING_SETTINGS };
  
  switch (preset) {
    case 'BROADCAST_READY':
      settings.loudnessTarget = -16;
      settings.adaptiveLeveler = true;
      settings.filteringMethod = 'voice_auto_eq';
      settings.exciteAmount = 0.1;
      settings.warmth = 0.1;
      break;
    case 'CINEMATIC_WARM':
      settings.loudnessTarget = -18;
      settings.denoiseMethod = 'static';
      settings.warmth = 0.4;
      settings.reverbMix = 0.1; 
      break;
    case 'CRISP_VOCAL':
      settings.loudnessTarget = -16;
      settings.filteringMethod = 'bandwidth_extension';
      settings.noiseReductionDb = 15;
      settings.exciteAmount = 0.3;
      settings.deessAmount = 0.4;
      break;
    case 'VOCAL_CLARITY':
      settings.loudnessTarget = -19;
      settings.denoiseMethod = 'speech_isolation';
      settings.normalizationMethod = 'dialog';
      settings.exciteAmount = 0.2;
      settings.deessAmount = 0.3;
      break;
  }
  
  const resultBuffer = await service.processAudio(audioBuffer, settings, onProgress);
  return audioBufferToWav(resultBuffer);
};

export const performForensicScan = async (file: File): Promise<MasteringContext> => {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new OfflineAudioContext(1, 1, 48000); 
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const service = new AnalyticalMasteringService();
    return await service.analyzeAudio(buffer);
};

export const MasteringService = AnalyticalMasteringService;
