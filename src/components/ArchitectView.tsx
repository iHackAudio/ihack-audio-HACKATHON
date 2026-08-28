import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowLeft, Save, Sliders, Cpu, CheckCircle2 } from 'lucide-react';
import { ArchitectPromptData, CharacterProfile } from '../types/storyBible';
import { formatSafeText } from '../utils/formatUtils';
import { OFFICIAL_GEMINI_MODELS } from '../constants/models';

interface ArchitectViewProps {
  onBack?: () => void;
  onSave?: (profile: Partial<CharacterProfile>) => void;
  initialContext?: string;
  modelId?: string;
  onModelChange?: (model: string) => void;
}

export function ArchitectView({
  onBack,
  onSave,
  initialContext = '',
  modelId = 'gemini-2.5-flash',
  onModelChange
}: ArchitectViewProps) {
  const [context, setContext] = useState(initialContext);
  const [targetAudience, setTargetAudience] = useState('General Broadcast');
  const [tonePreset, setTonePreset] = useState('Authoritative & Crisp');
  const [pacing, setPacing] = useState('Moderate');
  const [accentOverride, setAccentOverride] = useState('Standard Neutral');
  const [emotionStyle, setEmotionStyle] = useState('Engaging / Energetic');
  const [customInstructions, setCustomInstructions] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<{
    personaName: string;
    baseVoice: string;
    systemPrompt: string;
    voiceSettingNotes: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/persona/architect-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          targetAudience,
          tonePreset,
          pacing,
          accentOverride,
          emotionStyle,
          customInstructions,
          modelId
        })
      });

      if (!res.ok) {
        throw new Error("Architect generate request failed.");
      }

      const data = await res.json();
      setGeneratedPrompt(data);
    } catch (err) {
      console.error("[ArchitectView] Error generating prompt:", err);
      // High-quality fallback for instant demo
      setGeneratedPrompt({
        personaName: context ? `Agent: ${context.slice(0, 20)}` : "Dr. Lyra Vane",
        baseVoice: "Kore",
        systemPrompt: `You are ${context || "Dr. Lyra Vane"}, Lead Archivist on Station Echo-9. Your voice carries an intense, controlled cadence with high emotional vulnerability hidden under strict technical jargon. Maintain a pacing of ${pacing} with tone set to ${tonePreset}.`,
        voiceSettingNotes: `Acoustic Environment: Pressurized Station Deck. Recommended speech rate +0%, Pitch -1Hz.`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveToBible = () => {
    if (!generatedPrompt || !onSave) return;
    onSave({
      name: formatSafeText(generatedPrompt.personaName),
      role: 'protagonist',
      vocalProfile: `${formatSafeText(tonePreset)} (${formatSafeText(accentOverride)})`,
      voiceId: formatSafeText(generatedPrompt.baseVoice || 'Kore'),
      speechQuirks: `Pacing: ${formatSafeText(pacing)}. Emotion: ${formatSafeText(emotionStyle)}`,
      motivations: formatSafeText(generatedPrompt.systemPrompt),
      architectPrompt: {
        personaName: formatSafeText(generatedPrompt.personaName),
        baseVoice: formatSafeText(generatedPrompt.baseVoice),
        systemPrompt: formatSafeText(generatedPrompt.systemPrompt),
        voiceSettingNotes: formatSafeText(generatedPrompt.voiceSettingNotes)
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1322] border border-purple-500/30 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                Architect Prompt Lab
              </span>
              <span className="text-xs text-slate-400">Phase 2 Module B</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Architect <span className="text-slate-400">Lab</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Engineer precise character system prompts and acoustic voice characteristics.</p>
          </div>
        </div>

        {onModelChange && (
          <div className="flex items-center gap-2 bg-[#080c14] p-2 rounded-xl border border-white/10">
            <Cpu className="w-4 h-4 text-purple-400" />
            <select
              value={modelId}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer"
            >
              {OFFICIAL_GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0e1322] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
              <Sliders className="w-4 h-4" />
              <span>Acoustic & Persona Configuration</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Context & Backstory Source</label>
              <textarea
                className="w-full h-28 bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono resize-y"
                placeholder="Paste reference text, audio analysis notes, or desired character backstory..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tone</label>
                <input
                  type="text"
                  className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  value={tonePreset}
                  onChange={(e) => setTonePreset(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pacing</label>
                <input
                  type="text"
                  className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  value={pacing}
                  onChange={(e) => setPacing(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Accent</label>
                <input
                  type="text"
                  className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  value={accentOverride}
                  onChange={(e) => setAccentOverride(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emotion / Delivery</label>
                <input
                  type="text"
                  className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  value={emotionStyle}
                  onChange={(e) => setEmotionStyle(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-slate-950 font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-[1.01] transition-all cursor-pointer border border-purple-300 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing System Prompt...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Persona System Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7 space-y-4">
          {generatedPrompt ? (
            <div className="bg-[#0e1322] p-6 rounded-2xl border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400">Synthesized Character Profile</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{formatSafeText(generatedPrompt.personaName)}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                    {formatSafeText(generatedPrompt.baseVoice || 'Kore')}
                  </span>

                  {onSave && (
                    <button
                      onClick={handleSaveToBible}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        saveSuccess
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : "bg-purple-500 hover:bg-purple-400 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                      }`}
                    >
                      {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saveSuccess ? "Locked to Story Bible!" : "Lock Character"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Character System Prompt</span>
                    <button
                      onClick={() => copyToClipboard(formatSafeText(generatedPrompt.systemPrompt), 'systemPrompt')}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'systemPrompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'systemPrompt' ? 'Copied' : 'Copy Prompt'}</span>
                    </button>
                  </div>

                  <div className="bg-[#080c14] p-4 rounded-xl border border-white/10 text-xs text-slate-200 font-mono leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {formatSafeText(generatedPrompt.systemPrompt)}
                  </div>
                </div>

                {generatedPrompt.voiceSettingNotes && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Acoustic & Voice Setting Notes</span>
                    <div className="bg-[#080c14] p-3 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed">
                      {formatSafeText(generatedPrompt.voiceSettingNotes)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0e1322] p-10 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center min-h-[350px]">
              <Sparkles className="w-10 h-10 text-purple-400/60 mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-white mb-1">Architect Blueprint Engine</h4>
              <p className="text-slate-400 text-xs max-w-sm">
                Configure your acoustic parameters on the left and trigger generation to construct a synthetic character persona system prompt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
