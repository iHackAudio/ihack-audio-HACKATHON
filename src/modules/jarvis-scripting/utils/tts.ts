/**
 * Web Speech API Text-to-Speech (TTS) Engine Utility
 * Extracted & enhanced for Jarvis OS Multi-Agent System
 */

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number; // 0.4 to 2.0 (default 0.85)
  pitch?: number; // 0.5 to 2.0 (default 0.95)
  volume?: number; // 0.0 to 1.0 (default 1.0)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export type TTSPresetName = 'narrator' | 'dramatic' | 'slow' | 'podcast' | 'fast';

export const TTS_PRESETS: Record<TTSPresetName, { rate: number; pitch: number }> = {
  narrator: { rate: 0.85, pitch: 0.95 },
  dramatic: { rate: 0.72, pitch: 0.80 },
  slow: { rate: 0.60, pitch: 0.70 },
  podcast: { rate: 1.00, pitch: 1.00 },
  fast: { rate: 1.40, pitch: 1.05 },
};

/**
 * Check if Web Speech API SpeechSynthesis is supported in current browser
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Fetch available browser voices prioritized by English / preferred narrators
 */
export function getTTSVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();

  const engVoices = voices.filter(v => v.lang.startsWith('en'));
  const restVoices = voices.filter(v => !v.lang.startsWith('en'));

  const sortedEng = engVoices.sort((a, b) => {
    const prefA = a.name.toLowerCase().includes('daniel') || a.name.toLowerCase().includes('alex') || a.name.toLowerCase().includes('google uk english male');
    const prefB = b.name.toLowerCase().includes('daniel') || b.name.toLowerCase().includes('alex') || b.name.toLowerCase().includes('google uk english male');
    if (prefA && !prefB) return -1;
    if (!prefA && prefB) return 1;
    return a.name.localeCompare(b.name);
  });

  return [...sortedEng, ...restVoices];
}

/**
 * Strip Markdown tags, code blocks, and formatting before vocalizing
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#>-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak provided text with Web Speech API
 */
export function speakText(text: string, options: TTSOptions = {}): boolean {
  if (!isTTSSupported()) return false;

  const clean = cleanTextForSpeech(text);
  if (!clean) return false;

  // Cancel any ongoing utterance
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = options.rate ?? 0.85;
  utter.pitch = options.pitch ?? 0.95;
  utter.volume = options.volume ?? 1.0;

  if (options.voice) {
    utter.voice = options.voice;
  } else {
    const voices = getTTSVoices();
    if (voices.length > 0) {
      utter.voice = voices[0];
    }
  }

  utter.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utter.onend = () => {
    activeUtterance = null;
    if (options.onEnd) options.onEnd();
  };

  utter.onerror = (evt) => {
    activeUtterance = null;
    if (options.onError) options.onError(evt);
  };

  activeUtterance = utter;
  window.speechSynthesis.speak(utter);
  return true;
}

/**
 * Stop active speech synthesis
 */
export function stopSpeech(): void {
  if (!isTTSSupported()) return;
  activeUtterance = null;
  window.speechSynthesis.cancel();
}

/**
 * Pause active speech synthesis
 */
export function pauseSpeech(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.pause();
}

/**
 * Resume active speech synthesis
 */
export function resumeSpeech(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.resume();
}
