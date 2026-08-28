import { useState, useRef, useEffect, useCallback } from 'react';
import { f32ToPCM16Base64, exportWavBlob } from '../utils/audioCodec';
import { MessageBus } from '../utils/MessageBus';

const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    const playBeep = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, time + 0.2);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    };
    playBeep(ctx.currentTime, 800);
    playBeep(ctx.currentTime + 0.3, 800);
    playBeep(ctx.currentTime + 0.6, 800);
  } catch (e) {
    console.warn("Failed to play alarm", e);
  }
};

export function useVoiceSession() {
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState('gemini-3.1-flash-live-preview');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recordingCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const resumptionHandleRef = useRef<string | null>(null);
  const connectionIntentRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const sessionAudioChunksRef = useRef<Int16Array[]>([]);
  const recognitionRef = useRef<any>(null);
  
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    const existing = localStorage.getItem('jarvis_session_id');
    if (existing) {
      sessionIdRef.current = existing;
    } else {
      const newId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('jarvis_session_id', newId);
      sessionIdRef.current = newId;
    }
  }

  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // When muting, we actually want to physically mute the mic track
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        // Toggle the track's enabled state based on the *new* isMuted value
        // Wait, if it *will* be muted, track.enabled = false
        // The functional state update callback is safer
      });
    }
  }, []);

  // Use a second effect to cleanly sync the track enabled state
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, state]); // also run when state changes in case we just connected

  // Provide a callback to push messages to ChatPanel
  const onMessageReceivedRef = useRef<((msg: any) => void) | null>(null);

  const downloadSessionAudio = useCallback(() => {
    if (sessionAudioChunksRef.current.length === 0) return;
    const blob = exportWavBlob(sessionAudioChunksRef.current, 24000);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_session_${new Date().getTime()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const clearSessionAudio = useCallback(() => {
    sessionAudioChunksRef.current = [];
  }, []);

  const stopAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); source.disconnect(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = audioCtxRef.current?.currentTime || 0;
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!audioCtxRef.current) return;
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const int16Array = new Int16Array(bytes.buffer);
      
      sessionAudioChunksRef.current.push(int16Array);
      
      const buffer = audioCtxRef.current.createBuffer(1, int16Array.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx > -1) activeSourcesRef.current.splice(idx, 1);
      };
      activeSourcesRef.current.push(source);
      
      const currentTime = audioCtxRef.current.currentTime;
      nextStartTimeRef.current = Math.max(currentTime, nextStartTimeRef.current);
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
    } catch (e) {
      console.error("Error playing audio chunk:", e);
    }
  }, []);

  const disconnectVoice = useCallback(() => {
    connectionIntentRef.current = false;
    setState('idle');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (recordingCtxRef.current) {
      recordingCtxRef.current.close();
      recordingCtxRef.current = null;
    }
  }, [stopAudio]);

  const connectVoice = useCallback(async (agentId: string = 'jarvis', voice: string = 'Zephyr', instruction: string = 'You are Jarvis. Be concise and professional.', middlemanModel: string = 'gemini-3.1-flash-lite') => {
    connectionIntentRef.current = true;
    setState('connecting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: 1,
        sampleRate: 16000,
      } });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;

      const recordingCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      recordingCtxRef.current = recordingCtx;

      const source = recordingCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = recordingCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(recordingCtx.destination);

      const sessionInitRes = await fetch('/api/session-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          instruction: instruction
        })
      });
      if (!sessionInitRes.ok) {
        console.warn("Failed to init session context on server");
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = new URL(`${wsProtocol}//${window.location.host}/live`);
      url.searchParams.set("agent", agentId); 
      url.searchParams.set("model", modelName);
      url.searchParams.set("voice", voice);
      url.searchParams.set("middlemanModel", middlemanModel);
      url.searchParams.set("session_id", sessionIdRef.current);
      if (resumptionHandleRef.current) {
        url.searchParams.set("resumption_handle", resumptionHandleRef.current);
      }
      const token = localStorage.getItem('googleToken');
      if (token) {
        url.searchParams.set("googleToken", token);
      }

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      // Modern SpeechRecognition interrupt core targeting specific words
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          
          rec.onresult = (event: any) => {
            let lastTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              lastTranscript += event.results[i][0].transcript;
            }
            const cleanText = lastTranscript.toLowerCase().trim();
            console.log("[AURA Speak Interrupt Sensor]:", cleanText);
            
            const stopKeywords = ["stop", "enough", "okay enough", "halt", "quiet", "jarvis", "jarviss", "jarves", "jarvys", "okay"];
            const shouldInterrupt = stopKeywords.some(keyword => cleanText.includes(keyword));
            
            if (shouldInterrupt && activeSourcesRef.current.length > 0) {
              console.log("[AURA Speak Interrupt triggered for keyword]:", cleanText);
              stopAudio();
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ interruptSignal: true, text: "[USER INTERRUPTED]" }));
              }
            }
          };
          
          rec.onerror = (e: any) => {
            console.warn("[SpeechRecognition] sensor warning:", e);
          };
          
          rec.onend = () => {
            if (connectionIntentRef.current && recognitionRef.current === rec) {
              try { rec.start(); } catch(e) {}
            }
          };
          
          recognitionRef.current = rec;
          rec.start();
        } catch (e) {
          console.warn("Could not bootstrap browser speech sensor:", e);
        }
      }

      let vadTriggeredAt = 0;
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN && connectionIntentRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate RMS for VAD
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          
          // If we detect extremely high speaking volume/clap, interrupt as emergency fallback
          const hasSpeechRec = !!SpeechRecognition;
          const rmsThreshold = hasSpeechRec ? 0.25 : 0.15; // Prevent clanks and soft breathing from stopping Jarvis
          
          if (rms > rmsThreshold && activeSourcesRef.current.length > 0) {
            const now = Date.now();
            if (now - vadTriggeredAt > 1500) { // Limit trigger rate
              vadTriggeredAt = now;
              console.log("[VAD Fallback] Emergency high-amplitude interrupt. RMS:", rms);
              stopAudio(); // Flush audio buffer immediately
              ws.send(JSON.stringify({ interruptSignal: true, text: "[USER INTERRUPTED]" }));
            }
          }

          const base64Audio = f32ToPCM16Base64(inputData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      ws.onopen = () => {
         setState('connected');
         reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        MessageBus.publish('websocket_message', msg);
        
        if (msg.error) {
          console.error("Live session error:", msg.error);
          playAlarm();
          setError(msg.error);
          disconnectVoice();
        }
        if (msg.toolCall) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'toolCall', toolCall: msg.toolCall });
          }
        }
        if (msg.status === "connected") {
          setState('connected');
        }
        if (msg.agentStatus) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'agentStatus', payload: msg.agentStatus });
          }
        }
        if (msg.agentChat) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'agentChat', payload: msg.agentChat });
          }
        }
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          stopAudio();
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'interrupted' });
          }
        }
        if (msg.userText) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'userText', text: msg.userText });
          }
        }
        if (msg.text) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'modelText', text: msg.text });
          }
        }
        if (msg.turnComplete) {
          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current({ type: 'turnComplete' });
          }
        }
        if (msg.resumptionHandle) {
          resumptionHandleRef.current = msg.resumptionHandle;
        }
        if (msg.goAway) {
          console.warn("Received goAway signal (connection dropping soon). Playing alarm and queuing reconnect.");
          playAlarm();
          
          stopAudio();
          disconnectVoice(); // this sets connectionIntentRef.current to false
          
          // Force it back to true because this was an automated reconnection loop
          connectionIntentRef.current = true;
          setState('reconnecting');
          
          const attempt = reconnectAttemptRef.current;
          const backoff = Math.min(1000 * Math.pow(2, attempt), 30000);
          reconnectAttemptRef.current += 1;
          
          setTimeout(() => {
            if (connectionIntentRef.current) {
               connectVoice(agentId, voice, instruction, middlemanModel);
            }
          }, backoff);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
      }

      ws.onclose = (event) => {
        // Detect reason based on websocket close code
        // 1000/1001 often standard disconnect, might be server timeout or intentional
        const isNormal = event.code === 1000 || event.code === 1001;
        
        console.log(`WebSocket closed (code: ${event.code}, reason: ${event.reason || (isNormal ? 'normal/timeout' : 'unknown')})`);
        
        if (connectionIntentRef.current) {
          // Play alarm if it's an unexpected drop
          playAlarm();

          setState('reconnecting');
          
          const attempt = reconnectAttemptRef.current;
          const backoff = Math.min(1000 * Math.pow(2, attempt), 30000);
          reconnectAttemptRef.current += 1;
          
          console.warn(`Unexpected disconnect via ${isNormal ? 'timeout/normal closure' : 'error'}. Reconnecting in ${backoff}ms (Attempt ${attempt + 1})...`);
          
          setTimeout(() => {
            if (connectionIntentRef.current) {
               connectVoice(agentId, voice, instruction, middlemanModel);
            }
          }, backoff);
        } else {
          console.log("WebSocket manually deactivated. No auto-reconnect.");
          disconnectVoice();
        }
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start audio');
      disconnectVoice();
    }
  }, [stopAudio, disconnectVoice, playAudioChunk, modelName, state]);

  const sendToolResponse = useCallback((response: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ toolResponse: response }));
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    }
  }, []);

  return {
    state,
    error,
    modelName,
    isMuted,
    sessionId: sessionIdRef.current,
    connectVoice,
    disconnectVoice,
    toggleMute,
    onMessageReceivedRef,
    sendToolResponse,
    sendTextMessage,
    downloadSessionAudio,
    clearSessionAudio
  };
}
