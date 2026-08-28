import React, { useState, useEffect } from 'react';
import { StoryBible, createDefaultStoryBible, storyBibleToMarkdown, CharacterProfile, LocationProfile, BibleScene } from '../types/storyBible';
import { BookOpen, Download, Upload, RefreshCw, CheckCircle2, FileText, Code, Save, Plus, Trash2, Edit2, Layers, Volume2, UserCheck, Sparkles, Film, RotateCcw, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatSafeText } from '../utils/formatUtils';

export default function StoryBiblePanel() {
  const [bible, setBible] = useState<StoryBible>(createDefaultStoryBible());
  const [activeView, setActiveView] = useState<'editor' | 'markdown' | 'json'>('editor');
  const [editorSubTab, setEditorSubTab] = useState<'concept' | 'storyline' | 'characters' | 'speakers' | 'locations' | 'scenes'>('concept');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [customCritiqueInstruction, setCustomCritiqueInstruction] = useState<string>('');
  const [isValidatingBible, setIsValidatingBible] = useState<boolean>(false);
  const [bibleValidation, setBibleValidation] = useState<{
    overallGrade: string;
    strengths: string[];
    plotHolesAndFixes: Array<{ issue: string; fix: string }>;
    characterArcCritique: string;
    acousticAtmosphereCritique: string;
    sceneContinuityCritique?: string;
    recommendedActionableImprovements: string[];
  } | null>(null);
  const [showBibleValidationModal, setShowBibleValidationModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const handleResetProject = async () => {
    setIsResetting(true);
    try {
      const sessionId = localStorage.getItem('chat-session-id');
      const res = await fetch('/api/story-bible/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        const freshSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('chat-session-id', freshSessionId);
        window.location.reload();
      }
    } catch (e) {
      console.error('Error resetting project:', e);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(bible, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `StoryBible_${bible.concept?.title?.replace(/\s+/g, '_') || 'Export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    const md = storyBibleToMarkdown(bible);
    const mdString = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', mdString);
    downloadAnchor.setAttribute('download', `StoryBible_${bible.concept?.title?.replace(/\s+/g, '_') || 'Export'}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setBible(parsed);
        setRawJson(JSON.stringify(parsed, null, 2));
        handleSave(parsed);
      } catch (err: any) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchBible();
  }, []);

  const fetchBible = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/story-bible');
      if (res.ok) {
        const data: StoryBible = await res.json();
        setBible(data);
        setRawJson(JSON.stringify(data, null, 2));
        setMarkdownText(storyBibleToMarkdown(data));
      }
    } catch (e) {
      console.error('Error fetching story bible:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedBible: StoryBible = bible) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible)
      });
      if (res.ok) {
        const result = await res.json();
        setBible(result.bible);
        setRawJson(JSON.stringify(result.bible, null, 2));
        setMarkdownText(storyBibleToMarkdown(result.bible));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving story bible:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      setBible(parsed);
      setMarkdownText(storyBibleToMarkdown(parsed));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleValidateEntireBible = async () => {
    setIsValidatingBible(true);
    try {
      const res = await fetch('/api/validation/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bible, customInstruction: customCritiqueInstruction })
      });
      if (res.ok) {
        const data = await res.json();
        setBibleValidation(data);
        setShowBibleValidationModal(true);
      }
    } catch (e) {
      console.error('Bible validation error:', e);
    } finally {
      setIsValidatingBible(false);
    }
  };

  const updateBibleField = (path: string[], value: any) => {
    const copy = JSON.parse(JSON.stringify(bible));
    let curr = copy;
    for (let i = 0; i < path.length - 1; i++) {
      if (!curr[path[i]]) curr[path[i]] = {};
      curr = curr[path[i]];
    }
    curr[path[path.length - 1]] = value;
    setBible(copy);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#080c14] text-slate-400 font-mono text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400 mr-2" />
        Loading Story Bible Engine...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Sub-Header Bar */}
      <div className="h-10 border-b border-white/10 bg-[#0d1322] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5.5 h-5.5 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
            <BookOpen className="w-3 h-3" />
          </div>
          <h2 className="font-extrabold text-xs text-purple-300 uppercase tracking-wider">PHASE 2: STORY BIBLE ARCHITECTURE</h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold ml-2 border border-purple-500/30">
            {bible.scenes?.length || 0} Scenes Registered
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved!
            </span>
          )}

          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="h-7 px-3 rounded bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : 'Save Bible'}
          </button>

          <button
            onClick={handleExportJson}
            className="h-7 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Export Story Bible as JSON"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            JSON
          </button>

          <button
            onClick={handleExportMarkdown}
            className="h-7 px-2.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-bold text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Export Story Bible as Markdown"
          >
            <Download className="w-3 h-3 text-sky-400" />
            MD
          </button>

          <label className="h-7 px-2.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center gap-1 cursor-pointer transition-colors">
            <Upload className="w-3 h-3 text-purple-400" />
            Import
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={handleValidateEntireBible}
            disabled={isValidatingBible}
            className="h-7 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {isValidatingBible ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
            AI Critique
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="h-7 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Factory Reset Story Bible & Cache"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* View Switcher & Sub-Tabs Bar */}
      <div className="bg-[#090d16] border-b border-white/10 px-4 py-2 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer border ${
              activeView === 'editor' ? 'bg-purple-500 text-white border-purple-400' : 'text-slate-400 hover:text-white bg-slate-800/40 border-white/5'
            }`}
          >
            Visual Editor
          </button>
          <button
            onClick={() => setActiveView('markdown')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer border ${
              activeView === 'markdown' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'text-slate-400 hover:text-white bg-slate-800/40 border-white/5'
            }`}
          >
            Markdown View
          </button>
          <button
            onClick={() => setActiveView('json')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer border ${
              activeView === 'json' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'text-slate-400 hover:text-white bg-slate-800/40 border-white/5'
            }`}
          >
            JSON Raw
          </button>
        </div>

        {activeView === 'editor' && (
          <div className="flex items-center gap-1.5">
            {[
              { id: 'concept', label: 'Premise', icon: BookOpen, activeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
              { id: 'storyline', label: 'Arcs', icon: Layers, activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
              { id: 'characters', label: 'Cast', icon: UserCheck, activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
              { id: 'locations', label: 'Lore', icon: Film, activeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
              { id: 'scenes', label: 'Scenes', icon: FileText, activeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEditorSubTab(tab.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                  editorSubTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <tab.icon className="w-3 h-3" /> {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full custom-scrollbar">
        {activeView === 'editor' && (
          <div className="space-y-4">
            {editorSubTab === 'concept' && (
              <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
                <div className="h-1 bg-sky-500 w-full" />
                <div className="p-4 border-b border-white/10 bg-[#090d16] flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Premise & Core Metadata</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={bible.concept?.title || ''}
                        onChange={(e) => updateBibleField(['concept', 'title'], e.target.value)}
                        className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Genre</label>
                      <input
                        type="text"
                        value={bible.concept?.genre || ''}
                        onChange={(e) => updateBibleField(['concept', 'genre'], e.target.value)}
                        className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Hook / Logline</label>
                    <textarea
                      rows={2}
                      value={bible.concept?.hook || ''}
                      onChange={(e) => updateBibleField(['concept', 'hook'], e.target.value)}
                      className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Full Summary</label>
                    <textarea
                      rows={4}
                      value={bible.concept?.summary || ''}
                      onChange={(e) => updateBibleField(['concept', 'summary'], e.target.value)}
                      className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {editorSubTab === 'storyline' && (
              <div className="bg-[#0d1322] border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
                <div className="h-1 bg-sky-500 w-full" />
                <div className="p-4 border-b border-white/10 bg-[#090d16]">
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Storyline & Narrative Arcs</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Macro Trajectory</label>
                    <textarea
                      rows={3}
                      value={bible.storyline?.macroPlotArc || ''}
                      onChange={(e) => updateBibleField(['storyline', 'macroPlotArc'], e.target.value)}
                      className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Climax Peak</label>
                      <textarea
                        rows={3}
                        value={bible.storyline?.climax || ''}
                        onChange={(e) => updateBibleField(['storyline', 'climax'], e.target.value)}
                        className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Resolution</label>
                      <textarea
                        rows={3}
                        value={bible.storyline?.resolution || ''}
                        onChange={(e) => updateBibleField(['storyline', 'resolution'], e.target.value)}
                        className="w-full bg-[#080c14] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editorSubTab === 'characters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Character Cast Profiles</h3>
                  <button
                    onClick={() => {
                      const newChar: CharacterProfile = { id: 'char-' + Date.now(), name: 'New Character', role: 'supporting', age: '30', vocalProfile: '', voiceId: 'en-US-BrianNeural', background: '', speechQuirks: '', motivations: '' };
                      updateBibleField(['characterProfiles'], [...(bible.characterProfiles || []), newChar]);
                    }}
                    className="px-2.5 py-1 bg-sky-500 text-slate-950 font-bold text-xs rounded hover:bg-sky-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Character
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bible.characterProfiles?.map((c, idx) => (
                    <div key={c.id || idx} className="bg-[#0d1322] border border-white/10 rounded-lg p-4 space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const copy = [...bible.characterProfiles];
                            copy[idx].name = e.target.value;
                            updateBibleField(['characterProfiles'], copy);
                          }}
                          className="bg-transparent font-bold text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const copy = bible.characterProfiles.filter((_, i) => i !== idx);
                            updateBibleField(['characterProfiles'], copy);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Role</label>
                          <select
                            value={c.role}
                            onChange={(e) => {
                              const copy = [...bible.characterProfiles];
                              copy[idx].role = e.target.value as any;
                              updateBibleField(['characterProfiles'], copy);
                            }}
                            className="w-full bg-[#080c14] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="protagonist">Protagonist</option>
                            <option value="antagonist">Antagonist</option>
                            <option value="supporting">Supporting</option>
                            <option value="narrator">Narrator</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Motivations & Background</label>
                          <textarea
                            rows={2}
                            value={c.motivations || c.background || ''}
                            onChange={(e) => {
                              const copy = [...bible.characterProfiles];
                              copy[idx].motivations = e.target.value;
                              updateBibleField(['characterProfiles'], copy);
                            }}
                            className="w-full bg-[#080c14] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editorSubTab === 'scenes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Scene Index & Outlines</h3>
                  <button
                    onClick={() => {
                      const newScene: BibleScene = { id: 'scene-' + Date.now(), sceneNumber: (bible.scenes?.length || 0) + 1, title: 'New Scene', location: '', charactersInScene: [], rawProse: '', summary: '', status: 'draft', updatedAt: Date.now() };
                      updateBibleField(['scenes'], [...(bible.scenes || []), newScene]);
                    }}
                    className="px-2.5 py-1 bg-sky-500 text-slate-950 font-bold text-xs rounded hover:bg-sky-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Scene
                  </button>
                </div>

                <div className="space-y-3">
                  {bible.scenes?.map((s, idx) => (
                    <div key={s.id || idx} className="bg-[#0d1322] border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                            {s.sceneNumber || idx + 1}
                          </span>
                          <input
                            type="text"
                            value={s.title}
                            onChange={(e) => {
                              const copy = [...bible.scenes];
                              copy[idx].title = e.target.value;
                              updateBibleField(['scenes'], copy);
                            }}
                            className="bg-transparent font-bold text-xs text-white focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const copy = bible.scenes.filter((_, i) => i !== idx);
                            updateBibleField(['scenes'], copy);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Summary / Objective</label>
                          <textarea
                            rows={2}
                            value={s.summary || ''}
                            onChange={(e) => {
                              const copy = [...bible.scenes];
                              copy[idx].summary = e.target.value;
                              updateBibleField(['scenes'], copy);
                            }}
                            className="w-full bg-[#080c14] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Location</label>
                          <input
                            type="text"
                            value={s.location || ''}
                            onChange={(e) => {
                              const copy = [...bible.scenes];
                              copy[idx].location = e.target.value;
                              updateBibleField(['scenes'], copy);
                            }}
                            className="w-full bg-[#080c14] border border-white/10 rounded px-2 py-1 text-xs text-white mb-2"
                          />
                          {s.agentSource && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                              Source: {s.agentSource}
                            </span>
                          )}
                        </div>
                      </div>

                      {(s.dramaticWant || s.subtextAndTension || s.twistOrHook || s.emotionalTurningPoint || (s.keyDialogueBeats && s.keyDialogueBeats.length > 0)) && (
                        <div className="bg-[#080c14] border border-white/5 rounded p-3 space-y-2 text-xs">
                          {s.dramaticWant && (
                            <div>
                              <span className="text-sky-400 font-bold uppercase text-[9px] block">Dramatic Want / Goal:</span>
                              <p className="text-slate-200">{s.dramaticWant}</p>
                            </div>
                          )}
                          {s.subtextAndTension && (
                            <div>
                              <span className="text-amber-400 font-bold uppercase text-[9px] block">Subtext & Undercurrent Tension:</span>
                              <p className="text-slate-200">{s.subtextAndTension}</p>
                            </div>
                          )}
                          {s.keyDialogueBeats && s.keyDialogueBeats.length > 0 && (
                            <div>
                              <span className="text-cyan-400 font-bold uppercase text-[9px] block">Key Dialogue Beats:</span>
                              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                {s.keyDialogueBeats.map((beat, bIdx) => (
                                  <li key={bIdx}>{beat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {s.twistOrHook && (
                            <div>
                              <span className="text-rose-400 font-bold uppercase text-[9px] block">Twist / Hook:</span>
                              <p className="text-slate-200">{s.twistOrHook}</p>
                            </div>
                          )}
                          {s.emotionalTurningPoint && (
                            <div>
                              <span className="text-purple-400 font-bold uppercase text-[9px] block">Emotional Turning Point:</span>
                              <p className="text-slate-200">{s.emotionalTurningPoint}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {(s.cpsdDocument || s.rawProse) && (
                        <details className="bg-[#080c14] border border-sky-900/30 rounded p-2 text-xs text-slate-300">
                          <summary className="cursor-pointer font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1">
                            <span>📄 View CPSD Document & Master Narrative Prose</span>
                          </summary>
                          <div className="mt-2 space-y-3 pt-2 border-t border-white/5">
                            {s.cpsdDocument && (
                              <div>
                                <h5 className="font-bold text-sky-300 text-[10px] uppercase mb-1">CPSD Blueprint</h5>
                                <div className="bg-black/40 p-2.5 rounded font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                  {s.cpsdDocument}
                                </div>
                              </div>
                            )}
                            {s.rawProse && (!s.cpsdDocument || !s.cpsdDocument.includes(s.rawProse.slice(0, 40))) && (
                              <div>
                                <h5 className="font-bold text-emerald-300 text-[10px] uppercase mb-1">Master Narrative Prose</h5>
                                <div className="bg-black/40 p-2.5 rounded font-mono text-[11px] text-emerald-200/90 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                  {s.rawProse}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'markdown' && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider border-b border-white/10 pb-2">Markdown Preview</h3>
            <div className="prose prose-invert max-w-none text-xs leading-relaxed">
              <ReactMarkdown>{markdownText}</ReactMarkdown>
            </div>
          </div>
        )}

        {activeView === 'json' && (
          <div className="bg-[#0d1322] border border-white/10 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Raw JSON Structure</h3>
              {jsonError && <span className="text-[10px] text-rose-400 font-bold">{jsonError}</span>}
            </div>
            <textarea
              rows={20}
              value={rawJson}
              onChange={handleRawJsonChange}
              className="w-full bg-[#080c14] font-mono text-xs text-sky-300 p-3 rounded border border-white/10 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1322] border border-rose-500/40 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-sm text-rose-400 uppercase tracking-wider">Reset Project Data?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset the Story Bible and clean all workspace caches back to default state. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProject}
                disabled={isResetting}
                className="px-4 py-1.5 rounded bg-rose-500 text-slate-950 font-extrabold text-xs hover:bg-rose-400 cursor-pointer"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bible Validation Modal */}
      {showBibleValidationModal && bibleValidation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1322] border border-white/10 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">J.A.R.V.I.S. Story Bible Critique Report</h3>
              </div>
              <button onClick={() => setShowBibleValidationModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="p-3 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Overall Architecture Grade</span>
              <span className="text-sm font-extrabold text-sky-400">{bibleValidation.overallGrade}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Strengths</span>
              <ul className="text-xs text-slate-200 list-disc list-inside space-y-1">
                {bibleValidation.strengths?.map((s, i) => <li key={i}>{formatSafeText(s)}</li>)}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Recommended Improvements</span>
              <ul className="text-xs text-slate-200 list-disc list-inside space-y-1">
                {bibleValidation.recommendedActionableImprovements?.map((r, i) => <li key={i}>{formatSafeText(r)}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
