import React, { useState, useEffect } from 'react';
import { StoryBible, BibleScene } from '../types/storyBible';
import { 
  Trophy, Sparkles, CheckCircle2, RefreshCw, Flame, Layers, 
  ArrowRight, Save, ChevronDown, ChevronUp, Sliders, Copy, Check,
  BookOpen, Zap, FileText, Split, LayoutGrid, Plus, PanelLeft,
  PanelLeftClose, PanelLeftOpen, Shield, Eye
} from 'lucide-react';

export default function SceneTournamentPanel({ onSceneApproved }: { onSceneApproved?: () => void }) {
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);
  const [sceneTitle, setSceneTitle] = useState<string>('');
  const [sceneLocation, setSceneLocation] = useState<string>('');
  const [characters, setCharacters] = useState<string>('');
  const [characterDetails, setCharacterDetails] = useState<string>('');
  const [sceneBrief, setSceneBrief] = useState<string>('');
  const [acousticDetails, setAcousticDetails] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [writerADraft, setWriterADraft] = useState<string>('');
  const [writerBDraft, setWriterBDraft] = useState<string>('');
  const [writerCDraft, setWriterCDraft] = useState<string>('');
  const [arenaMode, setArenaMode] = useState<'split' | 'master' | 'trio'>('split');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvedSuccess, setApprovedSuccess] = useState<boolean>(false);
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);

  const [isValidatingBrief, setIsValidatingBrief] = useState<boolean>(false);
  const [showBriefValidationModal, setShowBriefValidationModal] = useState<boolean>(false);
  const [briefValidation, setBriefValidation] = useState<{
    overallAssessment: string;
    characterStakesCritique: string;
    sensoryAcousticEnhancements: string[];
    suggestedDetailedBrief: string;
    suggestedCharacterNotes: string;
    suggestedAcousticNotes: string;
  } | null>(null);

  const [activeSetupTab, setActiveSetupTab] = useState<'brief' | 'cpsd' | 'characters' | 'acoustic'>('brief');
  const [cpsdDoc, setCpsdDoc] = useState<string>('');
  const [isGeneratingCpsd, setIsGeneratingCpsd] = useState<boolean>(false);

  useEffect(() => {
    fetchBible();
  }, []);

  const fetchBible = async () => {
    try {
      const res = await fetch('/api/story-bible');
      if (res.ok) {
        const data: StoryBible = await res.json();
        setBible(data);
        if (data.scenes && data.scenes.length > 0) {
          const s = data.scenes[0];
          setSelectedSceneNumber(s.sceneNumber || 1);
          setSceneTitle(s.title || `Scene 1`);
          setSceneLocation(s.location || data.locations?.[0]?.name || '');
          setCharacters(Array.isArray(s.charactersInScene) ? s.charactersInScene.join(', ') : (s.charactersInScene || ''));
          setSceneBrief(s.summary || data.concept.summary || '');
          if (s.cpsdDocument) setCpsdDoc(s.cpsdDocument);
          if (s.rawProse) setWriterCDraft(s.rawProse);
          if (s.proseVersions) {
            if (s.proseVersions.writerA) setWriterADraft(s.proseVersions.writerA);
            if (s.proseVersions.writerB) setWriterBDraft(s.proseVersions.writerB);
          }
        } else {
          setSceneTitle(data.concept.title ? `${data.concept.title} - Opening Scene` : 'Opening Scene');
          setSceneLocation(data.locations?.[0]?.name || 'Primary Location');
          setCharacters(data.characterProfiles?.map(c => c.name).join(', ') || 'Narrator');
          setSceneBrief(data.concept.summary || data.concept.hook || 'Opening scene establishing central conflict.');
        }

        if (data.characterProfiles && data.characterProfiles.length > 0) {
          const charNotes = data.characterProfiles.map(c => `- ${c.name} (${c.role}): ${c.vocalProfile || 'Standard'}. ${c.speechQuirks || ''}`).join('\n');
          setCharacterDetails(charNotes);
        }
        if (data.locations && data.locations.length > 0) {
          const locNotes = data.locations.map(l => `- ${l.name}: ${l.acoustics || 'Standard'}. ${l.description || ''}`).join('\n');
          setAcousticDetails(locNotes);
        }
      }
    } catch (e) {
      console.error('Failed to load bible:', e);
    }
  };

  const handleSelectScene = (sceneNum: number) => {
    setSelectedSceneNumber(sceneNum);
    if (bible && bible.scenes) {
      const s = bible.scenes.find(sc => sc.sceneNumber === sceneNum) || bible.scenes[sceneNum - 1];
      if (s) {
        setSceneTitle(s.title || `Scene ${sceneNum}`);
        setSceneLocation(s.location || bible.locations?.[0]?.name || '');
        setCharacters(Array.isArray(s.charactersInScene) ? s.charactersInScene.join(', ') : (s.charactersInScene || ''));
        setSceneBrief(s.summary || '');
        setCpsdDoc(s.cpsdDocument || '');
        if (s.rawProse) setWriterCDraft(s.rawProse);
        if (s.proseVersions) {
          setWriterADraft(s.proseVersions.writerA || '');
          setWriterBDraft(s.proseVersions.writerB || '');
        } else {
          setWriterADraft('');
          setWriterBDraft('');
        }
      }
    }
  };

  const handleGenerateCpsd = async () => {
    setIsGeneratingCpsd(true);
    try {
      const res = await fetch('/api/pipeline/phase4-generate-cpsd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedScene: {
            title: sceneTitle,
            summary: sceneBrief,
            location: sceneLocation,
            charactersInScene: characters.split(',').map(c => c.trim()),
            sceneNumber: selectedSceneNumber
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cpsdDocument) setCpsdDoc(data.cpsdDocument);
        if (data.cleanNarrativeProse && !writerCDraft) setWriterCDraft(data.cleanNarrativeProse);
      }
    } catch (e) {
      console.error("Failed to generate CPSD:", e);
    } finally {
      setIsGeneratingCpsd(false);
    }
  };

  const handleAddScene = () => {
    const nextNum = (bible?.scenes?.length || 0) + 1;
    setSelectedSceneNumber(nextNum);
    setSceneTitle(`Scene ${nextNum}`);
    setSceneLocation(bible?.locations?.[0]?.name || '');
    setCharacters(bible?.characterProfiles?.map(c => c.name).join(', ') || '');
    setSceneBrief('');
    setWriterADraft('');
    setWriterBDraft('');
    setWriterCDraft('');
  };

  const handleValidateSceneBrief = async () => {
    setIsValidatingBrief(true);
    try {
      const res = await fetch('/api/validation/scene-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle,
          location: sceneLocation,
          characters: characters.split(',').map(c => c.trim()),
          brief: `${sceneBrief}\n\nCHARACTER PROFILES:\n${characterDetails}\n\nACOUSTIC NOTES:\n${acousticDetails}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBriefValidation(data);
        setShowBriefValidationModal(true);
      }
    } catch (e) {
      console.error('Failed to validate scene brief:', e);
    } finally {
      setIsValidatingBrief(false);
    }
  };

  const handleApplySuggestedBriefFixes = () => {
    if (!briefValidation) return;
    if (briefValidation.suggestedDetailedBrief) setSceneBrief(briefValidation.suggestedDetailedBrief);
    if (briefValidation.suggestedCharacterNotes) setCharacterDetails(briefValidation.suggestedCharacterNotes);
    if (briefValidation.suggestedAcousticNotes) setAcousticDetails(briefValidation.suggestedAcousticNotes);
    setShowBriefValidationModal(false);
  };

  const handleRunTournament = async () => {
    setIsGenerating(true);
    setApprovedSuccess(false);
    try {
      const res = await fetch('/api/tournament/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle,
          location: sceneLocation,
          characters: characters.split(',').map(c => c.trim()),
          brief: sceneBrief,
          cpsdDocument: cpsdDoc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWriterADraft(data.writerA);
        setWriterBDraft(data.writerB);
        setWriterCDraft(data.writerC);
        setArenaMode('split');
      }
    } catch (e) {
      console.error('Tournament execution failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveWriterC = async () => {
    if (!bible || !writerCDraft) return;
    setIsApproving(true);

    const existingSceneIndex = bible.scenes?.findIndex(s => s.sceneNumber === selectedSceneNumber) ?? -1;
    const existingScene = existingSceneIndex >= 0 ? bible.scenes![existingSceneIndex] : {};
    
    const updatedScene: BibleScene = {
      ...existingScene,
      id: `scene-${selectedSceneNumber}`,
      sceneNumber: selectedSceneNumber,
      title: sceneTitle,
      location: sceneLocation,
      charactersInScene: characters.split(',').map(c => c.trim()),
      rawProse: writerCDraft,
      cpsdDocument: cpsdDoc,
      proseVersions: {
        writerA: writerADraft || '',
        writerB: writerBDraft || '',
        writerC: writerCDraft || ''
      },
      summary: sceneBrief,
      status: 'approved',
      updatedAt: Date.now()
    };

    let updatedScenes = bible.scenes ? [...bible.scenes] : [];
    if (existingSceneIndex >= 0) {
      updatedScenes[existingSceneIndex] = updatedScene;
    } else {
      updatedScenes.push(updatedScene);
    }

    const updatedBible: StoryBible = {
      ...bible,
      scenes: updatedScenes,
      version: bible.version + 1,
      updatedAt: Date.now()
    };

    try {
      const res = await fetch('/api/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible)
      });

      if (res.ok) {
        const result = await res.json();
        setBible(result.bible);
        setApprovedSuccess(true);
        if (onSceneApproved) onSceneApproved();
        setTimeout(() => setApprovedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to approve scene:', e);
    } finally {
      setIsApproving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(id);
    setTimeout(() => setCopiedDraft(null), 2000);
  };

  const renderScreenplayText = (prose: string) => {
    if (!prose) return null;
    const lines = prose.split('\n');
    return (
      <div className="font-mono text-xs leading-relaxed space-y-1.5 text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;
          
          if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || trimmed.startsWith('SCENE:')) {
            return (
              <p key={idx} className="font-bold text-sky-400 tracking-wider uppercase bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40 my-1">
                {trimmed}
              </p>
            );
          }
          
          if (/^[A-Z0-9\s\(\)]+$/.test(trimmed) && trimmed.length < 35) {
            return (
              <p key={idx} className="font-bold text-cyan-300 text-center pt-1 tracking-widest text-[12px]">
                {trimmed}
              </p>
            );
          }

          if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            return (
              <p key={idx} className="text-slate-400 italic text-center text-[11px]">
                {trimmed}
              </p>
            );
          }

          return (
            <p key={idx} className="text-slate-200/90 leading-relaxed px-0.5">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  const calculateWordCount = (str: string) => str ? str.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full w-full flex flex-col bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Sleek Compact Control Header (Height 40px) */}
      <header className="h-10 border-b border-white/10 bg-[#0c1220] px-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
              showSidebar 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
            }`}
            title="Toggle Scene Sidebar"
          >
            {showSidebar ? <PanelLeftClose className="w-3.5 h-3.5 text-emerald-400" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{showSidebar ? 'Hide Sidebar' : 'Scene Sidebar'}</span>
          </button>

          <div className="h-3.5 w-px bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold text-xs text-emerald-300 truncate">
              Phase 3: Scene Tournament Arena
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden md:inline">
              Scene {selectedSceneNumber}: {sceneTitle || 'Untitled'}
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5">
          {approvedSuccess && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3 h-3" /> Synced to Bible!
            </span>
          )}

          <button
            onClick={handleRunTournament}
            disabled={isGenerating}
            className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            <span>{isGenerating ? 'Drafting Dual AI...' : 'Run Dual Tournament'}</span>
          </button>

          {writerCDraft && (
            <button
              onClick={handleApproveWriterC}
              disabled={isApproving}
              className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              {isApproving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>Approve Winner</span>
            </button>
          )}

          {writerCDraft && (
            <button
              onClick={async () => {
                await handleApproveWriterC();
                if (onSceneApproved) onSceneApproved();
              }}
              className="px-2.5 py-1 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              <span>Phase 4 Optimization</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </header>

      {/* Main Split Layout: Sidebar + Arena Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toggleable Left Sidebar for Scene Selection & Parameters */}
        {showSidebar && (
          <aside className="w-72 bg-[#0d1322] border-r border-white/10 flex flex-col shrink-0 overflow-hidden z-10 transition-all">
            {/* Sidebar Top Header */}
            <div className="p-2 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-400" /> Scenes & Specs
              </span>

              <button
                onClick={handleAddScene}
                className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                title="Add New Scene"
              >
                <Plus className="w-3 h-3" /> Scene
              </button>
            </div>

            {/* Scenes List (Scrollable) */}
            <div className="p-2 border-b border-white/10 max-h-40 overflow-y-auto custom-scrollbar space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Story Bible Scenes ({bible?.scenes?.length || 0})
              </span>

              {bible?.scenes && bible.scenes.length > 0 ? (
                bible.scenes.map((s, idx) => {
                  const num = s.sceneNumber || idx + 1;
                  const isSelected = selectedSceneNumber === num;
                  return (
                    <button
                      key={s.id || idx}
                      onClick={() => handleSelectScene(num)}
                      className={`w-full p-1.5 rounded-md text-left transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 font-bold'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${isSelected ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          {num}
                        </span>
                        <span className="text-[11px] truncate">{s.title || `Scene ${num}`}</span>
                      </div>
                      {s.status === 'approved' && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={() => handleSelectScene(1)}
                  className="w-full p-1.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[11px] font-bold"
                >
                  Scene 1 (Opening)
                </button>
              )}
            </div>

            {/* Scene Parameters & Specs Form */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Scene Title</label>
                <input
                  type="text"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400"
                  placeholder="Title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Location</label>
                  <input
                    type="text"
                    value={sceneLocation}
                    onChange={(e) => setSceneLocation(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400"
                    placeholder="Location..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Characters</label>
                  <input
                    type="text"
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400"
                    placeholder="Characters..."
                  />
                </div>
              </div>

              {/* Specs Segmented Tabs */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center gap-1 bg-[#080c14] p-0.5 rounded border border-white/5">
                  <button
                    onClick={() => setActiveSetupTab('brief')}
                    className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${activeSetupTab === 'brief' ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40' : 'text-slate-400'}`}
                  >
                    Brief
                  </button>
                  <button
                    onClick={() => setActiveSetupTab('cpsd')}
                    className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${activeSetupTab === 'cpsd' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-slate-400'}`}
                  >
                    CPSD Doc
                  </button>
                  <button
                    onClick={() => setActiveSetupTab('characters')}
                    className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${activeSetupTab === 'characters' ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40' : 'text-slate-400'}`}
                  >
                    Persona
                  </button>
                  <button
                    onClick={() => setActiveSetupTab('acoustic')}
                    className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${activeSetupTab === 'acoustic' ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40' : 'text-slate-400'}`}
                  >
                    Audio
                  </button>
                </div>

                {activeSetupTab === 'brief' && (
                  <textarea
                    rows={6}
                    value={sceneBrief}
                    onChange={(e) => setSceneBrief(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/10 rounded p-2 text-[11px] text-slate-200 leading-relaxed focus:outline-none focus:border-sky-400 custom-scrollbar"
                    placeholder="Dramatic stakes, objectives, turning points..."
                  />
                )}

                {activeSetupTab === 'cpsd' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" /> Phase 4 CPSD Document
                      </span>
                      <button
                        onClick={handleGenerateCpsd}
                        disabled={isGeneratingCpsd}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[9px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingCpsd ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                        <span>{isGeneratingCpsd ? 'Drafting...' : 'Auto CPSD'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      value={cpsdDoc}
                      onChange={(e) => setCpsdDoc(e.target.value)}
                      className="w-full bg-[#090d16] border border-amber-500/30 rounded p-2 text-[10px] font-mono text-amber-100/90 leading-relaxed focus:outline-none focus:border-amber-400 custom-scrollbar"
                      placeholder="Cinematic Prose Scene Document (CPSD) passed directly to Agents A, B, & C..."
                    />
                  </div>
                )}

                {activeSetupTab === 'characters' && (
                  <textarea
                    rows={6}
                    value={characterDetails}
                    onChange={(e) => setCharacterDetails(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/10 rounded p-2 text-[11px] text-slate-200 leading-relaxed focus:outline-none focus:border-sky-400 custom-scrollbar"
                    placeholder="Character vocal quirks & emotional triggers..."
                  />
                )}

                {activeSetupTab === 'acoustic' && (
                  <textarea
                    rows={6}
                    value={acousticDetails}
                    onChange={(e) => setAcousticDetails(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/10 rounded p-2 text-[11px] text-slate-200 leading-relaxed focus:outline-none focus:border-sky-400 custom-scrollbar"
                    placeholder="Environmental acoustics, audio pauses..."
                  />
                )}

                <button
                  onClick={handleValidateSceneBrief}
                  disabled={isValidatingBrief}
                  className="w-full py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  {isValidatingBrief ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>{isValidatingBrief ? 'Analyzing...' : 'AI Validate Specs'}</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Tournament Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-2.5 md:p-3 space-y-2.5 custom-scrollbar bg-[#080c14]">
          {/* Tournament Arena Mode Bar */}
          <div className="flex items-center justify-between bg-[#0d1322] px-2.5 py-1.5 rounded-lg border border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Draft Comparison Arena
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#080c14] p-0.5 rounded border border-white/5">
              <button
                onClick={() => setArenaMode('split')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  arenaMode === 'split' ? 'bg-sky-500 text-slate-950 font-extrabold' : 'text-slate-400'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Split (A vs B)</span>
              </button>

              <button
                onClick={() => setArenaMode('master')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  arenaMode === 'master' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400'
                }`}
              >
                <CrownIcon className="w-3 h-3" />
                <span>Master (C)</span>
              </button>

              <button
                onClick={() => setArenaMode('trio')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  arenaMode === 'trio' ? 'bg-slate-700 text-white font-extrabold' : 'text-slate-400'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Trio Overview</span>
              </button>
            </div>
          </div>

          {/* Empty / Loading State */}
          {!writerADraft && !writerBDraft && !writerCDraft && !isGenerating && (
            <div className="bg-[#0d1322]/80 border border-dashed border-white/10 rounded-xl p-8 text-center space-y-2 shadow-sm my-auto">
              <Trophy className="w-8 h-8 text-sky-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-100">Ready for Scene Tournament</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Trigger dual parallel writers (Writer A: Visceral & Writer B: Conflict Pacing), auto-synthesized by Writer C.
              </p>
              <button
                onClick={handleRunTournament}
                className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_12px_rgba(14,165,233,0.3)]"
              >
                <Zap className="w-3.5 h-3.5" /> Start Tournament
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="bg-[#0d1322]/80 border border-white/10 rounded-xl p-8 text-center space-y-2 shadow-sm animate-pulse my-auto">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
              <h4 className="text-xs font-bold text-slate-100">Dual AI Writers Executing...</h4>
              <p className="text-[11px] text-slate-400">Writer A & Writer B drafting in parallel → Writer C Master Synthesis.</p>
            </div>
          )}

          {/* Draft Comparison Canvas */}
          {(writerADraft || writerBDraft || writerCDraft) && !isGenerating && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
              {/* Writer C Master Synthesis Bar (if available) */}
              {writerCDraft && (arenaMode === 'master' || arenaMode === 'split') && (
                <div className="bg-[#0a1524] border border-emerald-500/40 rounded-xl p-2.5 space-y-2 shadow-sm shrink-0">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <CrownIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider">
                        Writer C — Approved Master Synthesis
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Champion
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-white/5">
                        {calculateWordCount(writerCDraft)} w
                      </span>
                      <button
                        onClick={() => copyToClipboard(writerCDraft, 'writerC')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Copy to clipboard"
                      >
                        {copiedDraft === 'writerC' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={handleApproveWriterC}
                        disabled={isApproving}
                        className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      >
                        {isApproving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Approve & Sync</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#060a12] p-3 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                    {renderScreenplayText(writerCDraft)}
                  </div>
                </div>
              )}

              {/* Main Grid View */}
              <div
                className={`flex-1 grid gap-2.5 min-h-0 ${
                  arenaMode === 'trio'
                    ? 'grid-cols-1 md:grid-cols-3'
                    : arenaMode === 'split'
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {/* Writer A */}
                {(arenaMode === 'split' || arenaMode === 'trio') && (
                  <div className="bg-[#0d1322] border border-amber-500/30 rounded-xl p-2.5 space-y-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Writer A</span>
                        <span className="text-[10px] text-amber-400 font-medium">(Emotional)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-white/5">
                          {calculateWordCount(writerADraft)} w
                        </span>
                        <button
                          onClick={() => copyToClipboard(writerADraft, 'writerA')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedDraft === 'writerA' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#060a12] p-2.5 rounded-lg border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                      {writerADraft ? renderScreenplayText(writerADraft) : (
                        <p className="text-xs text-slate-500 italic">No draft generated.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Writer B */}
                {(arenaMode === 'split' || arenaMode === 'trio') && (
                  <div className="bg-[#0d1322] border border-sky-500/30 rounded-xl p-2.5 space-y-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Writer B</span>
                        <span className="text-[10px] text-sky-400 font-medium">(Conflict & Pacing)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-white/5">
                          {calculateWordCount(writerBDraft)} w
                        </span>
                        <button
                          onClick={() => copyToClipboard(writerBDraft, 'writerB')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedDraft === 'writerB' ? <Check className="w-3 h-3 text-sky-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#060a12] p-2.5 rounded-lg border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                      {writerBDraft ? renderScreenplayText(writerBDraft) : (
                        <p className="text-xs text-slate-500 italic">No draft generated.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Writer C in Trio Mode */}
                {arenaMode === 'trio' && (
                  <div className="bg-[#0d1322] border border-emerald-500/30 rounded-xl p-2.5 space-y-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <CrownIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Writer C</span>
                        <span className="text-[10px] text-emerald-400 font-medium">(Master)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-white/5">
                          {calculateWordCount(writerCDraft)} w
                        </span>
                        <button
                          onClick={() => copyToClipboard(writerCDraft, 'writerC_trio')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedDraft === 'writerC_trio' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#060a12] p-2.5 rounded-lg border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                      {writerCDraft ? renderScreenplayText(writerCDraft) : (
                        <p className="text-xs text-slate-500 italic">No master synthesis.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Scene Brief Validation Modal */}
      {showBriefValidationModal && briefValidation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0d1322] border border-sky-500/40 rounded-xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-4 space-y-3 shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-100">J.A.R.V.I.S. Scene Brief Analysis</h3>
              </div>
              <button
                onClick={() => setShowBriefValidationModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded bg-[#080c14] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Assessment</span>
              <p className="text-xs text-slate-200 leading-relaxed">{briefValidation.overallAssessment}</p>
            </div>

            <div className="p-2.5 rounded bg-[#1c120c] border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Dramatic Gaps</span>
              <p className="text-xs text-amber-200/90 leading-relaxed">{briefValidation.characterStakesCritique}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowBriefValidationModal(false)}
                className="px-3 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplySuggestedBriefFixes}
                className="px-3.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Apply AI Enhancements</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
    </svg>
  );
}
