

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const decodeBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const pcmToBase64 = (pcm16Data: Int16Array): string => {
  const buffer = new ArrayBuffer(pcm16Data.length * 2);
  const view = new DataView(buffer);
  pcm16Data.forEach((val, i) => view.setInt16(i * 2, val, true));
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Advanced Decoder V2:
 * 1. Parses Raw PCM 16-bit (24kHz).
 * 2. Applies Anti-Aliasing Filter (LowPass @ 11kHz) to kill metallic hiss.
 * 3. UPSAMPLES to 48kHz using OfflineAudioContext.
 * 4. Returns a broadcast-ready AudioBuffer.
 */
export const decodeAudioData = async (
  arrayBuffer: ArrayBuffer,
  sourceSampleRate: number = 24000,
  numberOfChannels: number = 1
): Promise<AudioBuffer> => {
  // 1. Parse the Raw PCM Data (Int16 -> Float32)
  let byteLength = arrayBuffer.byteLength;
  if (byteLength % 2 !== 0) byteLength -= 1; // Align to 2 bytes

  const dataView = new DataView(arrayBuffer, 0, byteLength);
  const frameCount = Math.floor(byteLength / 2);
  const rawFloat32 = new Float32Array(frameCount);

  for (let i = 0; i < frameCount; i++) {
    const sample = dataView.getInt16(i * 2, true); // Little Endian
    // Normalize to -1.0 -> 1.0
    rawFloat32[i] = sample < 0 ? sample / 0x8000 : sample / 0x7FFF;
  }

  // 2. Prepare for Resampling to 48kHz (Broadcast Standard)
  const TARGET_SAMPLE_RATE = 48000;
  
  // Create source buffer container
  const tempCtx = new OfflineAudioContext(1, 1, sourceSampleRate);
  const sourceBuffer = tempCtx.createBuffer(numberOfChannels, frameCount, sourceSampleRate);
  sourceBuffer.copyToChannel(rawFloat32, 0);

  // 3. Render / Resample with Anti-Aliasing Filter
  const duration = frameCount / sourceSampleRate;
  const targetLength = Math.ceil(duration * TARGET_SAMPLE_RATE);

  const renderCtx = new OfflineAudioContext(
    numberOfChannels,
    targetLength,
    TARGET_SAMPLE_RATE
  );

  const sourceNode = renderCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;

  // CRITICAL FIX: Anti-Aliasing Filter
  // Since we are upsampling from 24kHz, the Nyquist frequency is 12kHz.
  // Any content above 12kHz in the 48kHz domain will sound like metallic aliasing.
  // We apply a steep LowPass filter at 11kHz to clean the signal before it hits output.
  const antiAliasingFilter = renderCtx.createBiquadFilter();
  antiAliasingFilter.type = 'lowpass';
  antiAliasingFilter.frequency.value = 11000; // Just below Nyquist of source
  antiAliasingFilter.Q.value = 0.707; // Butterworth quality factor for flat passband

  sourceNode.connect(antiAliasingFilter);
  antiAliasingFilter.connect(renderCtx.destination);
  
  sourceNode.start(0);

  return await renderCtx.startRendering();
};

export const concatenateAudioBuffers = (
  audioContext: AudioContext | OfflineAudioContext,
  buffers: AudioBuffer[]
): AudioBuffer => {
  if (buffers.length === 0) return audioContext.createBuffer(1, 1, 48000);

  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = audioContext.createBuffer(
    1, 
    totalLength,
    48000 // Force standard
  );
  
  let offset = 0;
  for (const buffer of buffers) {
    // Resample if necessary (naive copy, assume 48k for now as decodeAudioData ensures it)
    result.copyToChannel(buffer.getChannelData(0), 0, offset);
    offset += buffer.length;
  }
  return result;
};

// --- PROCEDURAL SFX ENGINE ---

export class ProceduralSoundGenerator {
  static async generate(type: string, durationSec: number = 2.0): Promise<AudioBuffer> {
    const sr = 48000;
    const length = sr * durationSec;
    const ctx = new OfflineAudioContext(1, length, sr);
    
    // Helper: White Noise Buffer
    const createNoise = () => {
        const b = ctx.createBuffer(1, sr * durationSec, sr);
        const d = b.getChannelData(0);
        for(let i=0; i<d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
    };

    const noiseBuffer = createNoise();
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const t = type.toLowerCase().trim();

    if (t.includes('silence') || t.includes('pause')) {
       // Just empty buffer
    }
    else if (t.includes('rain')) {
        // Pink-ish noise via Lowpass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        
        noiseSrc.connect(filter);
        filter.connect(ctx.destination);
        noiseSrc.start();
    } 
    else if (t.includes('thunder') || t.includes('boom') || t.includes('impact')) {
        // Low boom + Reverb tail feel
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1, 0);
        gain.gain.exponentialRampToValueAtTime(0.01, durationSec);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noiseSrc.start();
    }
    else if (t.includes('phone') || t.includes('beep') || t.includes('alarm')) {
        // Sine waves
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, 0);
        
        // Ring modulation effect
        const lfo = ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = 15; // Ringer speed
        
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        
        const masterGain = ctx.createGain();
        lfo.connect(masterGain.gain);
        
        osc.connect(masterGain);
        masterGain.connect(ctx.destination);
        
        osc.start();
        lfo.start();
        masterGain.gain.setValueAtTime(0.5, 0);
        masterGain.gain.setValueAtTime(0, durationSec * 0.8);
    }
    else if (t.includes('glitch') || t.includes('static')) {
        // Highpass noise with random gating
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        const gain = ctx.createGain();
        // Create rhythmic stutter
        for(let i=0; i<durationSec*10; i++) {
            gain.gain.setValueAtTime(Math.random() > 0.5 ? 0.8 : 0, i * 0.1);
        }
        
        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noiseSrc.start();
    }
    else if (t.includes('whoosh') || t.includes('transition')) {
        // Bandpass sweep
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, 0);
        filter.frequency.exponentialRampToValueAtTime(3000, durationSec);
        filter.Q.value = 1;

        noiseSrc.connect(filter);
        filter.connect(ctx.destination);
        noiseSrc.start();
    }
    else {
        // Default: Soft Ambience (Filtered Noise)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        noiseSrc.connect(filter);
        filter.connect(ctx.destination);
        noiseSrc.start();
    }

    return await ctx.startRendering();
  }
}

export const generateSimulatedSfx = (name: string, ctx: AudioContext): AudioBuffer => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0; i < buffer.length; i++) {
    data[i] = (Math.random() * 0.5) - 0.25; 
  }
  return buffer;
};

export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const length = buffer.length * 2; 
  const view = new DataView(new ArrayBuffer(44 + length));
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };

  // RIFF Chunk
  writeString(view, 0, 'RIFF'); 
  view.setUint32(4, 36 + length, true); 
  writeString(view, 8, 'WAVE');
  
  // FMT Chunk
  writeString(view, 12, 'fmt '); 
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (Mono)
  view.setUint32(24, buffer.sampleRate, true); // SampleRate
  view.setUint32(28, buffer.sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  
  // Data Chunk
  writeString(view, 36, 'data'); 
  view.setUint32(40, length, true);
  
  // PCM Data
  const data = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    // Clamp values to prevent wrap-around distortion
    const s = Math.max(-1, Math.min(1, data[i]));
    // Convert Float32 to Int16
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
};