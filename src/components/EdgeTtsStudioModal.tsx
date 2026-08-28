import React, { useState } from 'react';
import { Volume2, Play, Download, Sparkles, Loader2, CheckCircle2, Music, Mic, FileAudio, X, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  locale: string;
}

const EDGE_NEURAL_VOICES: VoiceOption[] = [
  { id: 'en-US-AvaNeural', name: 'Ava (Neural)', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-AndrewNeural', name: 'Andrew (Neural)', gender: 'Male', locale: 'en-US' },
  { id: 'en-US-EmmaNeural', name: 'Emma (Neural)', gender: 'Female', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (Neural)', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (Neural)', gender: 'Male', locale: 'en-GB' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (Neural)', gender: 'Female', locale: 'ja-JP' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (Neural)', gender: 'Female', locale: 'de-DE' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (Neural)', gender: 'Female', locale: 'fr-FR' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (Neural)', gender: 'Female', locale: 'es-ES' },
];

export default function EdgeTtsStudioModal({ onClose }: { onClose: () => void }) {
  const [selectedVoice, setSelectedVoice] = useState('en-US-AvaNeural');
  const [script, setScript] = useState('Welcome to Google AI Studio. This audio was synthesized using Microsoft Edge Neural Voices connected directly via TypeScript Function Calling.');
  const [outputFileName, setOutputFileName] = useState('jarvis_edge_tts_demo.mp3');
  const [loading, setLoading] = useState(false);
  const [aiModeLoading, setAiModeLoading] = useState(false);
  const [audioResult, setAudioResult] = useState<{
    audioUrl?: string;
    message?: string;
    savedTo?: string;
    fileSize?: number;
    traceLog?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mode 1: Direct Edge-TTS synthesis via Express API
  const handleDirectSynthesize = async () => {
    if (!script.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          voice: selectedVoice,
          outputFileName: outputFileName.trim() || 'response_turn.mp3'
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAudioResult({
          audioUrl: data.audioUrl,
          message: data.message,
          savedTo: data.savedTo,
          fileSize: data.fileSize,
          traceLog: `[Edge-TTS Direct Socket] Synthesized ${data.fileSize} bytes -> ${data.savedTo}`
        });
      } else {
        setError(data.error || 'Speech synthesis failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error executing synthesis');
    } finally {
      setLoading(false);
    }
  };

  // Mode 2: Trigger Gemini Function Calling Native Agentic Loop
  const handleGeminiSynthesize = async () => {
    if (!script.trim()) return;
    setAiModeLoading(true);
    setError(null);
    try {
      const promptText = `Please synthesize the following text into speech using the voice profile "${selectedVoice}" and save it as "${outputFileName}": "${script}"`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          agentId: 'jarvis'
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Find Edge-TTS log entry
        const ttsLog = data.logs?.find((l: any) => l.agentId === 'Edge-TTS-Engine');
        const audioUrl = `/api/audio/${encodeURIComponent(outputFileName.endsWith('.mp3') ? outputFileName : outputFileName + '.mp3')}`;
        
        setAudioResult({
          audioUrl: audioUrl,
          message: data.text || 'Gemini native function calling executed successfully.',
          traceLog: ttsLog ? ttsLog.text : `[Gemini Native Function Call] Tool 'synthesizeSpeech' invoked -> ${audioUrl}`
        });
      } else {
        setError(data.error || 'Gemini native tool loop failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to execute Gemini function calling loop');
    } finally {
      setAiModeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl bg-[#0d121f] border border-[#00d2ff]/30 rounded-2xl shadow-[0_0_50px_rgba(0,210,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#121829] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff]">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                Microsoft Edge-TTS Studio
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40">
                  Gemini Native Tool Loop
                </span>
              </h2>
              <p className="text-xs text-white/50">Direct WebSocket Neural Speech Synthesis & Gemini Function Calling</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar font-sans">
          
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#00d2ff] mb-2 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" /> Select Neural Voice Profile
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {EDGE_NEURAL_VOICES.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedVoice === voice.id
                      ? 'bg-[#00d2ff]/15 border-[#00d2ff] text-white shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="font-medium text-sm font-mono truncate">{voice.name}</div>
                  <div className="flex items-center justify-between text-[11px] opacity-60 mt-2 font-mono">
                    <span>{voice.locale}</span>
                    <span className="capitalize">{voice.gender}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Script Input */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#00d2ff] mb-2 flex items-center gap-2">
              <FileAudio className="w-3.5 h-3.5" /> Dialogue / Narration Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={3}
              placeholder="Enter text script to synthesize into audio..."
              className="w-full bg-[#070a13] border border-white/10 focus:border-[#00d2ff]/50 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none resize-none font-sans"
            />
          </div>

          {/* Output Filename */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#00d2ff] mb-2">
              Output Audio Filename (.mp3)
            </label>
            <input
              type="text"
              value={outputFileName}
              onChange={(e) => setOutputFileName(e.target.value)}
              placeholder="response_turn_1.mp3"
              className="w-full bg-[#070a13] border border-white/10 focus:border-[#00d2ff]/50 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          {/* Execution Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDirectSynthesize}
              disabled={loading || aiModeLoading || !script.trim()}
              className="px-4 py-3 rounded-xl bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 text-[#00d2ff] font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.1)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Socket...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" /> Direct Edge-TTS Synthesize
                </>
              )}
            </button>

            <button
              onClick={handleGeminiSynthesize}
              disabled={loading || aiModeLoading || !script.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-purple-300 font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              {aiModeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Executing Gemini Function Call...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-purple-400" /> Gemini Native Function Call
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              ⚠️ Error: {error}
            </div>
          )}

          {/* Audio Output Player & Trace */}
          {audioResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#070a13] border border-emerald-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Audio Synthesis Complete
                </div>
                {audioResult.audioUrl && (
                  <a
                    href={audioResult.audioUrl}
                    download={outputFileName || 'audio.mp3'}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download MP3
                  </a>
                )}
              </div>

              {/* HTML5 Audio Player */}
              {audioResult.audioUrl && (
                <div className="bg-[#121829] p-3 rounded-lg border border-white/10 flex items-center gap-3">
                  <audio controls autoPlay src={audioResult.audioUrl} className="w-full h-9" />
                </div>
              )}

              {/* Telemetry Trace */}
              {audioResult.traceLog && (
                <div className="p-2.5 rounded bg-black/60 text-[11px] font-mono text-white/70 space-y-1">
                  <div className="text-white/40 uppercase text-[9px] tracking-wider">System Execution Trace</div>
                  <div className="text-emerald-400/90 whitespace-pre-wrap">{audioResult.traceLog}</div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
