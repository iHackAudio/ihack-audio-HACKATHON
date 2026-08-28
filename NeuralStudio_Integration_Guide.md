# Neural Studio - Integration Guide

This guide provides the complete code and instructions for integrating the **Neural Studio** audio synthesis engine into any React/TypeScript application. It utilizes the `@google/genai` SDK to interface with Gemini's raw audio generation endpoints, allowing you to synthesize high-quality speech directly from a script.

## 1. Prerequisites & Installation

Ensure your project is set up with React (Vite recommended) and Tailwind CSS.

Install the required Google Gen AI SDK:

```bash
npm install @google/genai
```

## 2. Core Service: `geminiService.ts`

Create a service file to handle the API connection and audio decoding. This uses the `@google/genai` SDK and the `responseModalities: ["AUDIO"]` configuration.

```typescript
// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';

// Initialize the client. In a real app, ensure this key is secure.
// For client-side lab tools, it's typically provided via a settings panel or environment variable.
export const getGenAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export interface SpeechSynthesisOptions {
  modelId: string;
  voiceName: string;
  systemInstruction?: string;
}

/**
 * Synthesizes speech from text using Gemini Audio models.
 * Recombines chunked base64 output into an AudioBuffer.
 */
export const synthesizeSpeech = async (
  promptText: string,
  apiKey: string,
  options: SpeechSynthesisOptions
): Promise<AudioBuffer> => {
  const ai = getGenAIClient(apiKey);
  
  // Format the prompt if system instructions are provided
  let finalPromptText = promptText;
  if (options.systemInstruction) {
    finalPromptText = `${options.systemInstruction}\n\n[SCRIPT START]\n${promptText}`;
  }

  const response = await ai.models.generateContent({
    model: options.modelId, // e.g., 'gemini-2.5-pro-preview-tts'
    contents: [{ parts: [{ text: finalPromptText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: options.voiceName }
        }
      },
      maxOutputTokens: 8192
    }
  });

  const bytesArray: Uint8Array[] = [];
  const parts = response.candidates?.[0]?.content?.parts || [];
  
  // Decode base64 chunks
  for (const part of parts) {
    const base64Audio = part.inlineData?.data;
    if (base64Audio) {
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      bytesArray.push(bytes);
    }
  }

  if (bytesArray.length === 0) {
    throw new Error("TTS synthesis returned empty audio data.");
  }

  // Combine chunks
  const totalLength = bytesArray.reduce((acc, a) => acc + a.length, 0);
  const allBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of bytesArray) {
    allBytes.set(arr, offset);
    offset += arr.length;
  }

  // Decode audio data for playback
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decodedBuffer = await audioContext.decodeAudioData(allBytes.buffer);
  
  return decodedBuffer;
};

/**
 * Helper to convert AudioBuffer to a playable Blob/URL
 */
export const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = new Float32Array(buffer.length * numChannels);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      result[i * numChannels + channel] = channelData[i];
    }
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferArray = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferArray);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
};
```

## 3. UI Component: `NeuralStudio.tsx`

This component creates the studio interface, manages the state, and triggers the audio generation using the service.

```tsx
// src/components/NeuralStudio.tsx
import React, { useState } from 'react';
import { synthesizeSpeech, audioBufferToWavBlob } from '../services/geminiService';
// Note: You will need lucide-react for these icons, or replace them.
import { Sparkles, Loader2, Download, Trash2, Headphones, Play, FileCode2 } from 'lucide-react'; 

export const NeuralStudio = ({ apiKey }: { apiKey: string }) => {
  const [scriptText, setScriptText] = useState("");
  const [directorNotes, setDirectorNotes] = useState("Perform with a warm, natural, and engaging tone.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [ttsModel, setTtsModel] = useState('gemini-2.5-flash-preview-tts');
  const [voiceName, setVoiceName] = useState('Puck');

  const handleGenerate = async () => {
    if (!scriptText || !apiKey) return;
    
    setIsGenerating(true);
    setAudioUrl(null);
    
    try {
      const buffer = await synthesizeSpeech(scriptText, apiKey, {
        modelId: ttsModel,
        voiceName: voiceName,
        systemInstruction: directorNotes
      });
      
      const blob = audioBufferToWavBlob(buffer);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error: any) {
      console.error("Synthesis failed:", error);
      alert(`Synthesis Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-950 text-slate-200 min-h-screen font-sans">
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <Wand2 className="w-8 h-8 text-pink-500" />
        <h2 className="text-3xl font-black">Neural Studio</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Settings & Director Notes */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-pink-500 mb-4">
              Engine Configuration
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Model Selection */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">TTS Model</label>
                <select 
                  value={ttsModel}
                  onChange={(e) => setTtsModel(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm focus:border-pink-500 outline-none"
                >
                  <option value="gemini-3.1-flash-tts-preview">Gemini 3.1 Flash</option>
                  <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro TTS</option>
                </select>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Voice Profile</label>
                <select 
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm focus:border-pink-500 outline-none"
                >
                  <option value="Puck">Puck</option>
                  <option value="Charon">Charon</option>
                  <option value="Aoede">Aoede</option>
                  <option value="Fenrir">Fenrir</option>
                  <option value="Kore">Kore</option>
                </select>
              </div>

              {/* Director Notes */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Director Notes (System Prompt)</label>
                <textarea 
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm min-h-[120px] focus:border-pink-500 outline-none resize-y"
                  placeholder="Instructions for the AI voice actor..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editor & Player */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900/40 rounded-3xl border border-white/5 flex flex-col overflow-hidden min-h-[500px]">
            
            {/* Editor Toolbar */}
            <div className="bg-slate-950/50 p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-sm uppercase font-bold">
                <FileCode2 className="w-5 h-5" />
                Script Editor
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setScriptText('')}
                  className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !scriptText}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-pink-900/30 flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Synthesizing...' : 'Generate Audio'}
                </button>
              </div>
            </div>

            {/* Script Textarea */}
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Enter your script here to generate audio..."
              className="flex-1 w-full bg-transparent p-6 text-slate-300 font-mono text-sm leading-8 outline-none resize-none min-h-[300px] custom-scrollbar"
            />
          </div>

          {/* Mastered Artifact Output */}
          {audioUrl && (
            <div className="bg-slate-900/60 rounded-3xl border border-pink-500/20 p-6 flex items-center gap-6 relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="flex flex-col gap-1 z-10 w-1/3">
                <h3 className="font-black text-lg flex items-center gap-2 text-white">
                  <Headphones className="w-5 h-5 text-pink-400" /> Mastered Audio
                </h3>
                <p className="text-xs text-slate-400">Ready for playback or download</p>
              </div>

              <div className="flex-1 flex items-center gap-4 z-10">
                <audio controls src={audioUrl} className="w-full h-12 outline-none rounded-xl" />
                <a 
                  href={audioUrl}
                  download={`synthesis_${Date.now()}.wav`}
                  className="bg-slate-800 hover:bg-pink-600 text-white p-3 rounded-xl transition-colors border border-white/5"
                  title="Download WAV"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```
