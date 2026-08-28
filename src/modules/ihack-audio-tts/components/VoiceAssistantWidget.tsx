import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Settings, VolumeX, ShieldCheck, Cpu } from 'lucide-react';
import { pcmToBase64 } from '../services/audioUtils';

interface VoiceAssistantProps {
  onApplyInstructions: (args: any) => void;
  onAppControl: (args: any) => void;
  onUpdateContext?: (args: any) => void;
  onTransferContext?: (args: any) => void;
  onTranscribe?: (msg: { sender: 'jojo' | 'user', text: string }) => void;
  onToggleWorkspace?: () => void;
  selectedModel?: string;
  apiKey?: string;
  systemInstruction?: string;
}

export function VoiceAssistantWidget({ 
  onApplyInstructions, 
  onAppControl, 
  onUpdateContext, 
  onTransferContext, 
  onTranscribe, 
  onToggleWorkspace,
  selectedModel,
  apiKey,
  systemInstruction
}: VoiceAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const speechRecoRef = useRef<any>(null);
  
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const startLiveSession = async () => {
    setIsConnecting(true);
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = new URL(`${protocol}//${location.host}/live`);
      if (selectedModel) url.searchParams.set('model', selectedModel);
      if (apiKey) url.searchParams.set('key', apiKey);
      if (systemInstruction) url.searchParams.set('instruction', systemInstruction);
      
      wsRef.current = new WebSocket(url.toString());
      
      wsRef.current.onopen = async () => {
        setIsConnecting(false);
        setIsActive(true);
        
        // Setup Audio contexts
        const InputCtx = window.AudioContext || (window as any).webkitAudioContext;
        inputAudioCtxRef.current = new InputCtx({ sampleRate: 16000 });
        outputAudioCtxRef.current = new InputCtx({ sampleRate: 24000 });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const float32Data = e.inputBuffer.getChannelData(0);
          
          const pcm16Data = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
             const s = Math.max(-1, Math.min(1, float32Data[i]));
             pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
           
          const buffer = new ArrayBuffer(pcm16Data.length * 2);
          const view = new DataView(buffer);
          pcm16Data.forEach((val, i) => view.setInt16(i * 2, val, true));
          
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);

          wsRef.current.send(JSON.stringify({ audio: base64 }));
        };
      };

      wsRef.current.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.transcription && onTranscribe) {
           onTranscribe(msg.transcription);
        }

        if (msg.interrupted) {
          audioQueueRef.current = [];
          isPlayingRef.current = false;
        }
        if (msg.audio) {
          if (!isMuted) {
            playAudioChunk(msg.audio);
          }
        }
        if (msg.toolCall) {
          if (msg.toolCall.name === 'setPodcastInstructions') {
             onApplyInstructions(msg.toolCall.args);
          } else if (msg.toolCall.name === 'controlAppUi') {
             onAppControl(msg.toolCall.args);
          } else if (msg.toolCall.name === 'update_script') {
             onAppControl({ scriptText: msg.toolCall.args.content });
          } else if (msg.toolCall.name === 'updateDiscussionContext' && onUpdateContext) {
             onUpdateContext(msg.toolCall.args);
          } else if (msg.toolCall.name === 'transferDiscussionContextToApp' && onTransferContext) {
             onTransferContext(msg.toolCall.args);
          }
        }
      };

      wsRef.current.onclose = () => {
         stopLiveSession();
      };

    } catch (err) {
      console.error(err);
      stopLiveSession();
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    
    try {
      const binaryStr = window.atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
      }
      
      // Convert raw 16-bit PCM little-endian to Float32
      const dataView = new DataView(bytes.buffer);
      const float32Data = new Float32Array(len / 2);
      for (let i = 0; i < len / 2; i++) {
          // Read Int16, scale to [-1, 1]
          float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }
      
      const audioBuffer = outputAudioCtxRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      audioQueueRef.current.push(audioBuffer);
      
      if (!isPlayingRef.current) {
        scheduleNextChunk();
      }
    } catch (err) {
      console.error("Audio playback error", err);
    }
  };

  const scheduleNextChunk = () => {
    if (!outputAudioCtxRef.current) return;
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const ctx = outputAudioCtxRef.current;
    
    // Ensure nextStart isn't in the past
    if (nextStartTimeRef.current < ctx.currentTime) {
       nextStartTimeRef.current = ctx.currentTime;
    }

    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    
    source.onended = () => {
      scheduleNextChunk();
    };
  };

  const stopLiveSession = () => {
    if (wsRef.current) {
       wsRef.current.close();
       wsRef.current = null;
    }
    if (processorRef.current) {
       processorRef.current.disconnect();
       processorRef.current = null;
    }
    if (streamRef.current) {
       streamRef.current.getTracks().forEach(track => track.stop());
       streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
       inputAudioCtxRef.current.close();
       inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
       outputAudioCtxRef.current.close();
       outputAudioCtxRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    const handleTelemetry = (e: CustomEvent) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ telemetry: e.detail }));
      }
    };
    const handleSendText = (e: CustomEvent) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: "USER TEXT MESSAGE: " + e.detail.text }));
      }
    };
    window.addEventListener('app-telemetry', handleTelemetry as EventListener);
    window.addEventListener('app-send-text', handleSendText as EventListener);
    return () => {
      window.removeEventListener('app-telemetry', handleTelemetry as EventListener);
      window.removeEventListener('app-send-text', handleSendText as EventListener);
      stopLiveSession();
    };
  }, []);

  return (
    <>
      {/* Full screen edge glow when Jojo is active */}
      {isActive && (
         <div className="pointer-events-none fixed inset-0 z-40 border-[4px] border-rose-500/30 animate-pulse shadow-[inset_0_0_100px_rgba(244,63,94,0.15)] rounded-2xl m-2 transition-all duration-700" />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
         {onToggleWorkspace && (
            <button 
              onClick={onToggleWorkspace}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white rounded-full font-bold text-xs tracking-wider transition-colors shadow-lg border border-white/5 uppercase"
            >
              Text
            </button>
         )}

         <div className="relative">
           {isActive && (
             <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-xl animate-pulse" />
           )}
           {isActive && (
             <div className="absolute -inset-8 inset-0 m-auto flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border border-rose-500/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute w-32 h-32 rounded-full border border-rose-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
             </div>
           )}
           <button
              onClick={() => {
                 if (isActive) stopLiveSession();
                 else startLiveSession();
              }}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isActive 
                   ? 'bg-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:bg-rose-600' 
                   : isConnecting 
                      ? 'bg-indigo-500 text-white animate-spin'
                      : 'bg-emerald-500 text-white shadow-emerald-500/50 hover:bg-emerald-600'
              }`}
           >
             {isConnecting ? <Settings className="w-6 h-6" /> : isActive ? <MicOff className="w-7 h-7 animate-pulse" /> : <Mic className="w-7 h-7" />}
           </button>
           
           {isActive && (
             <div className="absolute bottom-full mb-6 right-0 w-72 bg-slate-900/90 backdrop-blur-md border border-rose-500/30 rounded-2xl p-5 shadow-2xl animate-slideUp">
               <div className="flex items-center gap-3 mb-3 text-rose-400 font-black text-[10px] uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  Live Assistant Connected
               </div>
               <p className="text-sm text-slate-300 leading-relaxed font-medium">
                 I'm listening and observing the UI. Tell me to adjust settings, toggle modes, or help you edit the script.
               </p>
             </div>
           )}
         </div>
      </div>
    </>
  );
}
