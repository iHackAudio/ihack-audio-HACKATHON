import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Edit3,
  Eye,
  Check,
  Copy,
  Save,
  ShieldCheck,
  Plus,
  Send,
  Cpu,
  Wand2,
  Volume2,
  Download,
  BookOpen,
  ArrowRight,
  Trash2,
  MessageSquare,
  ChevronDown,
  Layers,
  Mic
} from 'lucide-react';
import { StoryFlixBible, BibleScene, SceneIdeaItem } from '../types/storyFlix';
import { generateCpsdAndProse, refineCpsdWithJarvis } from '../services/storyFlixApi';

interface CpsdDocumentStudioProps {
  bible: StoryFlixBible;
  onSaveScene: (scene: BibleScene, actionName: string, actionDetails: string) => Promise<void>;
  onPlotNextScene: () => void;
  onNavigateToMatrix: () => void;
  selectedIdeaForScene?: SceneIdeaItem | null;
}

type TabType = 'cpsd' | 'prose' | 'production' | 'dna';

export const CpsdDocumentStudio: React.FC<CpsdDocumentStudioProps> = ({
  bible,
  onSaveScene,
  onPlotNextScene,
  onNavigateToMatrix,
  selectedIdeaForScene
}) => {
  // Determine active scene
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(() => {
    if (bible.scenes && bible.scenes.length > 0) {
      return bible.scenes[bible.scenes.length - 1].sceneNumber;
    }
    return 1;
  });

  const activeScene = bible.scenes?.find(s => s.sceneNumber === selectedSceneNumber);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('cpsd');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Editable states
  const [cpsdDoc, setCpsdDoc] = useState<string>('');
  const [rawProse, setRawProse] = useState<string>('');
  const [productionNotes, setProductionNotes] = useState<string>('');

  // Structured scene fields
  const [sceneTitle, setSceneTitle] = useState<string>('');
  const [sceneLocation, setSceneLocation] = useState<string>('');
  const [sceneSummary, setSceneSummary] = useState<string>('');
  const [dramaticWant, setDramaticWant] = useState<string>('');
  const [subtextTension, setSubtextTension] = useState<string>('');
  const [twistHook, setTwistHook] = useState<string>('');
  const [dialogueBeats, setDialogueBeats] = useState<string[]>([]);

  // Generation & AI states
  const [customCraftFocus, setCustomCraftFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // JARVIS Chat Assistant
  const [jarvisDrawerOpen, setJarvisDrawerOpen] = useState<boolean>(true);
  const [jarvisInput, setJarvisInput] = useState<string>('');
  const [isJarvisThinking, setIsJarvisThinking] = useState<boolean>(false);
  const [jarvisChatHistory, setJarvisChatHistory] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    proposedUpdates?: {
      cpsdDocument?: string;
      cleanNarrativeProse?: string;
      screenplayScript?: string;
    };
  }>>([
    {
      sender: 'assistant',
      text: "Greetings. I am J.A.R.V.I.S., your Co-Director and Story Architect. I am ready to review the CPSD scene blueprint, sensory matrix, raw prose, and acoustic cues. You can edit any section manually or give me creative directions to refine."
    }
  ]);

  // Sync state whenever activeScene changes
  useEffect(() => {
    if (activeScene) {
      setCpsdDoc(activeScene.cpsdDocument || '');
      setRawProse(activeScene.rawProse || '');
      setProductionNotes(activeScene.scriptContent || '');
      setSceneTitle(activeScene.title || `Scene ${activeScene.sceneNumber}`);
      setSceneLocation(activeScene.location || 'Primary Setting');
      setSceneSummary(activeScene.summary || '');
      setDramaticWant(activeScene.dramaticWant || '');
      setSubtextTension(activeScene.subtextAndTension || '');
      setTwistHook(activeScene.twistOrHook || '');
      setDialogueBeats(activeScene.keyDialogueBeats || []);
    } else if (selectedIdeaForScene) {
      setSceneTitle(selectedIdeaForScene.title);
      setSceneSummary(selectedIdeaForScene.summary);
      setDramaticWant(selectedIdeaForScene.dramaticWant || '');
      setSubtextTension(selectedIdeaForScene.subtextAndTension || '');
      setTwistHook(selectedIdeaForScene.twistOrHook || '');
      setDialogueBeats(selectedIdeaForScene.keyDialogueBeats || []);
      setSceneLocation(bible.scenes?.[0]?.location || 'Command Bridge');
      setCpsdDoc('');
      setRawProse('');
      setProductionNotes('');
    } else {
      setSceneTitle(`Scene ${selectedSceneNumber}`);
      setSceneLocation('Primary Setting');
      setSceneSummary('');
      setDramaticWant('');
      setSubtextTension('');
      setTwistHook('');
      setDialogueBeats([]);
      setCpsdDoc('');
      setRawProse('');
      setProductionNotes('');
    }
  }, [activeScene, selectedSceneNumber, selectedIdeaForScene]);

  // Word count helper
  const proseWordCount = rawProse ? rawProse.trim().split(/\s+/).filter(Boolean).length : 0;
  const cpsdWordCount = cpsdDoc ? cpsdDoc.trim().split(/\s+/).filter(Boolean).length : 0;

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export scene markdown
  const handleDownloadMarkdown = () => {
    const content = `# SCENE ${selectedSceneNumber}: ${sceneTitle.toUpperCase()}\n\n${cpsdDoc || rawProse || 'No content yet.'}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCENE_${selectedSceneNumber}_CPSD.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send to iHack TTS
  const handleSendToTTS = () => {
    if (!rawProse) return;
    navigator.clipboard.writeText(rawProse);
    handleNotify("Copied raw prose to clipboard for iHack TTS Studio!");
  };

  const handleNotify = (msg: string) => {
    setSaveNotification(msg);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  // Generate CPSD from scratch or Phase 3 idea
  const handleGenerateCpsd = async () => {
    setIsGenerating(true);
    try {
      const targetScene: Partial<BibleScene> = {
        sceneNumber: selectedSceneNumber,
        title: sceneTitle || `Scene ${selectedSceneNumber}`,
        location: sceneLocation || 'Primary Setting',
        charactersInScene: bible.characterProfiles?.slice(0, 2).map(c => c.name) || ['Protagonist'],
        summary: sceneSummary || bible.concept?.summary || 'Crucial story turning point.',
        dramaticWant: dramaticWant || 'Uncover the hidden truth.',
        subtextAndTension: subtextTension || 'High tension, masked emotions.',
        keyDialogueBeats: dialogueBeats.length > 0 ? dialogueBeats : ['Explain what is happening.', 'We cannot turn back now.'],
        twistOrHook: twistHook || 'A startling revelation.'
      };

      const result = await generateCpsdAndProse({
        approvedScene: targetScene,
        customFocus: customCraftFocus
      });

      if (result.cpsdDocument) setCpsdDoc(result.cpsdDocument);
      if (result.cleanNarrativeProse) setRawProse(result.cleanNarrativeProse);
      if (result.screenplayScript) setProductionNotes(result.screenplayScript);

      const newScene: BibleScene = {
        id: activeScene?.id || `scene_${selectedSceneNumber}_${Date.now()}`,
        sceneNumber: selectedSceneNumber,
        title: targetScene.title || `Scene ${selectedSceneNumber}`,
        location: targetScene.location || 'Primary Setting',
        charactersInScene: targetScene.charactersInScene || [],
        summary: targetScene.summary || '',
        dramaticWant: targetScene.dramaticWant,
        subtextAndTension: targetScene.subtextAndTension,
        keyDialogueBeats: targetScene.keyDialogueBeats,
        twistOrHook: targetScene.twistOrHook,
        cpsdDocument: result.cpsdDocument || '',
        rawProse: result.cleanNarrativeProse || '',
        scriptContent: result.screenplayScript || '',
        status: 'draft',
        updatedAt: Date.now()
      };

      await onSaveScene(
        newScene,
        `Generated CPSD for Scene ${selectedSceneNumber}`,
        `CPSD blueprint, ~800-word prose, and production guidance generated.`
      );

      handleNotify(`CPSD Scene Document generated for Scene ${selectedSceneNumber}!`);
    } catch (err) {
      console.error('Failed to generate CPSD:', err);
      handleNotify('Generation error. Please check your connection and retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save changes manually
  const handleSaveManual = async (lockScene: boolean = false) => {
    setIsSaving(true);
    try {
      const updatedScene: BibleScene = {
        id: activeScene?.id || `scene_${selectedSceneNumber}_${Date.now()}`,
        sceneNumber: selectedSceneNumber,
        title: sceneTitle || `Scene ${selectedSceneNumber}`,
        location: sceneLocation || 'Primary Setting',
        charactersInScene: activeScene?.charactersInScene || bible.characterProfiles?.slice(0, 2).map(c => c.name) || [],
        summary: sceneSummary,
        dramaticWant,
        subtextAndTension: subtextTension,
        keyDialogueBeats: dialogueBeats,
        twistOrHook: twistHook,
        cpsdDocument: cpsdDoc,
        rawProse,
        scriptContent: productionNotes,
        status: lockScene ? 'approved' : (activeScene?.status || 'draft'),
        updatedAt: Date.now()
      };

      await onSaveScene(
        updatedScene,
        lockScene ? `Locked Scene ${selectedSceneNumber}: ${updatedScene.title}` : `Updated Scene ${selectedSceneNumber}`,
        lockScene ? `Scene locked as approved in Story Bible.` : `Manual revisions saved to Story Bible.`
      );

      handleNotify(lockScene ? `Scene ${selectedSceneNumber} LOCKED & Finalized on Bible!` : `Scene ${selectedSceneNumber} saved successfully!`);
    } catch (err) {
      console.error('Save failed:', err);
      handleNotify('Error saving scene to Story Bible.');
    } finally {
      setIsSaving(false);
    }
  };

  // JARVIS Chat & Refinement
  const handleSendJarvisPrompt = async (promptOverride?: string) => {
    const instruction = promptOverride || jarvisInput;
    if (!instruction.trim() || isJarvisThinking) return;

    const userMsg = instruction.trim();
    if (!promptOverride) setJarvisInput('');

    setJarvisChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsJarvisThinking(true);

    try {
      const currentSceneObj: Partial<BibleScene> = {
        sceneNumber: selectedSceneNumber,
        title: sceneTitle,
        location: sceneLocation,
        summary: sceneSummary,
        dramaticWant,
        subtextAndTension: subtextTension,
        twistOrHook: twistHook,
        keyDialogueBeats: dialogueBeats
      };

      const result = await refineCpsdWithJarvis({
        userInstruction: userMsg,
        cpsdDocument: cpsdDoc,
        cleanNarrativeProse: rawProse,
        screenplayScript: productionNotes,
        currentScene: currentSceneObj,
        chatHistory: jarvisChatHistory.map(m => ({ sender: m.sender, text: m.text }))
      });

      setJarvisChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: result.reply,
          proposedUpdates: {
            cpsdDocument: result.cpsdDocument,
            cleanNarrativeProse: result.cleanNarrativeProse,
            screenplayScript: result.screenplayScript
          }
        }
      ]);

      // Automatically apply updates if they are returned
      if (result.cpsdDocument) setCpsdDoc(result.cpsdDocument);
      if (result.cleanNarrativeProse) setRawProse(result.cleanNarrativeProse);
      if (result.screenplayScript) setProductionNotes(result.screenplayScript);

      handleNotify("J.A.R.V.I.S. refined the manuscript & sensory blueprint!");
    } catch (err) {
      console.error("JARVIS refinement failed:", err);
      setJarvisChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered an error connecting to the neural node. Your manuscript remains safe. Please try rephrasing your instruction."
        }
      ]);
    } finally {
      setIsJarvisThinking(false);
    }
  };

  // Quick Action Chips for JARVIS
  const quickJarvisChips = [
    { label: "⚡ Enhance Sensory Grounding (0-9)", prompt: "Enhance the 10-point Sensory Matrix (0 through 9) with sharper physical details, olfactory signatures, and acoustic reverb." },
    { label: "🎭 Deepen Subtext & Tension", prompt: "Deepen the unspoken subtext and psychological friction between the characters. Make the dialogue mask their true intentions." },
    { label: "🎙️ Polish Vocal Directions & Pauses", prompt: "Polish character vocal directions, breathing patterns, and silence taxonomy in the production guidance." },
    { label: "✍️ Expand Prose to 850 Words", prompt: "Expand the raw narrative prose to approximately 850 words with rich atmospheric pacing and Oscar-level scene architecture." },
    { label: "✂️ Tighten Dialogue & Beats", prompt: "Cut unnecessary exposition. Make the dialogue beats punchy, natural, and rhythmically charged." },
    { label: "🚨 Sharpen Fracture & Twist", prompt: "Sharpen the narrative fracture and ending hook so the irreversible turning point hits with maximum dramatic impact." }
  ];

  // Beat management
  const handleUpdateBeat = (index: number, val: string) => {
    const updated = [...dialogueBeats];
    updated[index] = val;
    setDialogueBeats(updated);
  };

  const handleAddBeat = () => {
    setDialogueBeats(prev => [...prev, 'New spoken line or key dramatic action...']);
  };

  const handleDeleteBeat = (index: number) => {
    setDialogueBeats(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14] text-slate-200">
      {/* Toast Notification */}
      {saveNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* TOP WORKSPACE SUBHEADER */}
      <div className="bg-[#0b101c] border-b border-sky-500/20 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Scene Selector & Badge */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
            Phase 4 • CPSD Studio
          </span>

          {/* Scene Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedSceneNumber}
              onChange={(e) => setSelectedSceneNumber(Number(e.target.value))}
              className="bg-slate-900 border border-white/15 text-white text-xs font-black rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              {bible.scenes && bible.scenes.length > 0 ? (
                bible.scenes.map((s) => (
                  <option key={s.sceneNumber} value={s.sceneNumber}>
                    Scene {s.sceneNumber}: {s.title} {s.status === 'approved' ? '✓' : '(Draft)'}
                  </option>
                ))
              ) : (
                <option value={1}>Scene 1 (New Draft)</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {activeScene?.status === 'approved' ? (
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Locked on Bible
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Draft Mode
            </span>
          )}

          {/* Prose Stats */}
          {rawProse && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/60 px-2.5 py-1 rounded-md border border-white/5">
              <span>{proseWordCount} words</span>
              <span>•</span>
              <span>~{Math.max(1, Math.round(proseWordCount / 140))} min read</span>
            </div>
          )}
        </div>

        {/* Right: Mode Toggles & Main Action Bar */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                !isEditMode ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reader</span>
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                isEditMode ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Edit</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={() => {
              const textToCopy = activeTab === 'cpsd' ? cpsdDoc : activeTab === 'prose' ? rawProse : productionNotes;
              handleCopy(textToCopy, activeTab);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            {copiedKey === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedKey === activeTab ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Markdown */}
          <button
            onClick={handleDownloadMarkdown}
            title="Download Scene Markdown"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          {/* Send to iHack TTS */}
          <button
            onClick={handleSendToTTS}
            title="Send Prose to iHack Neural TTS"
            className="px-3 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">To TTS</span>
          </button>

          {/* Save to Bible */}
          <button
            onClick={() => handleSaveManual(false)}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-white/15 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            <span>Save</span>
          </button>

          {/* Lock Scene */}
          <button
            onClick={() => handleSaveManual(true)}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>LOCK Scene</span>
          </button>

          {/* Plot Next Scene */}
          <button
            onClick={onPlotNextScene}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plot Next</span>
          </button>
        </div>
      </div>

      {/* MAIN STUDIO BODY (SPLIT VIEW WITH JARVIS CO-PILOT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: DOCUMENT EDITOR & VIEWER */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TAB NAVIGATION STRIP */}
          <div className="bg-[#090d18] border-b border-white/10 px-6 pt-2 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('cpsd')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                  activeTab === 'cpsd'
                    ? 'bg-[#0f1629] text-sky-300 border-sky-500/40 font-extrabold shadow-inner'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📑 CPSD Blueprint (Master)</span>
                {cpsdWordCount > 0 && <span className="text-[10px] opacity-70">({cpsdWordCount}w)</span>}
              </button>

              <button
                onClick={() => setActiveTab('prose')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                  activeTab === 'prose'
                    ? 'bg-[#0f1629] text-amber-300 border-amber-500/40 font-extrabold shadow-inner'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📄 Raw Story Prose (~800w)</span>
                {proseWordCount > 0 && <span className="text-[10px] opacity-70">({proseWordCount}w)</span>}
              </button>

              <button
                onClick={() => setActiveTab('production')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                  activeTab === 'production'
                    ? 'bg-[#0f1629] text-emerald-300 border-emerald-500/40 font-extrabold shadow-inner'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🎬 Production Notes & Audio Cues</span>
              </button>

              <button
                onClick={() => setActiveTab('dna')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                  activeTab === 'dna'
                    ? 'bg-[#0f1629] text-purple-300 border-purple-500/40 font-extrabold shadow-inner'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>🎯 Scene DNA & Beats</span>
              </button>
            </div>

            {/* Toggle JARVIS Drawer Button */}
            <button
              onClick={() => setJarvisDrawerOpen(!jarvisDrawerOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                jarvisDrawerOpen
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>J.A.R.V.I.S. Co-Pilot</span>
            </button>
          </div>

          {/* TAB CONTENT WORKSPACE */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0a0f1d]/50">
            {/* HERO SYNTHESIZE BANNER (if no content yet) */}
            {!cpsdDoc && !rawProse && !productionNotes && activeTab !== 'dna' ? (
              <div className="max-w-2xl mx-auto my-8 p-8 rounded-2xl bg-[#0e1424] border border-sky-500/30 text-center space-y-5 shadow-2xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <Wand2 className="w-7 h-7 text-sky-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Synthesize CPSD Scene Document</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    Generate the full Character-Plot-Setting Dossier, 10-point sensory flow, ~800-word narrative prose, and audio cues for <strong>Scene {selectedSceneNumber}: {sceneTitle}</strong>.
                  </p>
                </div>

                <div className="text-left bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-xs font-extrabold uppercase text-slate-300 flex items-center justify-between">
                    <span>Optional Craft & Sensory Direction</span>
                    <span className="text-[10px] text-sky-400">Oscar Architecture</span>
                  </label>
                  <textarea
                    value={customCraftFocus}
                    onChange={(e) => setCustomCraftFocus(e.target.value)}
                    placeholder="e.g., Emphasize psychological subtext, acoustic resonance in the room, and deliberate silence before the fracture beat..."
                    className="w-full bg-[#050811] border border-white/15 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 resize-none h-20"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleGenerateCpsd}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Executing CPSD Engine...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Generate CPSD Scene Document</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onNavigateToMatrix}
                    className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-white/10 flex items-center gap-1.5"
                  >
                    <span>Back to Scene Matrix</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* 1. CPSD MASTER BLUEPRINT TAB */}
                {activeTab === 'cpsd' && (
                  <div className="flex-1 flex flex-col space-y-4 h-full">
                    {/* CPSD Subheader & Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080d19] px-4 py-2.5 rounded-xl border border-sky-500/20 shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase text-sky-400 bg-sky-500/15 px-2.5 py-1 rounded border border-sky-500/30 tracking-wider">
                          ACTIVE CPSD DOCUMENT
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-bold">{cpsdWordCount} words</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSendJarvisPrompt("Enhance acoustic FX, Foley, and room reverb in the Audio Profile and Cues.")}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3 text-sky-400" />
                          <span>📢 Enhance Acoustic SFX</span>
                        </button>
                        <button
                          onClick={() => handleSendJarvisPrompt("Polish dialogue subtext and character psychological tension.")}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Mic className="w-3 h-3 text-purple-400" />
                          <span>🎙️ Polish Spoken Subtext</span>
                        </button>
                        <button
                          onClick={handleGenerateCpsd}
                          disabled={isGenerating}
                          className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          <span>{isGenerating ? "Regenerating..." : "✨ Regenerate CPSD Blueprint"}</span>
                        </button>
                      </div>
                    </div>

                    {isEditMode ? (
                      <div className="flex-1 flex flex-col min-h-[500px]">
                        <textarea
                          value={cpsdDoc}
                          onChange={(e) => setCpsdDoc(e.target.value)}
                          placeholder="Type or paste CPSD Markdown content..."
                          className="flex-1 w-full bg-[#050811] border border-sky-500/30 rounded-xl p-5 text-xs font-mono leading-relaxed text-slate-200 focus:outline-none focus:border-sky-400 resize-none shadow-inner custom-scrollbar"
                        />
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => handleSaveManual(false)}
                            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer"
                          >
                            Save Blueprint
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#040711] border border-sky-500/20 rounded-xl p-6 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto min-h-[500px] shadow-2xl">
                        {cpsdDoc ? (
                          cpsdDoc
                        ) : (
                          <div className="text-slate-500 italic p-6 text-center">
                            No CPSD Blueprint generated yet. Click 'Regenerate CPSD Blueprint' or use J.A.R.V.I.S. Co-Pilot!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RAW STORY PROSE TAB */}
                {activeTab === 'prose' && (
                  <div className="flex-1 flex flex-col space-y-4 h-full">
                    <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">Raw Narrative Prose</span>
                        <span className="text-[10px] text-slate-400">• Present-tense, cinematic sensory bridges (~600–900 words)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-300 font-mono font-bold">{proseWordCount} words</span>
                        <button
                          onClick={handleSendToTTS}
                          className="text-[10px] text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 font-bold"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Copy to iHack TTS</span>
                        </button>
                      </div>
                    </div>

                    {isEditMode ? (
                      <div className="flex-1 flex flex-col min-h-[500px]">
                        <textarea
                          value={rawProse}
                          onChange={(e) => setRawProse(e.target.value)}
                          placeholder="Type or paste raw story narrative prose..."
                          className="flex-1 w-full bg-[#050811] border border-amber-500/30 rounded-xl p-6 text-sm font-serif leading-loose text-slate-100 focus:outline-none focus:border-amber-400 resize-none shadow-inner custom-scrollbar"
                        />
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => handleSaveManual(false)}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                          >
                            Save Prose
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#050811] border border-white/10 rounded-xl p-8 font-serif text-sm leading-loose text-slate-200 whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto min-h-[500px]">
                        {rawProse || "No raw story prose generated yet. Click 'Manual Edit' or ask J.A.R.V.I.S. to write the scene prose."}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PRODUCTION NOTES & AUDIO CUES */}
                {activeTab === 'production' && (
                  <div className="flex-1 flex flex-col space-y-4 h-full">
                    <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">Production Guidance & Vocal Direction</span>
                        <span className="text-[10px] text-slate-400">• Acoustic cues, vocal pacing, and audio design</span>
                      </div>
                    </div>

                    {isEditMode ? (
                      <div className="flex-1 flex flex-col min-h-[500px]">
                        <textarea
                          value={productionNotes}
                          onChange={(e) => setProductionNotes(e.target.value)}
                          placeholder="Enter vocal directions, acoustic resonance cues, and sound design notes..."
                          className="flex-1 w-full bg-[#050811] border border-emerald-500/30 rounded-xl p-5 text-xs font-mono leading-relaxed text-slate-200 focus:outline-none focus:border-emerald-400 resize-none shadow-inner custom-scrollbar"
                        />
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => handleSaveManual(false)}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#050811] border border-white/10 rounded-xl p-6 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text custom-scrollbar overflow-y-auto min-h-[500px]">
                        {productionNotes || "No production notes generated yet. Click 'Manual Edit' to draft guidance."}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SCENE DNA & STRUCTURED FIELDS */}
                {activeTab === 'dna' && (
                  <div className="space-y-6 max-w-4xl pb-10">
                    <div className="bg-[#0e1424] border border-white/10 rounded-2xl p-6 space-y-5">
                      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">Scene Blueprint Metadata</h4>
                          <p className="text-xs text-slate-400">Core dramatic pillars for Scene {selectedSceneNumber}</p>
                        </div>
                        <button
                          onClick={() => handleSaveManual(false)}
                          className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                        >
                          Save DNA
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Scene Title</label>
                          <input
                            type="text"
                            value={sceneTitle}
                            onChange={(e) => setSceneTitle(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Location / Setting</label>
                          <input
                            type="text"
                            value={sceneLocation}
                            onChange={(e) => setSceneLocation(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-300 mb-1">Scene Summary & Premise</label>
                          <textarea
                            value={sceneSummary}
                            onChange={(e) => setSceneSummary(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-sky-400 resize-none h-16"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Dramatic Goal / Want</label>
                          <input
                            type="text"
                            value={dramaticWant}
                            onChange={(e) => setDramaticWant(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Subtext & Underlying Tension</label>
                          <input
                            type="text"
                            value={subtextTension}
                            onChange={(e) => setSubtextTension(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-300 mb-1">Twist or Closing Hook</label>
                          <input
                            type="text"
                            value={twistHook}
                            onChange={(e) => setTwistHook(e.target.value)}
                            className="w-full bg-[#050811] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                          />
                        </div>
                      </div>

                      {/* Key Dialogue Beats */}
                      <div className="border-t border-white/10 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
                            Key Dialogue Beats ({dialogueBeats.length})
                          </label>
                          <button
                            onClick={handleAddBeat}
                            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Beat</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {dialogueBeats.map((beat, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-[#050811] p-2 rounded-lg border border-white/10">
                              <span className="text-slate-500 font-mono text-[10px] w-5 text-center shrink-0">#{idx + 1}</span>
                              <input
                                type="text"
                                value={beat}
                                onChange={(e) => handleUpdateBeat(idx, e.target.value)}
                                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
                              />
                              <button
                                onClick={() => handleDeleteBeat(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: J.A.R.V.I.S. CO-DIRECTOR DRAWER */}
        {jarvisDrawerOpen && (
          <div className="w-80 md:w-96 bg-[#080d1a] border-l border-sky-500/20 flex flex-col shrink-0 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 bg-[#0b1122] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">J.A.R.V.I.S. Co-Director</h4>
                  <p className="text-[10px] text-sky-300 font-mono">CPSD Story Doctor & Refiner</p>
                </div>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="p-3 border-b border-white/10 bg-slate-950/40 flex flex-wrap gap-1.5">
              {quickJarvisChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendJarvisPrompt(chip.prompt)}
                  disabled={isJarvisThinking}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-sky-950 text-slate-300 hover:text-sky-300 border border-white/10 hover:border-sky-500/30 transition-all font-semibold text-left disabled:opacity-50 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
              {jarvisChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                        : 'bg-[#0f1629] text-slate-200 border border-sky-500/30 rounded-bl-none shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px] font-bold">
                      {msg.sender === 'user' ? 'YOU' : 'J.A.R.V.I.S.'}
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                    {/* If message returned updates, show button */}
                    {msg.proposedUpdates && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Updates Applied</span>
                        <button
                          onClick={() => {
                            if (msg.proposedUpdates?.cpsdDocument) setCpsdDoc(msg.proposedUpdates.cpsdDocument);
                            if (msg.proposedUpdates?.cleanNarrativeProse) setRawProse(msg.proposedUpdates.cleanNarrativeProse);
                            if (msg.proposedUpdates?.screenplayScript) setProductionNotes(msg.proposedUpdates.screenplayScript);
                            handleNotify("Re-applied J.A.R.V.I.S. edits to workspace.");
                          }}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20"
                        >
                          Re-Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isJarvisThinking && (
                <div className="flex items-center gap-2 text-sky-400 bg-sky-950/40 p-3 rounded-xl border border-sky-500/30 animate-pulse">
                  <Cpu className="w-4 h-4 animate-spin text-sky-400" />
                  <span className="text-xs font-semibold">J.A.R.V.I.S. is refining scene architecture...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-white/10 bg-[#0b1122]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={jarvisInput}
                  onChange={(e) => setJarvisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendJarvisPrompt();
                    }
                  }}
                  placeholder="Direct JARVIS to refine beats, prose, or tension..."
                  className="flex-1 bg-[#050811] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={() => handleSendJarvisPrompt()}
                  disabled={!jarvisInput.trim() || isJarvisThinking}
                  className="p-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 rounded-xl cursor-pointer transition-all shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
