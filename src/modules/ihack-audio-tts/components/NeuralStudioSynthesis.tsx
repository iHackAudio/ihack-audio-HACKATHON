import React, { useState } from 'react';
import { 
  Sparkles, Headphones, RadioReceiver, ArrowLeft, Wand2, 
  Trash2, Plus, Check, X, PanelLeftOpen, PanelLeftClose, 
  FileCode2, AudioLines, Download, Loader2, Volume2, Play, 
  Pause, RotateCcw, Sliders
} from 'lucide-react';
import { Button } from './Button';
import { ResizableTextarea } from './ResizableTextarea';
import { 
  PodcastMode, 
  TtsModel, 
  ProcessingStatus, 
  PresetTemplate, 
  AVAILABLE_VOICES, 
  PRESET_TEMPLATES 
} from '../types/ihackAudioTypes';
import { 
  synthesizeSpeech, 
  synthesizeMultiSpeaker, 
  chunkTextForTTS, 
  concatAudioBuffers 
} from '../services/geminiTtsService';
import { audioBufferToWav } from '../services/audioUtils';

interface NeuralStudioSynthesisProps {
  onBackToHub?: () => void;
  isStudio?: boolean;
}

export const NeuralStudioSynthesis: React.FC<NeuralStudioSynthesisProps> = ({ 
  onBackToHub,
  isStudio = true
}) => {
  const [podcastMode, setPodcastMode] = useState<PodcastMode>('SINGLE');
  const [ttsModel, setTtsModel] = useState<TtsModel>('FLASH');
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [duoEchoVoice, setDuoEchoVoice] = useState<string>('Leda');
  const [duoNoiseVoice, setDuoNoiseVoice] = useState<string>('Algenib');
  
  const [directorNotes, setDirectorNotes] = useState<string>(
    'Style:\n* Intimate, dramatic, breathy pauses.\n* Measured pacing at 145 WPM.\n\nAccent:\n* Neutral North American.'
  );
  const [directorNotesEcho, setDirectorNotesEcho] = useState<string>(
    'Style:\n* Fast, playful, witty, slight vocal fry on cynical punchlines.\nPace:\n* Kinetic and rapid banter.'
  );
  const [directorNotesNoise, setDirectorNotesNoise] = useState<string>(
    'Style:\n* Deep, authoritative, warm and clinical.\nPace:\n* Thoughtful, measured, deliberate emphasis.'
  );
  const [podcastContext, setPodcastContext] = useState<string>(
    'High-tech studio discussing next-generation neural audio synthesis.'
  );

  const [scriptText, setScriptText] = useState<string>(
    'Welcome to the iHack Audio command center. In today’s session, we explore the boundary between synthetic acoustics and organic human expression.'
  );

  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayerDismissed, setIsPlayerDismissed] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Template Management
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [isAddingTemplate, setIsAddingTemplate] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [customTemplates, setCustomTemplates] = useState<PresetTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ihack_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTpl: PresetTemplate = {
      name: newTemplateName.trim(),
      mode: podcastMode,
      voice: selectedVoice,
      duoEchoVoice,
      duoNoiseVoice,
      directorNotes,
      directorNotesEcho,
      directorNotesNoise,
      context: podcastContext
    };
    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    localStorage.setItem('ihack_custom_templates', JSON.stringify(updated));
    setSelectedTemplateKey(newTpl.name);
    setIsAddingTemplate(false);
    setNewTemplateName('');
    showToast(`Template "${newTpl.name}" saved.`);
  };

  const handleDeleteTemplate = (tplName: string) => {
    const updated = customTemplates.filter(t => t.name !== tplName);
    setCustomTemplates(updated);
    localStorage.setItem('ihack_custom_templates', JSON.stringify(updated));
    setSelectedTemplateKey('');
    showToast(`Template "${tplName}" deleted.`);
  };

  const handleSynthesize = async () => {
    if (!scriptText.trim()) {
      showToast('Please enter dialogue or script text to synthesize.');
      return;
    }

    setStatus(ProcessingStatus.SYNTHESIZING);
    setIsPlayerDismissed(false);

    try {
      const modelId = ttsModel === 'PRO' 
        ? 'gemini-2.5-pro' 
        : ttsModel === 'FLASH' 
          ? 'gemini-2.5-flash' 
          : 'gemini-3.1-flash-lite';

      let renderedBuffer: AudioBuffer;

      if (podcastMode === 'SINGLE') {
        const chunks = chunkTextForTTS(scriptText, 900);
        const buffers: AudioBuffer[] = [];
        for (const chunk of chunks) {
          const buf = await synthesizeSpeech(
            chunk,
            selectedVoice,
            directorNotes,
            'High-Fidelity Studio',
            podcastContext,
            modelId
          );
          buffers.push(buf);
        }
        renderedBuffer = concatAudioBuffers(buffers);
      } else {
        const chunks = chunkTextForTTS(scriptText, 900);
        const buffers: AudioBuffer[] = [];
        for (const chunk of chunks) {
          const buf = await synthesizeMultiSpeaker(
            chunk,
            duoEchoVoice,
            duoNoiseVoice,
            directorNotesEcho,
            directorNotesNoise,
            'High-Fidelity Studio',
            podcastContext,
            modelId
          );
          buffers.push(buf);
        }
        renderedBuffer = concatAudioBuffers(buffers);
      }

      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      setStatus(ProcessingStatus.COMPLETE);
      showToast('Synthesis complete! Ready for playback and mastering.');
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setStatus(ProcessingStatus.ERROR);
      showToast(`Synthesis error: ${err.message || 'Check API key or quota'}`);
    }
  };

  const color = isStudio ? "pink" : "emerald";
  const textAccentClass = isStudio ? "text-pink-500/80" : "text-emerald-500/80";
  const textAccentLightClass = isStudio ? "text-pink-400" : "text-emerald-400";
  const bgAccentClass = isStudio ? "bg-pink-500" : "bg-emerald-500";
  const selectBorderAccentClass = isStudio ? "focus:border-pink-500" : "focus:border-emerald-500";
  const shadowAccentClass = isStudio ? "shadow-pink-500/30" : "shadow-emerald-500/30";

  return (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-white/20 text-white px-4 py-2 rounded-xl text-xs shadow-2xl animate-slideDown flex items-center gap-2 font-mono">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
        {onBackToHub && (
          <Button onClick={onBackToHub} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0" />
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 font-mono">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm font-bold">3</span>
            Neural Studio Synthesis
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Multi-Speaker Voice Casting & Director's Notes Tuning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {!isSidebarCollapsed && (
          <div className="lg:col-span-4 flex flex-col gap-6 w-full animate-fadeIn group/sidebar">
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar shadow-2xl">
              
              {/* Production Mode Toggle */}
              <div className="flex flex-col gap-2">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentClass} mb-1 block`}>Production Mode</label>
                <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 flex items-center">
                  <button 
                    onClick={() => setPodcastMode('SINGLE')} 
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'SINGLE' ? `${bgAccentClass} text-slate-950 shadow-lg ${shadowAccentClass}` : 'text-slate-500 hover:text-white'}`}
                  >
                    Solo (Mono)
                  </button>
                  <button 
                    onClick={() => setPodcastMode('MULTI')} 
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'MULTI' ? `${bgAccentClass} text-slate-950 shadow-lg ${shadowAccentClass}` : 'text-slate-500 hover:text-white'}`}
                  >
                    Duo (Echo & Noise)
                  </button>
                </div>
              </div>

              {/* Presets & Templates */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 block">Quick Templates</label>
                  <button
                    onClick={() => setIsAddingTemplate(!isAddingTemplate)}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Save Custom
                  </button>
                </div>

                {isAddingTemplate && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 flex flex-col gap-2 mb-2 animate-fadeIn">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">Save current notes & context</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Template name..."
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate(); }}
                      />
                      <button
                        onClick={handleSaveTemplate}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => { setIsAddingTemplate(false); setNewTemplateName(''); }}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-700 hover:text-white transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <select
                      value={selectedTemplateKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTemplateKey(val);
                        if (!val) return;
                        const found = PRESET_TEMPLATES.find(t => t.name === val) || customTemplates.find(t => t.name === val);
                        if (found) {
                          if (found.mode) setPodcastMode(found.mode);
                          if (found.directorNotes) setDirectorNotes(found.directorNotes);
                          if (found.directorNotesEcho) setDirectorNotesEcho(found.directorNotesEcho);
                          if (found.directorNotesNoise) setDirectorNotesNoise(found.directorNotesNoise);
                          if (found.duoEchoVoice) setDuoEchoVoice(found.duoEchoVoice);
                          if (found.duoNoiseVoice) setDuoNoiseVoice(found.duoNoiseVoice);
                          if (found.voice) setSelectedVoice(found.voice);
                          if (found.context) setPodcastContext(found.context);
                          showToast(`Applied "${found.name}" template.`);
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs text-slate-200 focus:border-amber-500 outline-none appearance-none cursor-pointer font-mono"
                    >
                      <option value="">Select a template preset...</option>
                      <optgroup label="Built-in Presets">
                        {PRESET_TEMPLATES.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </optgroup>
                      {customTemplates.length > 0 && (
                        <optgroup label="Custom User Presets">
                          {customTemplates.map(t => (
                            <option key={t.name} value={t.name}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  {customTemplates.some(t => t.name === selectedTemplateKey) && (
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplateKey)}
                      className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shrink-0"
                      title="Delete this template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* TTS Engine Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentClass}`}>TTS Engine</label>
                  <span className="text-[9px] font-mono text-indigo-400 font-bold">
                    {ttsModel === 'PRO' ? 'gemini-2.5-pro' : ttsModel === 'FLASH' ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite'}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1">
                  <button onClick={() => setTtsModel('LITE')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'LITE' ? `${bgAccentClass} text-slate-950` : 'text-slate-500 hover:text-slate-300'}`}>3.1 Flash</button>
                  <button onClick={() => setTtsModel('FLASH')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'FLASH' ? `${bgAccentClass} text-slate-950` : 'text-slate-500 hover:text-slate-300'}`}>2.5 Flash</button>
                  <button onClick={() => setTtsModel('PRO')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'PRO' ? `${bgAccentClass} text-slate-950` : 'text-slate-500 hover:text-slate-300'}`}>2.5 Pro TTS</button>
                </div>
              </div>

              {/* Voice Casting & Director Notes */}
              {podcastMode === 'SINGLE' ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentLightClass} mb-2 block`}>Neural Voice Preset</label>
                    <select 
                      value={selectedVoice} 
                      onChange={e => setSelectedVoice(e.target.value)} 
                      className={`w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs text-slate-200 ${selectBorderAccentClass} outline-none appearance-none cursor-pointer font-mono`}
                    >
                      {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <ResizableTextarea 
                    label="Director's Notes" 
                    color={color as any} 
                    icon={<Wand2 className="w-3.5 h-3.5 text-emerald-400" />} 
                    value={directorNotes} 
                    onChange={setDirectorNotes} 
                    minHeight="200px" 
                    placeholder="Audio Profile, Pace, Scene, Emotional Accent..." 
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-1.5 block flex items-center gap-1.5">
                        <Headphones className="w-3 h-3"/> Echo Voice
                      </label>
                      <select 
                        value={duoEchoVoice} 
                        onChange={e => setDuoEchoVoice(e.target.value)} 
                        className="w-full bg-slate-950 border border-sky-500/20 rounded-xl p-2.5 text-xs text-sky-100 focus:border-sky-500 outline-none font-mono"
                      >
                        {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1.5 block flex items-center gap-1.5">
                        <RadioReceiver className="w-3 h-3"/> Noise Voice
                      </label>
                      <select 
                        value={duoNoiseVoice} 
                        onChange={e => setDuoNoiseVoice(e.target.value)} 
                        className="w-full bg-slate-950 border border-rose-500/20 rounded-xl p-2.5 text-xs text-rose-100 focus:border-rose-500 outline-none font-mono"
                      >
                        {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <ResizableTextarea 
                    label="Echo Notes" 
                    color={color as any} 
                    icon={<Wand2 className="w-3.5 h-3.5 text-sky-400" />} 
                    value={directorNotesEcho} 
                    onChange={setDirectorNotesEcho} 
                    minHeight="140px" 
                    placeholder="Style and pacing for Echo..." 
                  />
                  <ResizableTextarea 
                    label="Noise Notes" 
                    color={color as any} 
                    icon={<Wand2 className="w-3.5 h-3.5 text-rose-400" />} 
                    value={directorNotesNoise} 
                    onChange={setDirectorNotesNoise} 
                    minHeight="140px" 
                    placeholder="Style and pacing for Noise..." 
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor & Player Column */}
        <div className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6 relative`}>
          <div className="glass-panel rounded-[2rem] bg-slate-900/40 border border-white/10 flex flex-col overflow-hidden relative shadow-2xl min-h-[680px]">

            {/* Editor Toolbar */}
            <div className="border-b border-white/10 bg-slate-950/70 flex flex-wrap items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-3">
                <FileCode2 className="w-5 h-5 text-emerald-400" />
                <span className="font-mono text-sm tracking-wide text-slate-300 font-bold uppercase">Manual Synthesis Editor</span>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-xl border border-white/10 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 text-[10px] font-mono cursor-pointer transition-all"
                  title={isSidebarCollapsed ? "Show Director Panel" : "Hide Director Panel"}
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
                  <span>{isSidebarCollapsed ? "Open Controls" : "Focus Editor"}</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleSynthesize} 
                  disabled={!scriptText.trim() || status === ProcessingStatus.SYNTHESIZING} 
                  isLoading={status === ProcessingStatus.SYNTHESIZING} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 px-5 h-10 rounded-xl text-xs font-black uppercase flex items-center gap-1.5" 
                  size="sm" 
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Synthesize Audio
                </Button>
                {audioUrl && isPlayerDismissed && (
                  <Button 
                    onClick={() => setIsPlayerDismissed(false)} 
                    className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-xl h-10 px-3 text-xs font-black uppercase" 
                    size="sm" 
                    icon={<Headphones className="w-3.5 h-3.5" />}
                  >
                    Player
                  </Button>
                )}
                <Button 
                  onClick={() => setScriptText('')} 
                  className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-xl h-10 px-3 text-xs font-black uppercase border border-white/5" 
                  size="sm" 
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Textarea Workspace */}
            <div className="flex-1 p-6 flex flex-col bg-[#020617]/60 relative">
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Enter raw dialogue text to synthesize directly, or write a transcript with speaker lines (Echo: ... Noise: ...)..."
                className="flex-1 w-full bg-transparent text-slate-200 outline-none font-mono text-sm leading-7 custom-scrollbar min-h-[380px] resize-none"
              />
            </div>
            
            {/* Token Counter Footer */}
            <div className="h-12 border-t border-white/10 bg-slate-950/60 flex items-center justify-between px-6">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-900/80 border border-white/5 px-3 py-1 rounded-md">
                Estimated Tokens: ~{Math.round(scriptText.length / 4)}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Characters: {scriptText.length}
              </span>
            </div>

          </div>

          {/* Mastered Artifact Audio Player */}
          {(audioUrl || status === ProcessingStatus.SYNTHESIZING) && !isPlayerDismissed && (
            <div className="glass-panel rounded-[2rem] bg-slate-900/60 border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-fadeIn shadow-2xl">
              <button 
                onClick={() => setIsPlayerDismissed(true)} 
                className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-slate-950/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-all cursor-pointer"
                title="Hide Audio Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col gap-1 z-10 text-left">
                <h3 className="font-black text-base text-white tracking-wide flex items-center gap-2 font-mono">
                  <AudioLines className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Synthesized Master Artifact
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  48kHz Studio Broadcast Buffer • Zero Clipping
                </p>
              </div>

              <div className="w-full md:w-[500px] bg-slate-950/80 border border-white/10 rounded-2xl flex items-center p-3 gap-4 shadow-inner z-10">
                {audioUrl ? (
                  <div className="w-full flex items-center gap-4 animate-fadeIn">
                    <audio controls src={audioUrl} className="w-full h-10 outline-none rounded-xl" autoPlay />
                    <Button 
                      icon={<Download className="w-4 h-4" />} 
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 rounded-xl shadow-lg h-10 shrink-0 font-mono text-xs"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = audioUrl;
                        a.download = `ihack_synthesis_${Date.now()}.wav`;
                        a.click();
                      }}
                    >
                      Save WAV
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-400 font-mono text-xs tracking-widest uppercase animate-pulse mx-auto py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Neural Audio Generating...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
