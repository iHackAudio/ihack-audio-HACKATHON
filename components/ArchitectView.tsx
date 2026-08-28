import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChatMessage, PersonaResult, ViewState, Persona } from '../types';
import { analyzeCharacterConcept, sendRefinementMessage, generateFinalPersona } from '../services/geminiService';
import { Button } from './Button';
import { Send, Sparkles, User, AudioLines, Save, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { AVAILABLE_VOICES, AVAILABLE_MODELS } from '../constants';

const ModelSelector = ({ value, onChange, label, icon: Icon }: { value: string, onChange: (v: string) => void, label: string, icon?: any }) => (
  <div className="space-y-2 mb-6">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="grid grid-cols-2 gap-2">
      {AVAILABLE_MODELS.map(m => {
        const id = typeof m === 'string' ? m : (m as any).id || (m as any).name;
        const name = typeof m === 'string' ? m : (m as any).name || (m as any).id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold text-left transition-all border ${
              value === id 
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' 
                : 'bg-slate-950/50 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            <div className="truncate">{name}</div>
          </button>
        );
      })}
    </div>
  </div>
);

interface ArchitectViewProps {
  onBack: () => void;
  onSave: (persona: Persona) => void;
  initialContext?: string;
  modelId: string;
  onModelChange: (m: string) => void;
}

export function ArchitectView({ onBack, onSave, initialContext, modelId, onModelChange }: ArchitectViewProps) {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [personaResult, setPersonaResult] = useState<PersonaResult | null>(null);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialContext && !initialized.current && state === AppState.IDLE) {
      initialized.current = true;
      handleSend(`I want to build a persona based on this analysis: ${initialContext}\n\nPlease analyze this and help me refine it into a perfect TTS instruction.`);
    }
  }, [initialContext]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, state]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    setInputText('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (state === AppState.IDLE) {
        setState(AppState.ANALYZING);
        setMessages(prev => [...prev, { id: 'thinking', role: 'model', text: 'Analyzing concept...', isThinking: true }]);
        
        const response = await analyzeCharacterConcept(message, modelId);
        
        setMessages(prev => prev.filter(m => !m.isThinking));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response }]);
        setState(AppState.REFINING);

      } else if (state === AppState.REFINING) {
        if (message.toLowerCase().includes('generate') || message.toLowerCase().includes('create') || message.toLowerCase().includes('ready')) {
          handleGeneratePersona();
          return;
        }

        setMessages(prev => [...prev, { id: 'thinking', role: 'model', text: 'Pondering...', isThinking: true }]);
        const response = await sendRefinementMessage([...messages, userMsg], modelId);
        
        setMessages(prev => prev.filter(m => !m.isThinking));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => !m.isThinking));
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "Error communicating with AI. Please try again." }]);
      if (state === AppState.ANALYZING) setState(AppState.IDLE);
    }
  };

  const handleGeneratePersona = async () => {
    setState(AppState.GENERATING);
    try {
      const result = await generateFinalPersona(messages, modelId);
      setPersonaResult(result);
      setState(AppState.COMPLETE);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "Failed to generate persona. Let's keep refining." }]);
      setState(AppState.REFINING);
    }
  };

  const handleSaveToVault = () => {
    if (!personaResult) return;
    const baseVoice = AVAILABLE_VOICES[Math.floor(Math.random() * AVAILABLE_VOICES.length)]; // Pick a random base voice or allow selection later
    
    const newPersona: Persona = {
      id: crypto.randomUUID(),
      name: personaResult.name,
      category: 'Architect Crafted',
      createdAt: Date.now(),
      baseVoice: baseVoice,
      analysis: {
        tone: personaResult.description,
        pace: "Defined in instructions",
        styleDescription: personaResult.systemInstruction
      }
    };
    onSave(newPersona);
    onBack();
  };

  const resetForm = () => {
    setState(AppState.IDLE);
    setMessages([]);
    setPersonaResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fadeIn min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft />} className="bg-slate-900 border border-white/5 rounded-2xl h-14 w-14 p-0 text-slate-400 hover:text-white hover:border-white/20"> </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">Prompt Design Engine</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-none glow-text">Architect <span className="text-slate-600">Lab</span></h2>
          </div>
        </div>
        {(state === AppState.REFINING || state === AppState.COMPLETE) && (
          <Button variant="ghost" onClick={resetForm} icon={<RefreshCw className="w-4 h-4" />}>Restart</Button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {state === AppState.IDLE && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-3xl font-black text-white">Describe Your Voice Concept</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              I am your expert Audio Director. Describe the persona you want to build (e.g., "A nervous robot", "A sarcastic detective from the 90s"), and I'll help you craft the perfect system instruction for the TTS engine.
            </p>

            <div className="w-full max-w-sm">
              <ModelSelector 
                label="Brain Module" 
                value={modelId} 
                onChange={onModelChange} 
                icon={Sparkles}
              />
            </div>

            <div className="w-full relative group">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                placeholder="e.g. A weary wizard who speaks slowly..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-6 pl-8 pr-16 text-lg text-white font-medium placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-xl"
              />
              <button 
                onClick={() => handleSend(inputText)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(state === AppState.ANALYZING || state === AppState.REFINING || state === AppState.GENERATING) && (
          <div className="flex-1 flex flex-col glow-box rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-slate-900/80 border-b border-white/5 p-4 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-white">Audio Director</h4>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest">Iterative Refinement</p>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-5 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm border border-indigo-500' 
                      : msg.role === 'system'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : msg.isThinking
                          ? 'bg-slate-800 text-slate-400 border border-white/5 animate-pulse'
                          : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.role === 'model' && !msg.isThinking && <MessageSquare className="w-4 h-4 mb-2 opacity-50" />}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {state === AppState.GENERATING ? (
              <div className="p-6 bg-slate-900/50 border-t border-white/5 text-center flex flex-col items-center justify-center space-y-4">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                <p className="text-sm font-black text-indigo-300 uppercase tracking-widest">Synthesizing Golden Prompt...</p>
              </div>
            ) : (
              <div className="p-4 bg-slate-900 border-t border-white/5">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                    placeholder="Reply to the director... (or say 'Generate' to finish)"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 pl-6 pr-32 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <div className="absolute right-2 flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={handleGeneratePersona}
                      className="h-10 text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                    >
                      Generate
                    </Button>
                    <button 
                      onClick={() => handleSend(inputText)}
                      className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center text-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state === AppState.COMPLETE && personaResult && (
          <div className="animate-fadeIn space-y-8">
            <div className="glow-box p-8 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
              <div className="flex items-start justify-between mb-8">
                 <div>
                    <h3 className="text-3xl font-black text-white mb-2 glow-text">{personaResult.name}</h3>
                    <p className="text-slate-400">{personaResult.description}</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <AudioLines className="w-6 h-6" />
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Golden System Instruction</h4>
                  <div className="bg-slate-950 p-6 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-inner hover:border-emerald-500/30 transition-colors">
                    {personaResult.systemInstruction}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Sample Line</h4>
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 text-slate-300 italic glow-text">
                    "{personaResult.sampleText}"
                  </div>
                </div>
              </div>
            </div>

            <Button 
               onClick={handleSaveToVault}
               className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm tracking-widest uppercase shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
               icon={<Save className="w-5 h-5" />}
            >
               Save to Persona Vault
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
