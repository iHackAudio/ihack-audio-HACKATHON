import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isTTSSupported,
  getTTSVoices,
  speakText,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  TTS_PRESETS,
  TTSPresetName,
  TTSOptions
} from '../utils/tts';

export interface UseTTSReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  activePreset: TTSPresetName | 'custom';
  autoSpeak: boolean;
  activeText: string | null;
  speak: (text: string, customOptions?: TTSOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSelectedVoiceIndex: (index: number) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  applyPreset: (presetName: TTSPresetName) => void;
  setAutoSpeak: (enabled: boolean) => void;
  toggleAutoSpeak: () => void;
}

export function useTTS(): UseTTSReturn {
  const supported = isTTSSupported();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const [rate, setRateState] = useState<number>(() => {
    const saved = localStorage.getItem('jarvis_tts_rate');
    return saved ? parseFloat(saved) : 0.85;
  });

  const [pitch, setPitchState] = useState<number>(() => {
    const saved = localStorage.getItem('jarvis_tts_pitch');
    return saved ? parseFloat(saved) : 0.95;
  });

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('jarvis_tts_volume');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [activePreset, setActivePreset] = useState<TTSPresetName | 'custom'>('narrator');

  const [autoSpeak, setAutoSpeakState] = useState<boolean>(() => {
    return localStorage.getItem('jarvis_tts_autospeak') === 'true';
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeText, setActiveText] = useState<string | null>(null);

  // Load available voices
  useEffect(() => {
    if (!supported) return;

    const handleVoicesChanged = () => {
      const available = getTTSVoices();
      setVoices(available);

      const savedVoiceName = localStorage.getItem('jarvis_tts_voice');
      if (savedVoiceName) {
        const found = available.find(v => v.name === savedVoiceName);
        if (found) {
          setSelectedVoice(found);
          return;
        }
      }

      if (available.length > 0 && !selectedVoice) {
        setSelectedVoice(available[0]);
      }
    };

    handleVoicesChanged();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [supported]);

  const setRate = useCallback((val: number) => {
    setRateState(val);
    setActivePreset('custom');
    localStorage.setItem('jarvis_tts_rate', val.toString());
  }, []);

  const setPitch = useCallback((val: number) => {
    setPitchState(val);
    setActivePreset('custom');
    localStorage.setItem('jarvis_tts_pitch', val.toString());
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    localStorage.setItem('jarvis_tts_volume', val.toString());
  }, []);

  const setSelectedVoiceIndex = useCallback((index: number) => {
    if (voices[index]) {
      const v = voices[index];
      setSelectedVoice(v);
      localStorage.setItem('jarvis_tts_voice', v.name);
    }
  }, [voices]);

  const applyPreset = useCallback((presetName: TTSPresetName) => {
    const p = TTS_PRESETS[presetName];
    if (p) {
      setRateState(p.rate);
      setPitchState(p.pitch);
      setActivePreset(presetName);
      localStorage.setItem('jarvis_tts_rate', p.rate.toString());
      localStorage.setItem('jarvis_tts_pitch', p.pitch.toString());
    }
  }, []);

  const setAutoSpeak = useCallback((enabled: boolean) => {
    setAutoSpeakState(enabled);
    localStorage.setItem('jarvis_tts_autospeak', enabled ? 'true' : 'false');
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeakState(prev => {
      const next = !prev;
      localStorage.setItem('jarvis_tts_autospeak', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const speak = useCallback((text: string, customOptions: TTSOptions = {}) => {
    if (!supported || !text) return;

    setIsSpeaking(true);
    setActiveText(text);

    speakText(text, {
      voice: customOptions.voice || selectedVoice,
      rate: customOptions.rate ?? rate,
      pitch: customOptions.pitch ?? pitch,
      volume: customOptions.volume ?? volume,
      onStart: () => {
        setIsSpeaking(true);
        if (customOptions.onStart) customOptions.onStart();
      },
      onEnd: () => {
        setIsSpeaking(false);
        setActiveText(null);
        if (customOptions.onEnd) customOptions.onEnd();
      },
      onError: (err) => {
        setIsSpeaking(false);
        setActiveText(null);
        if (customOptions.onError) customOptions.onError(err);
      }
    });
  }, [supported, selectedVoice, rate, pitch, volume]);

  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
    setActiveText(null);
  }, []);

  const pause = useCallback(() => {
    pauseSpeech();
  }, []);

  const resume = useCallback(() => {
    resumeSpeech();
  }, []);

  return {
    isSupported: supported,
    isSpeaking,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    activePreset,
    autoSpeak,
    activeText,
    speak,
    stop,
    pause,
    resume,
    setSelectedVoiceIndex,
    setRate,
    setPitch,
    setVolume,
    applyPreset,
    setAutoSpeak,
    toggleAutoSpeak
  };
}
