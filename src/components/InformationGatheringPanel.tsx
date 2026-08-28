import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Save, Sparkles, BookOpen, Layers, Volume2, UserCheck, RefreshCw, Sliders, Check, ShieldCheck } from 'lucide-react';
import { formatSafeText } from '../utils/formatUtils';

interface QuestionnaireAnswers {
  title?: string;
  genre?: string;
  hook?: string;
  summary?: string;
  speakerMode?: 'single' | 'multi';
  characterCount?: string;
  characterNames?: string;
  speechQuirks?: string;
  voiceId?: string;
  macroPlot?: string;
  climax?: string;
  resolution?: string;
  sceneObjectives?: string;
  location?: string;
  atmosphere?: string;
  targetEmotion?: string;
  tone?: string;
  audioAtmosphere?: string;
  maxWordsPerScene?: number;
  additionalNotes?: string;
}

export default function InformationGatheringPanel({ onBibleCompiled }: { onBibleCompiled?: () => void }) {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    title: '',
    genre: '',
    hook: '',
    summary: '',
    speakerMode: undefined,
    characterCount: '',
    characterNames: '',
    speechQuirks: '',
    voiceId: '',
    macroPlot: '',
    climax: '',
    resolution: '',
    sceneObjectives: '',
    location: '',
    atmosphere: '',
    targetEmotion: '',
    tone: '',
    audioAtmosphere: '',
    maxWordsPerScene: undefined,
    additionalNotes: ''
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationData, setValidationData] = useState<{
    summary: string;
    critiques: string[];
    suggestions: string[];
    logicalFixes: string[];
    refinementQuestions: Array<{ id: string; question: string; options: string[]; allowMultiple?: boolean }>;
  } | null>(null);
  const [showValidationCard, setShowValidationCard] = useState<boolean>(false);
  const [showRefinementMode, setShowRefinementMode] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionnaire();
  }, []);

  const handleValidateCurrentStep = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/validation/phase1-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, answers })
      });
      if (res.ok) {
        const data = await res.json();
        setValidationData(data);
        setShowValidationCard(true);
        setShowRefinementMode(false);
      }
    } catch (e) {
      console.error('Validation request failed:', e);
    } finally {
      setIsValidating(false);
    }
  };

  const handleToggleRefinementOption = (qId: string, option: string, allowMultiple?: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[qId] || [];
      if (allowMultiple) {
        if (current.includes(option)) {
          return { ...prev, [qId]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [qId]: [...current, option] };
        }
      } else {
        return { ...prev, [qId]: [option] };
      }
    });
  };

  const handleApplyRefinements = () => {
    const selectionsSummary = Object.entries(selectedOptions)
      .map(([qId, opts]) => `Refinement [${qId}]: ${opts.join(', ')}`)
      .join('\n');

    setAnswers(prev => ({
      ...prev,
      additionalNotes: prev.additionalNotes
        ? `${prev.additionalNotes}\n${selectionsSummary}`
        : selectionsSummary
    }));

    setShowRefinementMode(false);
    setStatusMsg('Refinements incorporated into story profile!');
    setTimeout(() => setStatusMsg(null), 3000);
    handleValidateCurrentStep();
  };

  const handleApproveStepAndProceed = () => {
    setShowValidationCard(false);
    setValidationData(null);
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      handleCompileBible();
    }
  };

  const fetchQuestionnaire = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/questionnaire');
      if (res.ok) {
        const data = await res.json();
        if (data.answers) {
          setAnswers(prev => ({
            ...prev,
            ...data.answers
          }));
        }
        if (data.step) setStep(data.step);
      }
    } catch (e) {
      console.error('Error fetching questionnaire:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed: false, answers })
      });
      setStatusMsg('Session saved successfully!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) {
      console.error('Error saving session:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompileBible = async () => {
    setIsCompiling(true);
    try {
      const res = await fetch('/api/questionnaire/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        setStatusMsg('Story Bible generated & locked!');
        if (onBibleCompiled) onBibleCompiled();
      }
    } catch (e) {
      console.error('Error compiling Story Bible:', e);
    } finally {
      setIsCompiling(false);
    }
  };

  const updateAnswer = (key: keyof QuestionnaireAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#080c14] text-slate-400 font-mono text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400 mr-2" />
        Loading Phase 1 Questionnaire State...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Tabler Sub-Header Control Bar */}
      <div className="h-10 border-b border-white/10 bg-[#0d1322] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5.5 h-5.5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            <Sliders className="w-3 h-3" />
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">PHASE 1: INTAKE & SPECIFICATION</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold ml-2 border border-amber-500/30">
            Step {step} of 4
          </span>
        </div>

        <div className="flex items-center gap-2">
          {statusMsg && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {statusMsg}
            </span>
          )}

          <button
            onClick={handleSaveProgress}
            disabled={isSaving}
            className="h-7 px-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-[11px] font-semibold text-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Save className="w-3 h-3 text-amber-400" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleCompileBible}
            disabled={isCompiling}
            className="h-7 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] cursor-pointer transition-all"
          >
            {isCompiling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isCompiling ? 'Compiling...' : 'Compile Story Bible'}
          </button>
        </div>
      </div>

      {/* Tabler Stepper Tabs Bar */}
      <div className="bg-[#090d16] border-b border-white/10 px-6 py-2.5 flex items-center justify-around shrink-0">
        {[
          { num: 1, title: 'Premise & Hook', icon: BookOpen, color: 'amber' },
          { num: 2, title: 'Speakers & Voices', icon: Volume2, color: 'purple' },
          { num: 3, title: 'Story Arc & Climax', icon: Layers, color: 'emerald' },
          { num: 4, title: 'Audio & Atmosphere', icon: Sliders, color: 'teal' },
        ].map(s => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          
          let currentStyle = 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40';
          let numStyle = 'border-amber-400 bg-amber-500 text-slate-950';
          if (s.color === 'purple') {
            currentStyle = 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/40';
            numStyle = 'border-purple-400 bg-purple-500 text-white';
          } else if (s.color === 'emerald') {
            currentStyle = 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/40';
            numStyle = 'border-emerald-400 bg-emerald-500 text-slate-950';
          } else if (s.color === 'teal') {
            currentStyle = 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/40';
            numStyle = 'border-teal-400 bg-teal-500 text-slate-950';
          }

          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all cursor-pointer ${
                isCurrent 
                  ? currentStyle 
                  : isDone 
                  ? 'text-emerald-400 font-semibold hover:bg-slate-800/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                isCurrent ? numStyle : isDone ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}>
                {isDone ? <Check className="w-3 h-3" /> : s.num}
              </div>
              <span className="text-xs tracking-tight hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5 custom-scrollbar">
        {step === 1 && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-1 bg-sky-500 w-full" />
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Step 1: Story Premise & Logline</h3>
              </div>
              <span className="text-[10px] text-slate-400">Specify core narrative parameters</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Story Title
                  </label>
                  <input
                    type="text"
                    value={answers.title || ''}
                    onChange={(e) => updateAnswer('title', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. The Whispering Void"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Genre Category
                  </label>
                  <select
                    value={answers.genre || ''}
                    onChange={(e) => updateAnswer('genre', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select category...</option>
                    <option value="Sci-Fi / Dark Fantasy Audiobook">Sci-Fi / Dark Fantasy Audiobook</option>
                    <option value="Cyberpunk Audio Thriller">Cyberpunk Audio Thriller</option>
                    <option value="Psychological Mystery Drama">Psychological Mystery Drama</option>
                    <option value="Epic Fantasy Audio Play">Epic Fantasy Audio Play</option>
                    <option value="Supernatural Horror Audio Drama">Supernatural Horror Audio Drama</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Core Logline / Hook
                </label>
                <textarea
                  rows={2}
                  value={answers.hook || ''}
                  onChange={(e) => updateAnswer('hook', e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. A crew trapped in a silent dimension that feeds on human memory..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Narrative Overview
                </label>
                <textarea
                  rows={4}
                  value={answers.summary || ''}
                  onChange={(e) => updateAnswer('summary', e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. When the station slips between realities, the crew realizes the silence itself is an intelligent organism..."
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-1 bg-sky-500 w-full" />
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Step 2: Voice Roster & Format</h3>
              </div>
              <span className="text-[10px] text-slate-400">Configure neural speakers</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Production Speaker Format
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => updateAnswer('speakerMode', 'multi')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      answers.speakerMode === 'multi'
                        ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                        : 'bg-[#080c14] border-white/10 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" /> Multi-Speaker Audio Drama
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Multiple Edge-TTS voice profiles assigned to distinct characters.</p>
                  </div>

                  <div
                    onClick={() => updateAnswer('speakerMode', 'single')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      answers.speakerMode === 'single'
                        ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                        : 'bg-[#080c14] border-white/10 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Solo Narrator Performance
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Single master voice delivering narration and vocal inflections.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Character Roster & Voice Descriptions
                </label>
                <textarea
                  rows={4}
                  value={answers.characterNames || ''}
                  onChange={(e) => updateAnswer('characterNames', e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. Commander Halloway — gravelly, authoritative, military cadence"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Speech Quirks & Vocal Traits
                  </label>
                  <input
                    type="text"
                    value={answers.speechQuirks || ''}
                    onChange={(e) => updateAnswer('speechQuirks', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Pauses before difficult orders"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Primary Voice Model ID
                  </label>
                  <input
                    type="text"
                    value={answers.voiceId || ''}
                    onChange={(e) => updateAnswer('voiceId', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. en-US-BrianNeural"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-1 bg-sky-500 w-full" />
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Step 3: Plot Arc & Turning Points</h3>
              </div>
              <span className="text-[10px] text-slate-400">Structural narrative beats</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Macro Plot Trajectory
                </label>
                <textarea
                  rows={3}
                  value={answers.macroPlot || ''}
                  onChange={(e) => updateAnswer('macroPlot', e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. Infiltration -> Discovery -> Confrontation -> Escape"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Key Scene Objectives
                </label>
                <textarea
                  rows={2}
                  value={answers.sceneObjectives || ''}
                  onChange={(e) => updateAnswer('sceneObjectives', e.target.value)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. Establish tension, uncover hidden data core, trigger containment alarm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Climactic Peak
                  </label>
                  <textarea
                    rows={2}
                    value={answers.climax || ''}
                    onChange={(e) => updateAnswer('climax', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Direct face-off with the anomaly at the core reactor"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Story Resolution
                  </label>
                  <textarea
                    rows={2}
                    value={answers.resolution || ''}
                    onChange={(e) => updateAnswer('resolution', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Narrow escape with key intel as station collapses"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-1 bg-sky-500 w-full" />
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Step 4: Atmosphere & Production Bounds</h3>
              </div>
              <span className="text-[10px] text-slate-400">Sonic and length constraints</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Emotional Impact
                  </label>
                  <input
                    type="text"
                    value={answers.targetEmotion || ''}
                    onChange={(e) => updateAnswer('targetEmotion', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Claustrophobia, suspense, awe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Narrative Cadence & Tone
                  </label>
                  <input
                    type="text"
                    value={answers.tone || ''}
                    onChange={(e) => updateAnswer('tone', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Tense, rhythmic, immersive"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Primary Location Setting
                  </label>
                  <input
                    type="text"
                    value={answers.location || ''}
                    onChange={(e) => updateAnswer('location', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Sub-level 4 Command Deck"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Sonic Atmosphere Details
                  </label>
                  <input
                    type="text"
                    value={answers.atmosphere || ''}
                    onChange={(e) => updateAnswer('atmosphere', e.target.value)}
                    className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                    placeholder="e.g. Cold metallic echoes, distant alarm pulses"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Word Budget Per Scene
                </label>
                <input
                  type="number"
                  value={answers.maxWordsPerScene || ''}
                  onChange={(e) => updateAnswer('maxWordsPerScene', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full bg-[#080c14] border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="e.g. 750"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabler Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateCurrentStep}
              disabled={isValidating}
              className="px-3 py-1.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isValidating ? 'Analyzing...' : 'AI Validate Step'}
            </button>

            {step < 4 ? (
              <button
                onClick={handleValidateCurrentStep}
                className="px-4 py-1.5 rounded-md bg-sky-500 text-slate-950 font-extrabold hover:bg-sky-400 text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all"
              >
                Validate & Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleCompileBible}
                disabled={isCompiling}
                className="px-4 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer transition-all"
              >
                {isCompiling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {isCompiling ? 'Compiling...' : 'Lock & Compile Story Bible'}
              </button>
            )}
          </div>
        </div>

        {/* Validation Modal */}
        {showValidationCard && validationData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0d1322] border border-white/10 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl overflow-hidden relative">
              <div className="h-1 bg-sky-500 w-full" />
              
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">J.A.R.V.I.S. STEP {step} VALIDATION REPORT</h3>
                </div>
                <button
                  onClick={() => setShowValidationCard(false)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3 rounded bg-slate-900 border border-white/5 space-y-1">
                  <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider block">Overview</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{validationData.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Potential Gaps</span>
                    <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                      {validationData.critiques?.map((c, i) => (
                        <li key={i}>{formatSafeText(c)}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Suggested Fixes</span>
                    <ul className="text-xs text-emerald-200/90 space-y-1 list-disc list-inside">
                      {validationData.suggestions?.map((s, i) => (
                        <li key={i}>{formatSafeText(s)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {!showRefinementMode ? (
                  <div className="p-4 rounded bg-[#080c14] border border-white/10 text-center space-y-3">
                    <p className="text-xs font-bold text-white">Does this analysis align with your vision?</p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={handleApproveStepAndProceed}
                        className="px-4 py-1.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved — Proceed
                      </button>

                      <button
                        onClick={() => setShowRefinementMode(true)}
                        className="px-4 py-1.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        Refine with AI Options
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-[#080c14] border border-white/10 space-y-4">
                    <div className="border-b border-white/10 pb-2">
                      <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">AI Guided Refinements</span>
                    </div>

                    {validationData.refinementQuestions?.map((q) => (
                      <div key={q.id} className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-200">{formatSafeText(q.question)}</p>
                        <div className="space-y-1 pl-1">
                          {q.options?.map((opt, idx) => {
                            const isChecked = (selectedOptions[q.id] || []).includes(opt);
                            return (
                              <label
                                key={idx}
                                onClick={() => handleToggleRefinementOption(q.id, opt, q.allowMultiple)}
                                className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                                    : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <input
                                  type={q.allowMultiple ? "checkbox" : "radio"}
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="mt-0.5 accent-sky-400"
                                />
                                <span>{formatSafeText(opt)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => setShowRefinementMode(false)}
                        className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleApplyRefinements}
                        className="px-4 py-1.5 rounded bg-sky-500 text-slate-950 font-extrabold text-xs hover:bg-sky-400"
                      >
                        Apply & Re-Validate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
