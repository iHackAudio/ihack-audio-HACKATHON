import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Zap, Trophy, BookOpen, Sliders, CheckCircle2, ArrowRight, 
  RotateCcw, Copy, Check, FileText, Volume2, ShieldCheck, 
  Cpu, MessageSquare, Lock, Unlock, Upload, FileAudio, Users, Layers, Send, RefreshCw,
  Edit, Trash2, Plus, X, Save
} from 'lucide-react';
import { ForgeIdentityView } from './ForgeIdentityView';
import { ArchitectView } from './ArchitectView';
import { StoryBible, CharacterProfile, SceneIdeaMatrixEntry, SceneIdeaItem, BibleScene } from '../types/storyBible';
import { formatSafeText } from '../utils/formatUtils';
import Phase5CinematicScriptPanel from './Phase5CinematicScriptPanel';

interface SimplifiedPipelineDemoProps {
  activePhase?: 1 | 2 | 3 | 4 | 5;
  onPhaseChange?: (phase: 1 | 2 | 3 | 4 | 5) => void;
  onAttachToMainSystem?: () => void;
}

export default function SimplifiedPipelineDemo({
  activePhase: propActivePhase,
  onPhaseChange,
  onAttachToMainSystem
}: SimplifiedPipelineDemoProps) {
  // Navigation & Active Phase
  const [internalPhase, setInternalPhase] = useState<1 | 2 | 3 | 4 | 5>(propActivePhase || 1);

  useEffect(() => {
    if (propActivePhase && propActivePhase !== internalPhase) {
      setInternalPhase(propActivePhase);
    }
  }, [propActivePhase]);

  const activePhase = internalPhase;
  const setActivePhase = (p: 1 | 2 | 3 | 4 | 5) => {
    setInternalPhase(p);
    if (onPhaseChange) {
      onPhaseChange(p);
    }
  };
  const [modelId, setModelId] = useState<string>('gemini-2.5-flash');

  // Story Bible State (Synchronized with backend story_bible.json)
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [isSyncingBible, setIsSyncingBible] = useState<boolean>(false);

  // Phase 1 State (5 Question Intake)
  const [phase1Theme, setPhase1Theme] = useState<string>('');
  const [phase1Characters, setPhase1Characters] = useState<string>('');
  const [phase1Storyline, setPhase1Storyline] = useState<string>('');
  const [phase1Format, setPhase1Format] = useState<string>('');
  const [phase1GenreVibe, setPhase1GenreVibe] = useState<string>('');

  const updateBibleState = async (updates: Partial<StoryBible>, actionName: string, actionDetails: string) => {
    setIsSyncingBible(true);
    try {
      const res = await fetch('/api/bible/update-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, actionName, actionDetails })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.bible) {
          setBible(result.bible);
        }
      }
    } catch (e) {
      console.error("Error updating story bible:", e);
    } finally {
      setIsSyncingBible(false);
    }
  };

  // Phase 1 effect: Suggest & auto-extract characters for Phase 2
  useEffect(() => {
    if (activePhase === 2 && phase1Characters && phase1Characters.length > 3 && (!bible || !bible.characterProfiles || bible.characterProfiles.length === 0)) {
      const timer = setTimeout(async () => {
        setIsExtractingCharacters(true);
        try {
          const res = await fetch('/api/persona/extract-characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              charactersOverview: phase1Characters,
              storylineOverview: phase1Storyline,
              genreVibe: phase1GenreVibe
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.characters && Array.isArray(data.characters) && data.characters.length > 0) {
              const newChars: CharacterProfile[] = data.characters.map((c: any, idx: number) => ({
                id: `char_${Date.now()}_${idx}`,
                name: formatSafeText(c.name || `Character ${idx + 1}`),
                role: c.role || (idx === 0 ? 'protagonist' : 'supporting'),
                age: formatSafeText(c.age || '30s'),
                vocalProfile: formatSafeText(c.vocalProfile || 'Resonant & Clear (en-US)'),
                voiceId: formatSafeText(c.voiceId || 'Kore'),
                background: formatSafeText(c.background || ''),
                speechQuirks: formatSafeText(c.speechQuirks || ''),
                motivations: formatSafeText(c.motivations || ''),
                isLocked: true
              }));

              await updateBibleState(
                { characterProfiles: newChars },
                'Auto-Extracted Character Profiles',
                `System identified and created ${newChars.length} character profile(s) from Phase 1 overview.`
              );
            }
          }
        } catch (err) {
          console.error("Auto character generation failed", err);
        } finally {
          setIsExtractingCharacters(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activePhase, phase1Characters, phase1Storyline]);

  const [isAnalyzingPhase1, setIsAnalyzingPhase1] = useState<boolean>(false);
  const [phase1AnalysisResult, setPhase1AnalysisResult] = useState<{
    concept: {
      title: string;
      hook: string;
      summary: string;
      genre: string;
      tone: string;
      targetEmotion: string;
      format: string;
      corePremiseAndWorld?: string[];
      keyConflictPillars?: string[];
      thematicMotifs?: string[];
      emotionalArcAndStakes?: string[];
      narrativeMilestones?: string[];
    };
    suggestions: string[];
  } | null>(null);

  const [checkedSuggestions, setCheckedSuggestions] = useState<string[]>([]);
  const [userRevisionNotes, setUserRevisionNotes] = useState<string>('');
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  const handleResetPipelineContext = async () => {
    try {
      const res = await fetch('/api/pipeline/reset-context', { method: 'POST' });
      if (res.ok) {
        setPurgeStatus("Context Purged!");
        setTimeout(() => setPurgeStatus(null), 3000);
      }
    } catch (e) {
      console.error("Failed to reset pipeline context:", e);
    }
  };

  // Phase 2 State (Character Creation Mode)
  const [personaSubTab, setPersonaSubTab] = useState<'forge' | 'architect' | 'list'>('list');
  const [architectContext, setArchitectContext] = useState<string>('');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editingCharData, setEditingCharData] = useState<CharacterProfile | null>(null);
  const [isAddingNewChar, setIsAddingNewChar] = useState<boolean>(false);
  const [newCharData, setNewCharData] = useState<Partial<CharacterProfile>>({
    role: 'protagonist',
    voiceId: 'Kore'
  });
  const [isExtractingCharacters, setIsExtractingCharacters] = useState<boolean>(false);

  // Phase 3 State (Scene Matrix 9 Ideas & Custom Scene Builder Chat)
  const [scenePathType, setScenePathType] = useState<'no_plan' | 'have_plan' | 'custom_builder'>('no_plan');
  const [userScenePlan, setUserScenePlan] = useState<string>('');
  const [sceneCustomFocus, setSceneCustomFocus] = useState<string>('');
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState<boolean>(false);
  const [sceneMatrixResult, setSceneMatrixResult] = useState<SceneIdeaMatrixEntry | null>(null);
  const [selectedIdeaItem, setSelectedIdeaItem] = useState<SceneIdeaItem | null>(null);
  const [discussionInput, setDiscussionInput] = useState<string>('');
  const [isDiscussingScene, setIsDiscussingScene] = useState<boolean>(false);

  // Custom Scene Dialogue Flow Builder Chat State
  const [customSceneChatHistory, setCustomSceneChatHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: 'Greetings! I am J.A.R.V.I.S., your Scene & Dialogue Architect. Describe the confrontation, tone, or character interaction you envision, and I will assemble a custom scene dialogue flow for you!' }
  ]);
  const [customSceneChatInput, setCustomSceneChatInput] = useState<string>('');
  const [isCustomSceneChatLoading, setIsCustomSceneChatLoading] = useState<boolean>(false);
  const [customSceneDraft, setCustomSceneDraft] = useState<SceneIdeaItem | null>(null);

  // Phase 4 State (Cinematic Prose Scene Document & Script Generation)
  const [phase4CustomFocus, setPhase4CustomFocus] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [phase4Prose, setPhase4Prose] = useState<string>('');
  const [phase4CpsdDoc, setPhase4CpsdDoc] = useState<string>('');
  const [phase4Screenplay, setPhase4Screenplay] = useState<string>('');
  const [phase4Tab, setPhase4Tab] = useState<'prose' | 'cpsd' | 'screenplay'>('prose');

  // Assistant Chatbot Widget State
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(true);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: 'Hello! I am your AI Co-Writer Assistant. If you ever get stuck on theme, character motivations, or scene ideas, ask me anything!' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Feature Modals & Story Bible Reviewer State
  const [showBibleDrawer, setShowBibleDrawer] = useState<boolean>(false);
  const [bibleDrawerTab, setBibleDrawerTab] = useState<'visual' | 'markdown' | 'json'>('visual');
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [rawMdText, setRawMdText] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importInputText, setImportInputText] = useState<string>('');
  
  const [showCritiqueModal, setShowCritiqueModal] = useState<boolean>(false);
  const [critiqueText, setCritiqueText] = useState<string>('');
  const [isCritiqueLoading, setIsCritiqueLoading] = useState<boolean>(false);

  // Fetch initial Story Bible on load & listen for live updates from JARVIS Copilot
  useEffect(() => {
    fetchStoryBible();

    const handleUpdate = () => {
      fetchStoryBible();
    };

    window.addEventListener('story_bible_updated', handleUpdate);
    window.addEventListener('questionnaire_updated', handleUpdate);
    return () => {
      window.removeEventListener('story_bible_updated', handleUpdate);
      window.removeEventListener('questionnaire_updated', handleUpdate);
    };
  }, []);

  const fetchStoryBible = async () => {
    try {
      const res = await fetch('/api/bible/get');
      if (res.ok) {
        const data = await res.json();
        setBible(data);
        if (data) {
          setRawJsonText(JSON.stringify(data, null, 2));
        }
        if (data.phase1Intake) {
          if (data.phase1Intake.theme) setPhase1Theme(data.phase1Intake.theme);
          if (data.phase1Intake.charactersOverview) setPhase1Characters(data.phase1Intake.charactersOverview);
          if (data.phase1Intake.storylineOverview) setPhase1Storyline(data.phase1Intake.storylineOverview);
          if (data.phase1Intake.format) setPhase1Format(data.phase1Intake.format);
          if (data.phase1Intake.genreVibe) setPhase1GenreVibe(data.phase1Intake.genreVibe);
        }
        if (data.customFocus) setSceneCustomFocus(data.customFocus);
        if (data.phase4CustomFocus) setPhase4CustomFocus(data.phase4CustomFocus);
        if (data.userPlan) setUserScenePlan(data.userPlan);
      }
    } catch (e) {
      console.error("Failed to fetch story bible:", e);
    }
  };

  const handleOpenBibleDrawer = async (tab: 'visual' | 'markdown' | 'json' = 'visual') => {
    setBibleDrawerTab(tab);
    setShowBibleDrawer(true);
    if (bible) {
      setRawJsonText(JSON.stringify(bible, null, 2));
    }
    try {
      const res = await fetch('/api/bible/markdown');
      if (res.ok) {
        const text = await res.text();
        setRawMdText(text);
      }
    } catch (e) {
      console.error("Failed to load bible markdown:", e);
    }
  };

  const handleExportJson = () => {
    if (!bible) return;
    const blob = new Blob([JSON.stringify(bible, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_bible_v${bible.version || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = async () => {
    try {
      const res = await fetch('/api/bible/markdown');
      const md = res.ok ? await res.text() : (rawMdText || '# Story Bible');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `STORY_BIBLE_v${bible?.version || 1}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export MD:", e);
    }
  };

  const handleImportBibleSubmit = async () => {
    if (!importInputText.trim()) return;
    try {
      const res = await fetch('/api/bible/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importInputText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bible) {
          setBible(data.bible);
          setShowImportModal(false);
          setImportInputText('');
        }
      }
    } catch (e) {
      console.error("Import failed:", e);
    }
  };

  const handleRunCritique = async () => {
    setIsCritiqueLoading(true);
    setShowCritiqueModal(true);
    try {
      const res = await fetch('/api/bible/critique', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCritiqueText(data.critique || 'Story Bible review completed successfully.');
      }
    } catch (e) {
      setCritiqueText("Critique generation failed. Please try again.");
    } finally {
      setIsCritiqueLoading(false);
    }
  };

  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      await updateBibleState(parsed, 'Manual JSON Edit', 'Updated Story Bible via Raw JSON Editor');
    } catch (e) {
      alert("Invalid JSON syntax. Please check formatting.");
    }
  };

  // --- PHASE 1 HANDLERS ---
  const handleAnalyzePhase1 = async () => {
    setIsAnalyzingPhase1(true);
    try {
      const res = await fetch('/api/pipeline/phase1-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: phase1Theme,
          charactersOverview: phase1Characters,
          storylineOverview: phase1Storyline,
          format: phase1Format,
          genreVibe: phase1GenreVibe
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPhase1AnalysisResult(data);
      }
    } catch (e) {
      console.error("Phase 1 Analysis failed:", e);
    } finally {
      setIsAnalyzingPhase1(false);
    }
  };

  const handleToggleSuggestion = (s: any) => {
    const text = formatSafeText(s);
    if (checkedSuggestions.includes(text)) {
      setCheckedSuggestions(checkedSuggestions.filter(item => item !== text));
    } else {
      setCheckedSuggestions([...checkedSuggestions, text]);
    }
  };

  const handleLockPhase1 = async () => {
    if (!phase1AnalysisResult) return;

    const updatedConcept = {
      title: phase1AnalysisResult.concept.title,
      hook: phase1AnalysisResult.concept.hook,
      summary: phase1AnalysisResult.concept.summary,
      genre: phase1AnalysisResult.concept.genre,
      tone: phase1AnalysisResult.concept.tone,
      targetEmotion: phase1AnalysisResult.concept.targetEmotion,
      targetAudience: "General Drama Broadcast"
    };

    const phase1IntakeData = {
      theme: phase1Theme,
      charactersOverview: phase1Characters,
      storylineOverview: phase1Storyline,
      format: phase1Format,
      genreVibe: phase1GenreVibe,
      aiSuggestions: phase1AnalysisResult.suggestions,
      checkedSuggestions: checkedSuggestions,
      userRevisionNotes: userRevisionNotes,
      isLocked: true
    };

    await updateBibleState(
      {
        concept: updatedConcept,
        phase1Intake: phase1IntakeData,
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase1: true }
      },
      "Locked Phase 1 Concept Intake",
      `Confirmed Concept: '${updatedConcept.title}'. Locked on Story Bible.`
    );

    setActivePhase(2);
  };

  const handleUnlockPhase1 = async () => {
    await updateBibleState(
      {
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase1: false }
      },
      "Unlocked Phase 1",
      "User opened Phase 1 for non-destructive revisions."
    );
  };

  // --- PHASE 2 HANDLERS ---
  const handleSaveCharacterProfile = async (profileData: Partial<CharacterProfile>) => {
    const newChar: CharacterProfile = {
      id: "char_" + Date.now(),
      name: profileData.name || "New Character",
      age: profileData.age || "30s",
      role: profileData.role || "protagonist",
      vocalProfile: profileData.vocalProfile || "Resonant & Clear",
      voiceId: profileData.voiceId || "Kore",
      background: profileData.background || profileData.motivations || "",
      speechQuirks: profileData.speechQuirks || "",
      motivations: profileData.motivations || "",
      isLocked: true,
      biometricScan: profileData.biometricScan,
      architectPrompt: profileData.architectPrompt
    };

    const existingChars = bible?.characterProfiles || [];
    const updatedChars = [...existingChars, newChar];

    await updateBibleState(
      { characterProfiles: updatedChars },
      "Added Character Persona",
      `Created character profile '${newChar.name}' and locked to Story Bible.`
    );

    setIsAddingNewChar(false);
    setNewCharData({ role: 'protagonist', voiceId: 'Kore' });
    setPersonaSubTab('list');
  };

  const handleUpdateCharacterProfile = async (id: string, updatedFields: Partial<CharacterProfile>) => {
    const existingChars = bible?.characterProfiles || [];
    const updatedChars = existingChars.map(c => c.id === id ? { ...c, ...updatedFields } : c);

    await updateBibleState(
      { characterProfiles: updatedChars },
      "Updated Character Persona",
      `Saved updates for character '${updatedFields.name || id}'.`
    );
    setEditingCharId(null);
    setEditingCharData(null);
  };

  const handleDeleteCharacterProfile = async (id: string, name: string) => {
    const existingChars = bible?.characterProfiles || [];
    const updatedChars = existingChars.filter(c => c.id !== id);

    await updateBibleState(
      { characterProfiles: updatedChars },
      "Deleted Character Persona",
      `Removed character '${name}' from Story Bible.`
    );
  };

  const handleAutoExtractCharacters = async () => {
    if (!phase1Characters || phase1Characters.trim().length === 0) return;
    setIsExtractingCharacters(true);
    try {
      const res = await fetch('/api/persona/extract-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charactersOverview: phase1Characters,
          storylineOverview: phase1Storyline,
          genreVibe: phase1GenreVibe
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.characters && Array.isArray(data.characters) && data.characters.length > 0) {
          const newChars: CharacterProfile[] = data.characters.map((c: any, idx: number) => ({
            id: `char_${Date.now()}_${idx}`,
            name: formatSafeText(c.name || `Character ${idx + 1}`),
            role: c.role || (idx === 0 ? 'protagonist' : 'supporting'),
            age: formatSafeText(c.age || '30s'),
            vocalProfile: formatSafeText(c.vocalProfile || 'Resonant & Clear (en-US)'),
            voiceId: formatSafeText(c.voiceId || 'Kore'),
            background: formatSafeText(c.background || ''),
            speechQuirks: formatSafeText(c.speechQuirks || ''),
            motivations: formatSafeText(c.motivations || ''),
            isLocked: true
          }));

          await updateBibleState(
            { characterProfiles: newChars },
            'Auto-Extracted Characters',
            `Created ${newChars.length} character persona(s) from intake overview.`
          );
        }
      }
    } catch (err) {
      console.error("Auto extract failed:", err);
    } finally {
      setIsExtractingCharacters(false);
    }
  };

  const handleLockPhase2 = async () => {
    await updateBibleState(
      {
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase2: true }
      },
      "Locked Phase 2 Personas",
      `Locked ${bible?.characterProfiles?.length || 0} character profiles to Story Bible.`
    );
    setActivePhase(3);
  };

  const handleUnlockPhase2 = async () => {
    await updateBibleState(
      {
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase2: false }
      },
      "Unlocked Phase 2",
      "User opened Phase 2 for persona revisions."
    );
  };

  // --- PHASE 3 HANDLERS (9-IDEA MATRIX & CUSTOM DIALOGUE BUILDER) ---
  const handleSendCustomSceneChatMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || customSceneChatInput.trim();
    if (!textToSend || isCustomSceneChatLoading) return;

    if (!presetPrompt) setCustomSceneChatInput('');
    const newHistory = [...customSceneChatHistory, { sender: 'user' as const, text: textToSend }];
    setCustomSceneChatHistory(newHistory);
    setIsCustomSceneChatLoading(true);

    try {
      const res = await fetch('/api/pipeline/custom-scene-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          chatHistory: newHistory,
          currentCustomScene: customSceneDraft
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCustomSceneChatHistory([...newHistory, { sender: 'assistant', text: data.replyText || "Custom dialogue flow updated!" }]);
        if (data.customScene) {
          setCustomSceneDraft(data.customScene);
          setSelectedIdeaItem(data.customScene);
        }
      } else {
        setCustomSceneChatHistory([...newHistory, { sender: 'assistant', text: `Error: ${data.error || 'Failed to generate custom scene flow.'}` }]);
      }
    } catch (err: any) {
      setCustomSceneChatHistory([...newHistory, { sender: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setIsCustomSceneChatLoading(false);
    }
  };

  const handleUpdateBeatLine = (index: number, val: string) => {
    if (!customSceneDraft) return;
    const beats = [...(customSceneDraft.keyDialogueBeats || [])];
    beats[index] = val;
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdeaItem?.id === updated.id) {
      setSelectedIdeaItem(updated);
    }
  };

  const handleAddBeatLine = () => {
    if (!customSceneDraft) return;
    const beats = [...(customSceneDraft.keyDialogueBeats || [])];
    beats.push("New character beat / dialogue line...");
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdeaItem?.id === updated.id) {
      setSelectedIdeaItem(updated);
    }
  };

  const handleDeleteBeatLine = (index: number) => {
    if (!customSceneDraft) return;
    const beats = (customSceneDraft.keyDialogueBeats || []).filter((_, i) => i !== index);
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdeaItem?.id === updated.id) {
      setSelectedIdeaItem(updated);
    }
  };

  const handleMoveBeatLine = (index: number, direction: 'up' | 'down') => {
    if (!customSceneDraft) return;
    const beats = [...(customSceneDraft.keyDialogueBeats || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= beats.length) return;
    const temp = beats[index];
    beats[index] = beats[target];
    beats[target] = temp;
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdeaItem?.id === updated.id) {
      setSelectedIdeaItem(updated);
    }
  };

  const handleCustomizeIdeaInChat = (idea: SceneIdeaItem) => {
    setCustomSceneDraft(idea);
    setSelectedIdeaItem(idea);
    setScenePathType('custom_builder');
    setCustomSceneChatHistory(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: `Loaded idea "${idea.title}" into the Custom Dialogue Builder. How would you like to refine or adjust its dialogue flow?`
      }
    ]);
  };

  const handleGenerateSceneMatrix = async () => {
    setIsGeneratingMatrix(true);
    try {
      const res = await fetch('/api/pipeline/scene-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathType: scenePathType,
          userPlan: userScenePlan,
          conceptSummary: bible?.concept?.summary || phase1Storyline,
          customFocus: sceneCustomFocus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSceneMatrixResult(data);
      }
    } catch (e) {
      console.error("Failed to generate scene matrix:", e);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  const handleSelectIdeaItem = (item: SceneIdeaItem) => {
    setSelectedIdeaItem(item);
  };

  const handleSendDiscussion = () => {
    if (!discussionInput.trim() || !sceneMatrixResult) return;

    const userMsg = { id: "msg_" + Date.now(), sender: 'user' as const, text: discussionInput, timestamp: Date.now() };
    const agentReply = {
      id: "msg_" + (Date.now() + 1),
      sender: 'agentC' as const,
      text: `Agent C (Twist Specialist): "Excellent insight! I have incorporated '${discussionInput}' directly into Scene ${sceneMatrixResult.sceneNumber}. This sharpens the emotional hook!"`,
      timestamp: Date.now() + 1
    };

    const updatedNotes = [...(sceneMatrixResult.discussionNotes || []), userMsg, agentReply];
    setSceneMatrixResult({ ...sceneMatrixResult, discussionNotes: updatedNotes });
    setDiscussionInput('');
  };

  const handleAddIdeaToBibleScenes = async (idea: SceneIdeaItem) => {
    const existingScenes = bible?.scenes || [];
    const targetNum = existingScenes.length + 1;

    const newScene: BibleScene = {
      id: `scene_${targetNum}_${Date.now()}`,
      sceneNumber: targetNum,
      title: idea.title,
      location: bible?.locations?.[0]?.name || "Primary Setting",
      charactersInScene: bible?.characterProfiles?.map(c => c.name) || [],
      rawProse: "",
      cpsdDocument: "",
      scriptContent: "",
      summary: idea.summary,
      dramaticWant: idea.dramaticWant,
      subtextAndTension: idea.subtextAndTension,
      keyDialogueBeats: idea.keyDialogueBeats,
      twistOrHook: idea.twistOrHook,
      emotionalTurningPoint: idea.emotionalTurningPoint,
      agentSource: idea.agent,
      selectedIdea: idea,
      status: 'approved',
      updatedAt: Date.now()
    };

    const updatedScenes = [...existingScenes, newScene];

    await updateBibleState(
      { scenes: updatedScenes },
      `Added Scene ${targetNum}: ${idea.title}`,
      `Added suggested idea '${idea.title}' [${idea.agent}] as Scene ${targetNum} to Story Bible.`
    );
  };

  const handleAddMultipleIdeasToBible = async (ideas: SceneIdeaItem[]) => {
    if (!ideas || ideas.length === 0) return;
    const existingScenes = bible?.scenes || [];
    let currentNum = existingScenes.length;

    const newScenes: BibleScene[] = ideas.map((idea, i) => {
      currentNum += 1;
      return {
        id: `scene_${currentNum}_${Date.now()}_${i}`,
        sceneNumber: currentNum,
        title: idea.title,
        location: bible?.locations?.[0]?.name || "Primary Setting",
        charactersInScene: bible?.characterProfiles?.map(c => c.name) || [],
        rawProse: "",
        cpsdDocument: "",
        scriptContent: "",
        summary: idea.summary,
        dramaticWant: idea.dramaticWant,
        subtextAndTension: idea.subtextAndTension,
        keyDialogueBeats: idea.keyDialogueBeats,
        twistOrHook: idea.twistOrHook,
        emotionalTurningPoint: idea.emotionalTurningPoint,
        agentSource: idea.agent,
        selectedIdea: idea,
        status: 'approved',
        updatedAt: Date.now()
      };
    });

    const updatedScenes = [...existingScenes, ...newScenes];

    await updateBibleState(
      { scenes: updatedScenes },
      `Added ${ideas.length} Scenes to Story Bible`,
      `Appended ${ideas.length} suggested scenes to the Story Bible pipeline.`
    );
  };

  const handleLockPhase3 = async (overrideIdea?: SceneIdeaItem) => {
    if (!sceneMatrixResult && !overrideIdea) return;

    const selected = overrideIdea || selectedIdeaItem || sceneMatrixResult?.selectedIdea || sceneMatrixResult?.agentC_ideas?.[0] || sceneMatrixResult?.agentA_ideas?.[0];
    const targetSceneNum = sceneMatrixResult?.sceneNumber || (bible?.scenes?.length ? bible.scenes.length + 1 : 1);

    const lockedEntry: SceneIdeaMatrixEntry = {
      ...(sceneMatrixResult || {
        id: `matrix_${targetSceneNum}`,
        sceneNumber: targetSceneNum,
        title: selected?.title || `Scene ${targetSceneNum}`,
        summary: selected?.summary || '',
        agentA_ideas: [],
        agentB_ideas: [],
        agentC_ideas: [],
        discussionNotes: []
      }),
      selectedIdea: selected,
      isLocked: true
    };

    const existingMatrix = bible?.sceneIdeaMatrix || [];
    const updatedMatrix = [lockedEntry, ...existingMatrix.filter(m => m.sceneNumber !== lockedEntry.sceneNumber)];

    const existingScenes = bible?.scenes || [];
    const existingScene = existingScenes.find(s => s.sceneNumber === targetSceneNum);

    const updatedScene: BibleScene = {
      id: existingScene?.id || `scene_${targetSceneNum}`,
      sceneNumber: targetSceneNum,
      title: selected?.title || lockedEntry.title || `Scene ${targetSceneNum}`,
      location: existingScene?.location || bible?.locations?.[0]?.name || "Primary Setting",
      charactersInScene: existingScene?.charactersInScene || bible?.characterProfiles?.map(c => c.name) || [],
      rawProse: existingScene?.rawProse || "",
      cpsdDocument: existingScene?.cpsdDocument || "",
      scriptContent: existingScene?.scriptContent || "",
      summary: selected?.summary || lockedEntry.summary || "",
      dramaticWant: selected?.dramaticWant,
      subtextAndTension: selected?.subtextAndTension,
      keyDialogueBeats: selected?.keyDialogueBeats,
      twistOrHook: selected?.twistOrHook,
      emotionalTurningPoint: selected?.emotionalTurningPoint,
      agentSource: selected?.agent,
      selectedIdea: selected,
      status: existingScene?.status || 'approved',
      updatedAt: Date.now()
    };

    const updatedScenes = [
      ...existingScenes.filter(s => s.sceneNumber !== targetSceneNum),
      updatedScene
    ].sort((a, b) => a.sceneNumber - b.sceneNumber);

    await updateBibleState(
      {
        sceneIdeaMatrix: updatedMatrix,
        scenes: updatedScenes,
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase3: true }
      },
      "Locked Phase 3 Scene Matrix",
      `Selected idea '${lockedEntry.selectedIdea?.title}' for Scene ${lockedEntry.sceneNumber}.`
    );

    setActivePhase(4);

    if (updatedScene.cpsdDocument) {
      setPhase4CpsdDoc(updatedScene.cpsdDocument);
      setPhase4Prose(updatedScene.rawProse || "");
      setPhase4Screenplay(updatedScene.scriptContent || "");
    } else {
      setPhase4CpsdDoc("");
      setPhase4Prose("");
      setPhase4Screenplay("");
      setTimeout(() => {
        handleGeneratePhase4Script(updatedScene);
      }, 50);
    }
  };

  const handleUnlockPhase3 = async () => {
    await updateBibleState(
      {
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase3: false }
      },
      "Unlocked Phase 3",
      "User opened Phase 3 for scene matrix revisions."
    );
  };

  // --- PHASE 4 HANDLERS (CPSD SCENE DOCUMENT & SCRIPT) ---
  const handleGeneratePhase4Script = async (targetSceneOverride?: BibleScene) => {
    setIsGeneratingScript(true);
    try {
      const primaryChar = bible?.characterProfiles?.[0]?.name || "Protagonist";
      const targetSceneNum = targetSceneOverride?.sceneNumber || sceneMatrixResult?.sceneNumber || (bible?.scenes?.length ? bible.scenes.length : 1);
      const existingScene = targetSceneOverride || bible?.scenes?.find(s => s.sceneNumber === targetSceneNum);
      const latestMatrixEntry = bible?.sceneIdeaMatrix?.find(m => m.sceneNumber === targetSceneNum) || bible?.sceneIdeaMatrix?.[0];
      
      const activeApprovedScene = targetSceneOverride || selectedIdeaItem || existingScene?.selectedIdea || sceneMatrixResult?.selectedIdea || latestMatrixEntry?.selectedIdea || {
        title: existingScene?.title || sceneMatrixResult?.title || `Scene ${targetSceneNum}: ${bible?.concept?.title || 'Inciting Incident'}`,
        summary: existingScene?.summary || bible?.concept?.summary || phase1Storyline || "Characters face a crucial turning point.",
        dramaticWant: existingScene?.dramaticWant || bible?.concept?.hook || "Achieve the primary objective amidst growing pressure.",
        subtextAndTension: existingScene?.subtextAndTension || bible?.concept?.tone || "Unspoken secrets and rising dramatic tension.",
        keyDialogueBeats: existingScene?.keyDialogueBeats || [`${primaryChar}: Explain what is happening.`, "We must decide now."],
        twistOrHook: existingScene?.twistOrHook || bible?.concept?.hook || "A dramatic revelation occurs.",
        sceneNumber: targetSceneNum,
        location: existingScene?.location || bible?.locations?.[0]?.name || "Primary Setting"
      };

      const res = await fetch('/api/pipeline/phase4-generate-cpsd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedScene: activeApprovedScene,
          customFocus: phase4CustomFocus
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cpsdDocument) setPhase4CpsdDoc(data.cpsdDocument);
        if (data.cleanNarrativeProse) setPhase4Prose(data.cleanNarrativeProse);
        if (data.screenplayScript) setPhase4Screenplay(data.screenplayScript);

        const updatedScenes = (bible?.scenes || []).map(s => {
          if (s.sceneNumber === targetSceneNum) {
            return {
              ...s,
              cpsdDocument: data.cpsdDocument || s.cpsdDocument,
              rawProse: data.cleanNarrativeProse || s.rawProse,
              scriptContent: data.screenplayScript || s.scriptContent,
              updatedAt: Date.now()
            };
          }
          return s;
        });

        await updateBibleState(
          { scenes: updatedScenes },
          `Generated CPSD for Scene ${targetSceneNum}`,
          `CPSD blueprint and narrative prose generated for Scene ${targetSceneNum}.`
        );
      }
    } catch (e) {
      console.error("Failed to generate Phase 4 CPSD script:", e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleLockPhase4 = async () => {
    const targetSceneNum = sceneMatrixResult?.sceneNumber || (bible?.scenes?.length ? bible.scenes.length + 1 : 1);
    const latestMatrixEntry = bible?.sceneIdeaMatrix?.find(m => m.sceneNumber === targetSceneNum) || bible?.sceneIdeaMatrix?.[0];
    const activeIdea = selectedIdeaItem || sceneMatrixResult?.selectedIdea || latestMatrixEntry?.selectedIdea;
    const activeTitle = activeIdea?.title || sceneMatrixResult?.title || `Scene ${targetSceneNum}: Approved Scene`;
    const activeLocation = (activeIdea as any)?.location || bible?.locations?.[0]?.name || "Primary Setting";

    const existingScenes = bible?.scenes || [];
    const existingScene = existingScenes.find(s => s.sceneNumber === targetSceneNum);

    const newScene: BibleScene = {
      id: existingScene?.id || `scene_${targetSceneNum}`,
      sceneNumber: targetSceneNum,
      title: activeTitle,
      location: activeLocation,
      charactersInScene: existingScene?.charactersInScene || bible?.characterProfiles?.map(c => c.name) || [],
      rawProse: phase4Prose || existingScene?.rawProse || "",
      cpsdDocument: phase4CpsdDoc || existingScene?.cpsdDocument || "",
      scriptContent: phase4Screenplay || existingScene?.scriptContent || "",
      summary: activeIdea?.summary || existingScene?.summary || sceneMatrixResult?.summary || "Approved scene generated with CPSD blueprint.",
      dramaticWant: activeIdea?.dramaticWant || existingScene?.dramaticWant,
      subtextAndTension: activeIdea?.subtextAndTension || existingScene?.subtextAndTension,
      keyDialogueBeats: activeIdea?.keyDialogueBeats || existingScene?.keyDialogueBeats,
      twistOrHook: activeIdea?.twistOrHook || existingScene?.twistOrHook,
      emotionalTurningPoint: activeIdea?.emotionalTurningPoint || existingScene?.emotionalTurningPoint,
      agentSource: activeIdea?.agent || existingScene?.agentSource,
      selectedIdea: activeIdea,
      status: 'approved' as const,
      updatedAt: Date.now()
    };

    const updatedScenes = [...existingScenes.filter(s => s.sceneNumber !== targetSceneNum), newScene].sort((a, b) => a.sceneNumber - b.sceneNumber);

    await updateBibleState(
      {
        scenes: updatedScenes,
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase4: true }
      },
      "Locked Phase 4 Script & Finalized Story Bible",
      "Master CPSD document, prose, and screenplay locked to Story Bible."
    );

    setActivePhase(5);

    if (onAttachToMainSystem) {
      onAttachToMainSystem();
    }
  };

  const handlePlotNextScene = async () => {
    setSceneMatrixResult(null);
    setSelectedIdeaItem(null);
    setUserScenePlan('');
    setPhase4CpsdDoc('');
    setPhase4Prose('');
    setPhase4Screenplay('');
    setDiscussionInput('');
    await updateBibleState(
      {
        phaseLocks: { ...(bible?.phaseLocks || { phase1: false, phase2: false, phase3: false, phase4: false }), phase3: false, phase4: false }
      },
      "Plotting Next Scene",
      "Cleared scene context to begin plotting the next sequential scene."
    );
    setActivePhase(3);
  };

  // --- ASSISTANT CHATBOT HANDLERS ---
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          modelId,
          activePhase,
          phase4Tab
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.text || 'I am ready to assist with your story!' }]);
        // Live sync: fetch updated Story Bible in case assistant updated any phase input via tool call
        await fetchStoryBible();
      } else {
        throw new Error('Chat request failed');
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: "I'm here to help! For Phase 1, focus on character wants; for Phase 2, upload voice samples or generate system prompts; for Phase 3, review all 9 scene directions!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="h-full w-full bg-[#070b12] text-slate-100 flex flex-col overflow-hidden font-sans relative">
      {/* FEATURE UTILITY TOOLBAR (Story Bible Review, MD, JSON, Export, Import, Sync, AI Assistant) */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0e1322] to-slate-950 border-b border-sky-500/30 px-3 py-1.5 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Toggle Labels */}
          <button
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            title={isToolbarCollapsed ? "Expand Toolbar Labels" : "Collapse to Icons Only"}
          >
            <Sliders className={`w-3 h-3 text-sky-400 transition-transform ${isToolbarCollapsed ? "rotate-90" : ""}`} />
            {!isToolbarCollapsed && <span className="text-[10px]">Hide Labels</span>}
          </button>

          {/* Review Story Bible Modal Trigger */}
          <button
            onClick={() => handleOpenBibleDrawer('visual')}
            className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_6px_rgba(14,165,233,0.15)]"
            title="Review Production Story Bible"
          >
            <BookOpen className="w-3 h-3 text-sky-400" />
            {!isToolbarCollapsed && <span>Review Story Bible</span>}
          </button>

          {/* Export MD */}
          <button
            onClick={handleExportMd}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Download STORY_BIBLE.md"
          >
            <FileText className="w-3 h-3 text-teal-400" />
            {!isToolbarCollapsed && <span>Export MD</span>}
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Download story_bible.json"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            {!isToolbarCollapsed && <span>Export JSON</span>}
          </button>

          {/* Import Bible */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Import JSON or Markdown Story Bible"
          >
            <Upload className="w-3 h-3 text-purple-400" />
            {!isToolbarCollapsed && <span>Import Bible</span>}
          </button>

          {/* AI Critique & Audit */}
          <button
            onClick={handleRunCritique}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Run AI Narrative Audit across all phases"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            {!isToolbarCollapsed && <span>AI Critique</span>}
          </button>

          {/* Purge Context Trigger */}
          <button
            onClick={handleResetPipelineContext}
            className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Purge active scene cache and sub-agent memory across phases"
          >
            <RefreshCw className={`w-3 h-3 text-rose-400 ${purgeStatus ? "animate-spin" : ""}`} />
            {!isToolbarCollapsed && <span>{purgeStatus || "Purge Context"}</span>}
            {isToolbarCollapsed && purgeStatus && <span className="text-[9px] text-rose-400 font-bold ml-1">Cleared</span>}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* J.A.R.V.I.S. Copilot System Manager Launcher */}
          <button
            onClick={() => {
              if (onAttachToMainSystem) {
                onAttachToMainSystem();
              } else {
                window.dispatchEvent(new CustomEvent('toggle_jarvis_copilot'));
              }
            }}
            className="px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40 shadow-[0_0_8px_rgba(14,165,233,0.3)]"
            title="Open J.A.R.V.I.S. Copilot System Manager"
          >
            <MessageSquare className="w-3 h-3 text-sky-400" />
            <span>J.A.R.V.I.S. Copilot</span>
          </button>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-white/5 text-[10px] text-slate-300 font-mono">
            {isSyncingBible ? (
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            <span>v{bible?.version || 1} {isSyncingBible ? "Syncing..." : "Synced"}</span>
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#080c14] flex flex-col justify-between">
        <div className="w-full max-w-none space-y-6">

          {/* ========================================== */}
          {/* PHASE 1: PROJECT INTAKE (5 VISIBLE INPUTS) */}
          {/* ========================================== */}
          {activePhase === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0e1322] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30">
                      Phase 1 — One Form Unified Intake
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">Project Concept & Intake</h2>
                    <p className="text-slate-400 text-xs mt-0.5">All 5 core inputs are visible simultaneously. Click analyze to trigger single-pass AI concept synthesis.</p>
                  </div>

                  {bible?.phaseLocks?.phase1 ? (
                    <button
                      onClick={handleUnlockPhase1}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock & Revise Phase 1</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                      Drafting Intake
                    </span>
                  )}
                </div>

                {/* 5 Visible Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">1. Theme</label>
                    <input
                      type="text"
                      className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      value={phase1Theme}
                      onChange={(e) => setPhase1Theme(e.target.value)}
                      placeholder="e.g. Forbidden Knowledge, Memory Erasure, Isolated Survival"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">2. Characters Overview</label>
                    <input
                      type="text"
                      className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      value={phase1Characters}
                      onChange={(e) => setPhase1Characters(e.target.value)}
                      placeholder="e.g. Dr. Lyra Vane (Archivist), V.A.N.C.E. (AI Station Core)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">3. Storyline Overview</label>
                    <textarea
                      className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none h-20"
                      value={phase1Storyline}
                      onChange={(e) => setPhase1Storyline(e.target.value)}
                      placeholder="e.g. An archivist uncovers encrypted audio logs on a dying orbital station..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">4. Format</label>
                      <input
                        type="text"
                        className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={phase1Format}
                        onChange={(e) => setPhase1Format(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">5. Genre & Vibe</label>
                      <input
                        type="text"
                        className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={phase1GenreVibe}
                        onChange={(e) => setPhase1GenreVibe(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzePhase1}
                    disabled={isAnalyzingPhase1}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:scale-[1.01] transition-all cursor-pointer border border-amber-300 flex items-center justify-center gap-2"
                  >
                    {isAnalyzingPhase1 ? (
                      <>
                        <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                        <span>AI Analyzing All 5 Inputs Simultaneously...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-slate-950" />
                        <span>Analyze & Synthesize Concept</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Analysis Output & Lock Controls */}
                {phase1AnalysisResult && (
                  <div className="pt-6 border-t border-white/10 space-y-5 animate-fadeIn select-text">
                    <div className="bg-[#080c14] p-5 rounded-xl border border-amber-500/30 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">Synthesized Story Concept</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">{phase1AnalysisResult.concept.genre}</span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(phase1AnalysisResult.concept, null, 2), "concept")}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-white/10 cursor-pointer"
                            title="Copy full story concept"
                          >
                            {copiedText === "concept" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-bold">{copiedText === "concept" ? "Copied!" : "Copy Concept"}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{phase1AnalysisResult.concept.title}</h3>
                        <p className="text-xs text-amber-200/90 italic font-medium mt-1">"{phase1AnalysisResult.concept.hook}"</p>
                      </div>

                      <div className="bg-[#0b101d] p-3.5 rounded-lg border border-white/10">
                        <p className="text-xs text-slate-200 leading-relaxed font-normal">{phase1AnalysisResult.concept.summary}</p>
                      </div>

                      {/* Deep Expanded Bullet Point Breakdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* Core Premise & World */}
                        {phase1AnalysisResult.concept.corePremiseAndWorld && (
                          <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">🌍 Core Premise & World</span>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                              {phase1AnalysisResult.concept.corePremiseAndWorld.map((item, idx) => (
                                <li key={idx}><span className="text-slate-200">{formatSafeText(item)}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Conflict Pillars */}
                        {phase1AnalysisResult.concept.keyConflictPillars && (
                          <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">⚡ Key Conflict Pillars</span>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                              {phase1AnalysisResult.concept.keyConflictPillars.map((item, idx) => (
                                <li key={idx}><span className="text-slate-200">{formatSafeText(item)}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Thematic Motifs */}
                        {phase1AnalysisResult.concept.thematicMotifs && (
                          <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">🎨 Thematic Motifs</span>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                              {phase1AnalysisResult.concept.thematicMotifs.map((item, idx) => (
                                <li key={idx}><span className="text-slate-200">{formatSafeText(item)}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Emotional Arc & Stakes */}
                        {phase1AnalysisResult.concept.emotionalArcAndStakes && (
                          <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">🔥 Emotional Arc & High Stakes</span>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                              {phase1AnalysisResult.concept.emotionalArcAndStakes.map((item, idx) => (
                                <li key={idx}><span className="text-slate-200">{formatSafeText(item)}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Narrative Milestones */}
                      {phase1AnalysisResult.concept.narrativeMilestones && (
                        <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">📍 Narrative Milestones (Act Breakdown)</span>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                            {phase1AnalysisResult.concept.narrativeMilestones.map((item, idx) => (
                              <li key={idx}><span className="text-slate-200">{formatSafeText(item)}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Checkbox Strategic Suggestions */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold uppercase text-slate-300">AI Strategic Suggestions (Check to apply)</span>
                      <div className="space-y-2">
                        {phase1AnalysisResult.suggestions.map((s, idx) => {
                          const text = formatSafeText(s);
                          return (
                            <label
                              key={idx}
                              onClick={() => handleToggleSuggestion(s)}
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-xs ${
                                checkedSuggestions.includes(text)
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                                  : 'bg-[#080c14] border-white/10 text-slate-300 hover:border-amber-500/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checkedSuggestions.includes(text)}
                                onChange={() => {}}
                                className="accent-amber-500 w-4 h-4"
                              />
                              <span>{text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revision Request Box */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">What to change? (Type instructions to revise)</label>
                      <input
                        type="text"
                        className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        placeholder="e.g. Make the AI character more sympathetic and increase atmospheric dread..."
                        value={userRevisionNotes}
                        onChange={(e) => setUserRevisionNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end pt-2">
                      <button
                        onClick={handleAnalyzePhase1}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                      >
                        Revise Concept
                      </button>

                      <button
                        onClick={handleLockPhase1}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-slate-950" />
                        <span>Confirm & LOCK Phase 1 on Bible</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 2: ONE-BY-ONE CHARACTER / PERSONA BUILDING ENGINE  */}
          {/* ======================================================== */}
          {activePhase === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0e1322] border border-sky-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/15 px-2.5 py-1 rounded border border-sky-500/30">
                      Phase 2 — Character Persona Creation
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">One-by-One Persona Builder</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Upload audio/video scan under 9MB or use Architect Lab to construct character profiles.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPersonaSubTab('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border ${
                        personaSubTab === 'list' ? 'bg-sky-500 text-slate-950 border-sky-300' : 'bg-slate-900 text-slate-300 border-white/10'
                      }`}
                    >
                      Personas ({bible?.characterProfiles?.length || 0})
                    </button>

                    <button
                      onClick={() => setPersonaSubTab('forge')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border ${
                        personaSubTab === 'forge' ? 'bg-sky-500 text-slate-950 border-sky-300' : 'bg-slate-900 text-slate-300 border-white/10'
                      }`}
                    >
                      🎙️ Forge Audio Scan
                    </button>

                    <button
                      onClick={() => setPersonaSubTab('architect')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border ${
                        personaSubTab === 'architect' ? 'bg-purple-500 text-white border-purple-300' : 'bg-slate-900 text-slate-300 border-white/10'
                      }`}
                    >
                      ⚙️ Architect Lab
                    </button>
                  </div>
                </div>

                {/* SubTab 1: List & Edit Confirmed Personas */}
                {personaSubTab === 'list' && (
                  <div className="space-y-5">
                    {/* Top Action Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080c14] p-3.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-sky-400" />
                          <span>Personas ({bible?.characterProfiles?.length || 0})</span>
                        </span>
                        <button
                          onClick={handleAutoExtractCharacters}
                          disabled={isExtractingCharacters}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isExtractingCharacters ? 'animate-spin text-sky-400' : ''}`} />
                          <span>{isExtractingCharacters ? 'Extracting Personas...' : '✨ Auto-Pick from Intake'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingNewChar(true);
                            setNewCharData({ role: 'protagonist', voiceId: 'Kore' });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>➕ Add Character</span>
                        </button>
                      </div>

                      <button
                        onClick={handleLockPhase2}
                        className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 border border-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)] cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>LOCK Phase 2 & Proceed to Phase 3</span>
                      </button>
                    </div>

                    {/* Form: Add New Character */}
                    {isAddingNewChar && (
                      <div className="bg-[#0b101d] p-5 rounded-xl border border-purple-500/40 space-y-4 shadow-xl animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h4 className="font-black text-purple-300 text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span>Create New Character Persona</span>
                          </h4>
                          <button onClick={() => setIsAddingNewChar(false)} className="text-slate-400 hover:text-white cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Character Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Dr. Lyra Vane"
                              className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                              value={newCharData.name || ''}
                              onChange={(e) => setNewCharData({ ...newCharData, name: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                            <select
                              className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-sky-300 font-bold outline-none focus:border-purple-400"
                              value={newCharData.role || 'protagonist'}
                              onChange={(e) => setNewCharData({ ...newCharData, role: e.target.value as any })}
                            >
                              <option value="protagonist">Protagonist</option>
                              <option value="antagonist">Antagonist</option>
                              <option value="supporting">Supporting</option>
                              <option value="narrator">Narrator</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini TTS Voice</label>
                            <select
                              className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-purple-300 font-bold outline-none focus:border-purple-400 font-mono"
                              value={newCharData.voiceId || 'Kore'}
                              onChange={(e) => setNewCharData({ ...newCharData, voiceId: e.target.value })}
                            >
                              <option value="Kore">Kore (Firm / Warm Female)</option>
                              <option value="Puck">Puck (Energetic / Clear Male)</option>
                              <option value="Charon">Charon (Deep / Authoritative Male)</option>
                              <option value="Fenrir">Fenrir (Intense / Resonant Male)</option>
                              <option value="Zephyr">Zephyr (Bright / Smooth Female)</option>
                              <option value="Aoede">Aoede (Expressive / Dramatic Female)</option>
                              <option value="Orpheus">Orpheus (Calm / Narrative Male)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vocal Profile & Tone</label>
                            <input
                              type="text"
                              placeholder="e.g. Low, Resonant & Controlled Urgency (en-US)"
                              className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400"
                              value={newCharData.vocalProfile || ''}
                              onChange={(e) => setNewCharData({ ...newCharData, vocalProfile: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age & Backstory Summary</label>
                            <input
                              type="text"
                              placeholder="e.g. 34 — Isolated Archivist on Station Echo-9"
                              className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400"
                              value={newCharData.background || ''}
                              onChange={(e) => setNewCharData({ ...newCharData, background: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Speech Quirks & Delivery Style</label>
                          <input
                            type="text"
                            placeholder="e.g. Rate: 1.0x | Pitch: +0Hz. Deliberate technical pauses before emotional disclosures."
                            className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400"
                            value={newCharData.speechQuirks || ''}
                            onChange={(e) => setNewCharData({ ...newCharData, speechQuirks: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivations / Persona System Prompt</label>
                          <textarea
                            rows={2}
                            placeholder="System instruction prompt for character emotional delivery..."
                            className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400 resize-none"
                            value={newCharData.motivations || ''}
                            onChange={(e) => setNewCharData({ ...newCharData, motivations: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setIsAddingNewChar(false)}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveCharacterProfile(newCharData)}
                            className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Character Profile</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Character List Grid */}
                    {(!bible?.characterProfiles || bible.characterProfiles.length === 0) ? (
                      <div className="p-8 text-center bg-[#080c14] rounded-xl border border-white/10 space-y-3">
                        <Users className="w-8 h-8 text-sky-400 mx-auto" />
                        <p className="text-xs text-slate-300">No characters locked yet. Auto-pick from intake or use Forge Audio Scan!</p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleAutoExtractCharacters}
                            disabled={isExtractingCharacters}
                            className="px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30 cursor-pointer flex items-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4 text-sky-400" />
                            <span>Auto-Pick Characters from Intake</span>
                          </button>
                          <button
                            onClick={() => setIsAddingNewChar(true)}
                            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4 text-purple-400" />
                            <span>Create Custom Character</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bible.characterProfiles.map((c, i) => {
                          const isEditing = editingCharId === c.id;

                          if (isEditing && editingCharData) {
                            return (
                              <div key={c.id || i} className="bg-[#0c1220] p-4 rounded-xl border border-sky-500/50 space-y-3 col-span-1 md:col-span-2 shadow-lg">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                  <h4 className="font-bold text-sky-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit Character: {formatSafeText(c.name)}</span>
                                  </h4>
                                  <button onClick={() => { setEditingCharId(null); setEditingCharData(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                                    <input
                                      type="text"
                                      className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-sky-400"
                                      value={editingCharData.name || ''}
                                      onChange={(e) => setEditingCharData({ ...editingCharData, name: e.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                                    <select
                                      className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-bold outline-none focus:border-sky-400"
                                      value={editingCharData.role || 'protagonist'}
                                      onChange={(e) => setEditingCharData({ ...editingCharData, role: e.target.value as any })}
                                    >
                                      <option value="protagonist">Protagonist</option>
                                      <option value="antagonist">Antagonist</option>
                                      <option value="supporting">Supporting</option>
                                      <option value="narrator">Narrator</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini TTS Voice</label>
                                    <select
                                      className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-bold outline-none focus:border-sky-400 font-mono"
                                      value={editingCharData.voiceId || 'Kore'}
                                      onChange={(e) => setEditingCharData({ ...editingCharData, voiceId: e.target.value })}
                                    >
                                      <option value="Kore">Kore (Firm / Warm Female)</option>
                                      <option value="Puck">Puck (Energetic / Clear Male)</option>
                                      <option value="Charon">Charon (Deep / Authoritative Male)</option>
                                      <option value="Fenrir">Fenrir (Intense / Resonant Male)</option>
                                      <option value="Zephyr">Zephyr (Bright / Smooth Female)</option>
                                      <option value="Aoede">Aoede (Expressive / Dramatic Female)</option>
                                      <option value="Orpheus">Orpheus (Calm / Narrative Male)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vocal Profile & Tone</label>
                                    <input
                                      type="text"
                                      className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-400"
                                      value={editingCharData.vocalProfile || ''}
                                      onChange={(e) => setEditingCharData({ ...editingCharData, vocalProfile: e.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age & Backstory</label>
                                    <input
                                      type="text"
                                      className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-400"
                                      value={editingCharData.background || ''}
                                      onChange={(e) => setEditingCharData({ ...editingCharData, background: e.target.value })}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Speech Quirks & Pacing</label>
                                  <input
                                    type="text"
                                    className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-400"
                                    value={editingCharData.speechQuirks || ''}
                                    onChange={(e) => setEditingCharData({ ...editingCharData, speechQuirks: e.target.value })}
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivations / System Prompt</label>
                                  <textarea
                                    rows={2}
                                    className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-400 resize-none"
                                    value={editingCharData.motivations || ''}
                                    onChange={(e) => setEditingCharData({ ...editingCharData, motivations: e.target.value })}
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => { setEditingCharId(null); setEditingCharData(null); }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCharacterProfile(c.id, editingCharData)}
                                    className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          const roleColors: Record<string, string> = {
                            protagonist: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                            antagonist: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                            supporting: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                            narrator: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          };

                          return (
                            <div key={c.id || i} className="bg-[#080c14] p-4 rounded-xl border border-white/10 space-y-3 hover:border-white/20 transition-all group">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-white text-base">{formatSafeText(c.name)}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleColors[c.role || 'protagonist'] || roleColors.protagonist}`}>
                                      {formatSafeText(c.role || 'protagonist')}
                                    </span>
                                  </div>
                                  {c.background && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{formatSafeText(c.background)}</p>
                                  )}
                                </div>

                                <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 text-[10px] font-mono font-bold uppercase border border-purple-500/30 shrink-0">
                                  Voice: {formatSafeText(c.voiceId || 'Kore')}
                                </span>
                              </div>

                              {c.vocalProfile && (
                                <div className="bg-[#0d1322] p-2 rounded-lg border border-white/5 text-xs text-slate-300 space-y-1">
                                  <span className="text-[9px] font-bold text-sky-400 uppercase block">Gemini TTS Profile</span>
                                  <p className="font-medium">{formatSafeText(c.vocalProfile)}</p>
                                </div>
                              )}

                              {c.speechQuirks && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  <span className="font-bold text-slate-300">Quirks & Delivery: </span>
                                  {formatSafeText(c.speechQuirks)}
                                </p>
                              )}

                              {c.motivations && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  <span className="font-bold text-slate-300">Motivations: </span>
                                  {formatSafeText(c.motivations)}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <button
                                  onClick={() => {
                                    setArchitectContext(`Refine persona for character ${c.name}: ${c.vocalProfile}. Background: ${c.background}. Motivations: ${c.motivations}`);
                                    setPersonaSubTab('architect');
                                  }}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>⚙️ Architect Lab</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCharId(c.id);
                                      setEditingCharData({ ...c });
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/10"
                                  >
                                    <Edit className="w-3 h-3 text-sky-400" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteCharacterProfile(c.id, c.name)}
                                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer border border-rose-500/20"
                                    title="Delete Character"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SubTab 2: Forge Identity Audio Scan */}
                {personaSubTab === 'forge' && (
                  <ForgeIdentityView
                    modelId={modelId}
                    onModelChange={setModelId}
                    onSaveProfile={handleSaveCharacterProfile}
                    onSendToArchitect={(ctx) => {
                      setArchitectContext(ctx);
                      setPersonaSubTab('architect');
                    }}
                  />
                )}

                {/* SubTab 3: Architect Lab System Prompt Engine */}
                {personaSubTab === 'architect' && (
                  <ArchitectView
                    modelId={modelId}
                    onModelChange={setModelId}
                    initialContext={architectContext}
                    onSave={handleSaveCharacterProfile}
                    onBack={() => setPersonaSubTab('list')}
                  />
                )}
              </div>
            </div>
          )}

          {/* =============================================== */}
          {/* PHASE 3: SCENE IDEA MATRIX (9 IDEAS BY AGENTS)  */}
          {/* =============================================== */}
          {activePhase === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0e1322] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/15 px-2.5 py-1 rounded border border-purple-500/30">
                      Phase 3 — 9-Idea Multi-Agent Matrix
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">Scene Matrix Engine <span className="text-purple-400 text-lg ml-2">(Drafting Scene {(bible?.scenes?.length || 0) + 1})</span></h2>
                    <p className="text-slate-400 text-xs mt-0.5">Agent A (3 Ideas), Agent B (3 Ideas), and Agent C (3 Combined Twisted Ideas).</p>
                    {bible?.scenes && bible.scenes.length > 0 && (
                      <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-purple-200">
                          <strong>AI Context Linked:</strong> Sub-agents are synced with the <strong>{bible.scenes.length}</strong> previously plotted scenes from your Story Bible.
                        </span>
                      </div>
                    )}
                  </div>

                  {bible?.phaseLocks?.phase3 ? (
                    <button
                      onClick={handleUnlockPhase3}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Phase 3</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                      Drafting Scene Matrix
                    </span>
                  )}
                </div>

                {/* Path Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setScenePathType('no_plan')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      scenePathType === 'no_plan'
                        ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-[#080c14] border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-purple-200 flex items-center justify-between">
                      <span>Path A: No Plan</span>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">AI agents generate 9 distinct scene directions from concept.</div>
                  </button>

                  <button
                    onClick={() => setScenePathType('have_plan')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      scenePathType === 'have_plan'
                        ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-[#080c14] border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-purple-200 flex items-center justify-between">
                      <span>Path B: Quick Plan</span>
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Provide scene notes & let Agent C expand into 9 directions.</div>
                  </button>

                  <button
                    onClick={() => setScenePathType('custom_builder')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      scenePathType === 'custom_builder'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-[#080c14] border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-amber-300 flex items-center justify-between">
                      <span>Path C: Custom Scene Chat</span>
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Discuss & build custom scene dialogue flow step-by-step with J.A.R.V.I.S.</div>
                  </button>
                </div>

                {scenePathType === 'have_plan' && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">Enter Custom Scene Plan / Notes</label>
                    <textarea
                      className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 resize-none h-20"
                      placeholder={`Describe what should happen in Scene ${(bible?.scenes?.length || 0) + 1}...`}
                      value={userScenePlan}
                      onChange={(e) => setUserScenePlan(e.target.value)}
                    />
                  </div>
                )}

                {scenePathType !== 'custom_builder' && (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1 flex items-center justify-between">
                        <span>AI Focus & Craft Directives (Optional)</span>
                        <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Cinematic Focus</span>
                      </label>
                      <textarea
                        className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 resize-none h-16"
                        placeholder="e.g. Focus on building plot momentum, slow-burn curiosity, character wants, establishing atmosphere, and subtle unsaid dialogue subtext..."
                        value={sceneCustomFocus}
                        onChange={(e) => setSceneCustomFocus(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleGenerateSceneMatrix}
                      disabled={isGeneratingMatrix}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-slate-950 font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-[1.01] transition-all cursor-pointer border border-purple-300 flex items-center justify-center gap-2"
                    >
                      {isGeneratingMatrix ? (
                        <>
                          <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Generating 9 Ideas Across Agent A, B, and C...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Generate 9-Idea Matrix</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Path C: Interactive Custom Scene & Dialogue Flow Builder Panel */}
                {scenePathType === 'custom_builder' && (
                  <div className="bg-[#080c14] p-5 rounded-2xl border border-amber-500/30 space-y-6 shadow-2xl animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-amber-400" />
                          <h3 className="text-lg font-black text-white">Custom Scene & Dialogue Flow Builder</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Chat with J.A.R.V.I.S. to craft custom dialogue flow, character wants, and subtext, then fine-tune line-by-line beats.
                        </p>
                      </div>
                      
                      {customSceneDraft && (
                        <button
                          onClick={() => handleLockPhase3(customSceneDraft)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>LOCK Custom Scene & Draft CPSD</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column (6 cols): J.A.R.V.I.S. Discussion Chat Box */}
                      <div className="lg:col-span-6 bg-[#0d1322] p-4 rounded-xl border border-white/10 flex flex-col h-[520px]">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-amber-400" />
                            <span>Dialogue Director Chat (J.A.R.V.I.S.)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5 font-mono">
                            Interactive Flow
                          </span>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar my-3 space-y-3 pr-1 text-xs">
                          {customSceneChatHistory.map((m, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl leading-relaxed ${
                                m.sender === 'user'
                                  ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 ml-8'
                                  : 'bg-[#080c14] text-slate-200 border border-white/10 mr-8'
                              }`}
                            >
                              <div className="text-[9px] font-black uppercase text-slate-400 mb-1">
                                {m.sender === 'user' ? 'You' : 'J.A.R.V.I.S. Director'}
                              </div>
                              <div className="whitespace-pre-wrap">{m.text}</div>
                            </div>
                          ))}
                          {isCustomSceneChatLoading && (
                            <div className="p-3 bg-[#080c14] rounded-xl text-amber-300 italic flex items-center gap-2 border border-white/10">
                              <Cpu className="w-4 h-4 animate-spin text-amber-400" />
                              <span>J.A.R.V.I.S. is designing custom dialogue flow & scene beats...</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Prompt Presets */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <button
                            onClick={() => handleSendCustomSceneChatMessage("Build a tense interrogation scene with layered subtext and reluctant confession.")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-200 px-2 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                          >
                            ⚡ Interrogation
                          </button>
                          <button
                            onClick={() => handleSendCustomSceneChatMessage("Create a sudden betrayal scene where unspoken secrets break the alliance.")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-rose-200 px-2 py-1 rounded-lg border border-rose-500/20 cursor-pointer"
                          >
                            🗡️ Betrayal
                          </button>
                          <button
                            onClick={() => handleSendCustomSceneChatMessage("Design a quiet, atmospheric dialogue with heavy unsaid tension and a shocking end reveal.")}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-200 px-2 py-1 rounded-lg border border-sky-500/20 cursor-pointer"
                          >
                            🌌 Subtext Reveal
                          </button>
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <input
                            type="text"
                            className="flex-1 bg-[#080c14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            placeholder="Describe dialogue flow, character lines, or tone instructions..."
                            value={customSceneChatInput}
                            onChange={(e) => setCustomSceneChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCustomSceneChatMessage()}
                          />
                          <button
                            onClick={() => handleSendCustomSceneChatMessage()}
                            disabled={isCustomSceneChatLoading}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Discuss</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Column (6 cols): Live Custom Scene Card & Line-by-Line Dialogue Beats Editor */}
                      <div className="lg:col-span-6 bg-[#0d1322] p-4 rounded-xl border border-amber-500/20 space-y-4 overflow-y-auto max-h-[520px] custom-scrollbar">
                        {!customSceneDraft ? (
                          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl space-y-3">
                            <MessageSquare className="w-8 h-8 text-amber-400/50 mx-auto" />
                            <h4 className="text-sm font-bold text-slate-300">No Custom Scene Active Yet</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Type your scene instructions in the chat box on the left, or click <strong>"💬 Refine Dialogue"</strong> on any matrix card below to build your custom scene dialogue flow!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Active Custom Scene Draft</span>
                              </span>
                              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                                {customSceneDraft.keyDialogueBeats?.length || 0} Dialogue Beats
                              </span>
                            </div>

                            {/* Title & Summary Editable */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Scene Title</label>
                                <input
                                  type="text"
                                  className="w-full bg-[#080c14] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                                  value={customSceneDraft.title}
                                  onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, title: e.target.value })}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Narrative Summary</label>
                                <textarea
                                  className="w-full bg-[#080c14] border border-white/15 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none h-16"
                                  value={customSceneDraft.summary}
                                  onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, summary: e.target.value })}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-purple-300 mb-1">Target Goal (Want)</label>
                                  <input
                                    type="text"
                                    className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-amber-400"
                                    value={customSceneDraft.dramaticWant || ''}
                                    onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, dramaticWant: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-rose-300 mb-1">Subtext & Tension</label>
                                  <input
                                    type="text"
                                    className="w-full bg-[#080c14] border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-amber-400"
                                    value={customSceneDraft.subtextAndTension || ''}
                                    onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, subtextAndTension: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Line-By-Line Dialogue Flow Editor */}
                            <div className="bg-[#080c14] p-3 rounded-xl border border-white/10 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Line-By-Line Dialogue Beats Flow</span>
                                </span>
                                <button
                                  onClick={handleAddBeatLine}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Beat</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(!customSceneDraft.keyDialogueBeats || customSceneDraft.keyDialogueBeats.length === 0) ? (
                                  <p className="text-[11px] text-slate-500 italic p-2">No dialogue beats added yet. Click "Add Beat" above or ask J.A.R.V.I.S. in chat!</p>
                                ) : (
                                  customSceneDraft.keyDialogueBeats.map((beat, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-1.5 bg-[#0d1322] p-1.5 rounded-lg border border-white/10">
                                      <span className="text-[10px] font-mono text-slate-500 w-4 text-center">{bIdx + 1}</span>
                                      
                                      <input
                                        type="text"
                                        className="flex-1 bg-[#080c14] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                                        value={beat}
                                        onChange={(e) => handleUpdateBeatLine(bIdx, e.target.value)}
                                      />

                                      <div className="flex items-center gap-0.5">
                                        <button
                                          onClick={() => handleMoveBeatLine(bIdx, 'up')}
                                          disabled={bIdx === 0}
                                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer text-[10px]"
                                          title="Move Line Up"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          onClick={() => handleMoveBeatLine(bIdx, 'down')}
                                          disabled={bIdx === (customSceneDraft.keyDialogueBeats?.length || 1) - 1}
                                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer text-[10px]"
                                          title="Move Line Down"
                                        >
                                          ▼
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBeatLine(bIdx)}
                                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                                          title="Delete Line"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => handleLockPhase3(customSceneDraft)}
                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                <span>LOCK & Draft CPSD (Phase 4)</span>
                              </button>
                              <button
                                onClick={() => handleAddIdeaToBibleScenes(customSceneDraft)}
                                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-xs font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>+ Story Bible</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 9 Ideas Matrix Display */}
                {sceneMatrixResult && (
                  <div className="pt-6 border-t border-white/10 space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{sceneMatrixResult.title} — 9 Ideas Matrix</h3>
                      <button
                        onClick={() => handleLockPhase3()}
                        className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>LOCK Selected Scene & Draft CPSD</span>
                      </button>
                    </div>

                    {/* Batch Multi-Scene Actions Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#080c14] p-3 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-slate-300 mr-2 uppercase tracking-wider flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 text-purple-400" />
                        <span>Multi-Scene Quick Add:</span>
                      </span>
                      <button
                        onClick={() => handleAddMultipleIdeasToBible(sceneMatrixResult.agentC_ideas)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-purple-300" />
                        <span>Add All 3 Agent C Ideas as Scenes</span>
                      </button>
                      <button
                        onClick={() => handleAddMultipleIdeasToBible(sceneMatrixResult.agentA_ideas)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-300" />
                        <span>Add All 3 Agent A Ideas as Scenes</span>
                      </button>
                      <button
                        onClick={() => handleAddMultipleIdeasToBible([...sceneMatrixResult.agentA_ideas, ...sceneMatrixResult.agentB_ideas, ...sceneMatrixResult.agentC_ideas])}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Add All 9 Ideas to Story Bible</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Agent A Column */}
                      <div className="bg-[#080c14] p-4.5 rounded-xl border border-blue-500/30 space-y-3.5">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-sm font-black uppercase tracking-wide text-blue-400">Agent A (Dramatic Realism)</span>
                          <span className="text-xs text-slate-400">3 Ideas</span>
                        </div>
                        {sceneMatrixResult.agentA_ideas.map((idea) => (
                          <div
                            key={idea.id}
                            onClick={() => handleSelectIdeaItem(idea)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer text-sm space-y-2.5 select-text ${
                              selectedIdeaItem?.id === idea.id
                                ? 'bg-blue-500/20 border-blue-400 text-white shadow-lg ring-1 ring-blue-400/50'
                                : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-blue-500/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-sm md:text-base text-blue-300 tracking-wide">{idea.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(`${idea.title}\n${idea.summary}\nWant: ${idea.dramaticWant || ''}\nSubtext: ${idea.subtextAndTension || ''}`, `idea_${idea.id}`);
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="Copy Scene Idea"
                              >
                                {copiedText === `idea_${idea.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">{idea.summary}</p>
                            
                            {/* Expanded Details */}
                            {idea.dramaticWant && (
                              <div className="text-xs md:text-sm text-slate-200 bg-[#080c14] p-3 rounded-lg border border-white/10 space-y-1.5">
                                <p><strong className="text-blue-400 font-bold">Target Goal:</strong> {idea.dramaticWant}</p>
                                {idea.subtextAndTension && <p><strong className="text-rose-400 font-bold">Underlying Tension:</strong> {idea.subtextAndTension}</p>}
                                {idea.keyDialogueBeats && idea.keyDialogueBeats.length > 0 && (
                                  <div>
                                    <strong className="text-amber-300 block mb-1 font-bold">Key Dialogue Beats:</strong>
                                    <ul className="list-disc list-inside space-y-1 italic text-slate-300 font-normal">
                                      {idea.keyDialogueBeats.map((b, bi) => <li key={bi}>"{b}"</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Direct Card Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockPhase3(idea);
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Draft CPSD</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomizeIdeaInChat(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Refine dialogue flow in chat"
                              >
                                <MessageSquare className="w-3 h-3 text-amber-300" />
                                <span>Refine Dialogue</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddIdeaToBibleScenes(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Add this idea as a scene to the Story Bible outline"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+ Bible</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Agent B Column */}
                      <div className="bg-[#080c14] p-4.5 rounded-xl border border-teal-500/30 space-y-3.5">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-sm font-black uppercase tracking-wide text-teal-400">Agent B (Atmospheric Dread)</span>
                          <span className="text-xs text-slate-400">3 Ideas</span>
                        </div>
                        {sceneMatrixResult.agentB_ideas.map((idea) => (
                          <div
                            key={idea.id}
                            onClick={() => handleSelectIdeaItem(idea)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer text-sm space-y-2.5 select-text ${
                              selectedIdeaItem?.id === idea.id
                                ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg ring-1 ring-teal-400/50'
                                : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-teal-500/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-sm md:text-base text-teal-300 tracking-wide">{idea.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(`${idea.title}\n${idea.summary}\nWant: ${idea.dramaticWant || ''}\nSubtext: ${idea.subtextAndTension || ''}`, `idea_${idea.id}`);
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="Copy Scene Idea"
                              >
                                {copiedText === `idea_${idea.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">{idea.summary}</p>

                            {/* Expanded Details */}
                            {idea.dramaticWant && (
                              <div className="text-xs md:text-sm text-slate-200 bg-[#080c14] p-3 rounded-lg border border-white/10 space-y-1.5">
                                <p><strong className="text-teal-400 font-bold">Target Goal:</strong> {idea.dramaticWant}</p>
                                {idea.subtextAndTension && <p><strong className="text-rose-400 font-bold">Underlying Tension:</strong> {idea.subtextAndTension}</p>}
                                {idea.keyDialogueBeats && idea.keyDialogueBeats.length > 0 && (
                                  <div>
                                    <strong className="text-amber-300 block mb-1 font-bold">Key Dialogue Beats:</strong>
                                    <ul className="list-disc list-inside space-y-1 italic text-slate-300 font-normal">
                                      {idea.keyDialogueBeats.map((b, bi) => <li key={bi}>"{b}"</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Direct Card Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockPhase3(idea);
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Draft CPSD</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomizeIdeaInChat(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Refine dialogue flow in chat"
                              >
                                <MessageSquare className="w-3 h-3 text-amber-300" />
                                <span>Refine Dialogue</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddIdeaToBibleScenes(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Add this idea as a scene to the Story Bible outline"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+ Bible</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Agent C Column (Twisted) */}
                      <div className="bg-[#080c14] p-4.5 rounded-xl border border-purple-500/30 space-y-3.5">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-sm font-black uppercase tracking-wide text-purple-400">Agent C (Master + Twist)</span>
                          <span className="text-xs text-slate-400">3 Twisted Ideas</span>
                        </div>
                        {sceneMatrixResult.agentC_ideas.map((idea) => (
                          <div
                            key={idea.id}
                            onClick={() => handleSelectIdeaItem(idea)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer text-sm space-y-2.5 select-text ${
                              selectedIdeaItem?.id === idea.id
                                ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50'
                                : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-purple-500/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-sm md:text-base text-purple-300 tracking-wide">{idea.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(`${idea.title}\n${idea.summary}\nTwist: ${idea.twistOrHook || ''}\nWant: ${idea.dramaticWant || ''}`, `idea_${idea.id}`);
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="Copy Scene Idea"
                              >
                                {copiedText === `idea_${idea.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">{idea.summary}</p>
                            
                            {idea.twistOrHook && (
                              <div className="text-xs md:text-sm font-bold text-amber-300 bg-amber-500/15 p-2.5 rounded-lg border border-amber-500/30">
                                ⚡ {idea.twistOrHook}
                              </div>
                            )}

                            {/* Expanded Details */}
                            {idea.dramaticWant && (
                              <div className="text-xs md:text-sm text-slate-200 bg-[#080c14] p-3 rounded-lg border border-white/10 space-y-1.5">
                                <p><strong className="text-purple-400 font-bold">Target Goal:</strong> {idea.dramaticWant}</p>
                                {idea.subtextAndTension && <p><strong className="text-rose-400 font-bold">Underlying Tension:</strong> {idea.subtextAndTension}</p>}
                                {idea.keyDialogueBeats && idea.keyDialogueBeats.length > 0 && (
                                  <div>
                                    <strong className="text-amber-300 block mb-1 font-bold">Key Dialogue Beats:</strong>
                                    <ul className="list-disc list-inside space-y-1 italic text-slate-300 font-normal">
                                      {idea.keyDialogueBeats.map((b, bi) => <li key={bi}>"{b}"</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Direct Card Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockPhase3(idea);
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Draft CPSD</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomizeIdeaInChat(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Refine dialogue flow in chat"
                              >
                                <MessageSquare className="w-3 h-3 text-amber-300" />
                                <span>Refine Dialogue</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddIdeaToBibleScenes(idea);
                                }}
                                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Add this idea as a scene to the Story Bible outline"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+ Bible</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Per-Scene Discussion Panel */}
                    <div className="bg-[#080c14] p-4 rounded-xl border border-white/10 space-y-3">
                      <span className="text-xs font-bold text-slate-300 uppercase">Scene Discussion & Refinement Panel (Chat with Agent C)</span>
                      
                      <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-[#0d1322] rounded-lg border border-white/5 text-xs">
                        {(!sceneMatrixResult.discussionNotes || sceneMatrixResult.discussionNotes.length === 0) ? (
                          <p className="text-slate-500 italic">No notes yet. Type a refinement instruction below to discuss this scene with Agent C.</p>
                        ) : (
                          sceneMatrixResult.discussionNotes.map((msg) => (
                            <div key={msg.id} className={`p-2 rounded-lg ${msg.sender === 'user' ? 'bg-purple-500/20 text-purple-200 ml-6' : 'bg-slate-900 text-slate-200 mr-6'}`}>
                              <span className="font-bold text-[10px] uppercase block text-slate-400 mb-0.5">{msg.sender === 'user' ? 'You' : 'Agent C'}</span>
                              <span>{msg.text}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                          placeholder="Ask Agent C to adjust this scene or swap a twist..."
                          value={discussionInput}
                          onChange={(e) => setDiscussionInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendDiscussion()}
                        />
                        <button
                          onClick={handleSendDiscussion}
                          className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 4: CINEMATIC PROSE SCENE DOCUMENT (CPSD) & SCRIPT   */}
          {/* ========================================================= */}
          {activePhase === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0e1322] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30">
                      Phase 4 — Scene Document (CPSD) & Script
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">Cinematic Prose Scene Document <span className="text-emerald-400 text-lg ml-2">(Scene {sceneMatrixResult?.sceneNumber || (bible?.scenes?.length || 1)}: {selectedIdeaItem?.title || sceneMatrixResult?.title || (bible?.scenes && bible.scenes.length > 0 ? bible.scenes[bible.scenes.length - 1].title : 'Active Scene')})</span></h2>
                    <p className="text-slate-400 text-xs mt-0.5">Synthesizes CPSD blueprint, clean narrative prose, and audio screenplay for approved Phase 3 scene.</p>
                    {bible?.scenes && bible.scenes.length > 0 && (
                      <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-200">
                          <strong>AI Context Linked:</strong> Scene generation is synced with the <strong>{bible.scenes.length}</strong> previously plotted scenes from your Story Bible.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPhase4Tab('cpsd')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                        phase4Tab === 'cpsd' ? 'bg-purple-500 text-white border-purple-300 font-extrabold shadow-md' : 'bg-slate-900 text-slate-300 border-white/10 hover:border-purple-400/40'
                      }`}
                    >
                      📑 CPSD Document (Master)
                    </button>

                    <button
                      onClick={() => setPhase4Tab('prose')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                        phase4Tab === 'prose' ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold shadow-md' : 'bg-slate-900 text-slate-300 border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      📄 Raw Story Prose
                    </button>

                    <button
                      onClick={() => setPhase4Tab('screenplay')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                        phase4Tab === 'screenplay' ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-extrabold shadow-md' : 'bg-slate-900 text-slate-300 border-white/10 hover:border-emerald-400/40'
                      }`}
                    >
                      💡 Suggestions & Notes
                    </button>
                  </div>
                </div>

                {!phase4Prose && !phase4CpsdDoc && !phase4Screenplay ? (
                  <div className="p-8 text-center bg-[#080c14] rounded-xl border border-white/10 space-y-4">
                    <Trophy className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-white">Generate CPSD Scene Document</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Synthesizes Scene Document for the approved scene from Phase 3 using the Cinematic Prose Scene Document (CPSD) structure.
                      </p>
                    </div>

                    <div className="text-left max-w-md mx-auto">
                      <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1 flex items-center justify-between">
                        <span>CPSD & Prose Craft Focus (Optional)</span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Oscar Craft Focus</span>
                      </label>
                      <textarea
                        className="w-full bg-[#030712] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none h-16"
                        placeholder="e.g. Focus on deep psychological subtext, sensory bridges, rhythmic dialogue pacing, and lingering exit aftermath..."
                        value={phase4CustomFocus}
                        onChange={(e) => setPhase4CustomFocus(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => handleGeneratePhase4Script()}
                      disabled={isGeneratingScript}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-[1.01] transition-all cursor-pointer flex items-center gap-2 mx-auto"
                    >
                      {isGeneratingScript ? (
                        <>
                          <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Executing CPSD Scene Generation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Generate CPSD Scene Document (Phase 4)</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 bg-[#080c14] p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                          {selectedIdeaItem?.title || sceneMatrixResult?.title || (bible?.scenes?.length ? `Scene ${bible.scenes.length + 1}` : "Scene 1")} — {phase4Tab === 'cpsd' ? 'CPSD Document' : phase4Tab === 'prose' ? 'Raw Story Prose' : 'Audio Screenplay'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const activeText = phase4Tab === 'cpsd' ? phase4CpsdDoc : phase4Tab === 'prose' ? phase4Prose : phase4Screenplay;
                            handleCopy(activeText, `phase4_${phase4Tab}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 cursor-pointer"
                        >
                          {copiedText === `phase4_${phase4Tab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{copiedText === `phase4_${phase4Tab}` ? 'Copied!' : 'Copy Text'}</span>
                        </button>

                        {bible?.phaseLocks?.phase4 ? (
                          <button
                            onClick={handlePlotNextScene}
                            className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase flex items-center gap-1.5 border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Plot Next Scene</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleLockPhase4}
                            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 border border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>LOCK & Finalize Story Bible</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#070b12] p-5 rounded-xl border border-white/15 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar select-text">
                      {phase4Tab === 'cpsd' && (phase4CpsdDoc || "Generating CPSD Document...")}
                      {phase4Tab === 'prose' && (phase4Prose || "Generating Raw Narrative Prose...")}
                      {phase4Tab === 'screenplay' && (phase4Screenplay || "Generating Audio Screenplay...")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePhase === 5 && (
            <div className="space-y-6 animate-fadeIn">
               <Phase5CinematicScriptPanel 
                 bible={bible} 
                 setBible={setBible} 
               />
            </div>
          )}
        </div>

        {/* REVISION HISTORY LOG AT BOTTOM */}
        <div className="w-full mt-6 bg-[#0a0e1a] p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              Revision Log
            </span>
            <span>Latest: {bible?.revisionHistory?.[0]?.action || "Pipeline Ready"}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {bible?.revisionHistory?.[0]?.timestamp ? new Date(bible.revisionHistory[0].timestamp).toLocaleTimeString() : 'Initial'}
          </span>
        </div>
      </div>

      {/* STORY BIBLE REVIEW DRAWER / MODAL */}
      {showBibleDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#080c14] border-l border-sky-500/30 h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 bg-[#0d1322] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Production Story Bible
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                      v{bible?.version || 1} Synced
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Unified Story Bible across Phase 1 Intake, Personas, Matrix & Phase 4 CPSD Documents.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMd}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-bold border border-teal-500/30 cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Export .json</span>
                </button>
                <button
                  onClick={() => setShowBibleDrawer(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tab Selectors */}
            <div className="flex border-b border-white/10 bg-[#0a0e19] px-4 gap-2 shrink-0">
              <button
                onClick={() => setBibleDrawerTab('visual')}
                className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
                  bibleDrawerTab === 'visual'
                    ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Visual Overview
              </button>
              <button
                onClick={() => setBibleDrawerTab('markdown')}
                className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
                  bibleDrawerTab === 'markdown'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📄 Markdown (STORY_BIBLE.md)
              </button>
              <button
                onClick={() => setBibleDrawerTab('json')}
                className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
                  bibleDrawerTab === 'json'
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Raw JSON (story_bible.json)
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {bibleDrawerTab === 'visual' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Concept & Logline */}
                  <div className="bg-[#0d1322] p-5 rounded-2xl border border-sky-500/30 space-y-3">
                    <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Concept & Logline (Phase 1)</span>
                    <h2 className="text-xl font-black text-white">{bible?.concept?.title || 'Untitled Project'}</h2>
                    <p className="text-sm text-slate-300 leading-relaxed font-serif italic">"{bible?.concept?.logline || 'No logline defined.'}"</p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-xs">
                      <span className="bg-slate-900 px-2.5 py-1 rounded border border-white/10 text-slate-300 font-mono">Format: {bible?.concept?.format || 'Audio Drama'}</span>
                      <span className="bg-slate-900 px-2.5 py-1 rounded border border-white/10 text-slate-300 font-mono">Genre: {bible?.concept?.genreVibe || 'Sci-Fi'}</span>
                    </div>
                  </div>

                  {/* Character Bibles */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Character Bibles ({bible?.characterProfiles?.length || 0})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(bible?.characterProfiles || []).map((c, i) => (
                        <div key={i} className="bg-[#0d1322] p-4 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-sm">{c.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">{c.role}</span>
                          </div>
                          <p className="text-xs text-slate-400">{c.background}</p>
                          <div className="text-[10px] font-mono text-sky-300 bg-sky-500/10 p-2 rounded border border-sky-500/20">
                            Voice ID: {c.voiceId || 'Kore'} | Profile: {c.vocalProfile}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scene Matrix Entries */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Scene Matrix Entries ({bible?.sceneIdeaMatrix?.length || 0})</span>
                    </h3>
                    <div className="space-y-3">
                      {(bible?.sceneIdeaMatrix || []).map((m, i) => (
                        <div key={i} className="bg-[#0d1322] p-4 rounded-xl border border-purple-500/20 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-purple-300 text-sm">Scene {m.sceneNumber}: {m.selectedIdea?.title || m.title}</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Approved Matrix Idea</span>
                          </div>
                          <p className="text-xs text-slate-300">{m.selectedIdea?.summary || m.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final CPSD Approved Scenes */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span>Phase 4 Master CPSD Documents ({bible?.scenes?.length || 0})</span>
                    </h3>
                    <div className="space-y-3">
                      {(bible?.scenes || []).map((s, i) => (
                        <div key={i} className="bg-[#0d1322] p-4 rounded-xl border border-emerald-500/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-300 text-sm">{s.title}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-mono">Approved CPSD</span>
                          </div>
                          <p className="text-xs text-slate-400">{s.summary}</p>
                          {s.cpsdDocument && (
                            <details className="text-xs text-slate-300 bg-[#080c14] p-3 rounded-lg border border-white/10 mt-2">
                              <summary className="font-bold text-emerald-400 cursor-pointer">View CPSD Blueprint Document</summary>
                              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">{s.cpsdDocument}</pre>
                            </details>
                          )}
                          {s.rawProse && (
                            <details className="text-xs text-slate-300 bg-[#080c14] p-3 rounded-lg border border-white/10 mt-2">
                              <summary className="font-bold text-amber-400 cursor-pointer">View Narrative Prose</summary>
                              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">{s.rawProse}</pre>
                            </details>
                          )}
                          {s.scriptContent && (
                            <details className="text-xs text-slate-300 bg-[#080c14] p-3 rounded-lg border border-white/10 mt-2">
                              <summary className="font-bold text-sky-400 cursor-pointer">View Screenplay Script</summary>
                              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">{s.scriptContent}</pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bibleDrawerTab === 'markdown' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center bg-[#0d1322] p-3 rounded-xl border border-white/10">
                    <span className="text-xs font-mono text-teal-300 font-bold">STORY_BIBLE.md Content</span>
                    <button
                      onClick={() => handleCopy(rawMdText, 'drawer_md')}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/10"
                    >
                      {copiedText === 'drawer_md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'drawer_md' ? 'Copied MD' : 'Copy Markdown'}</span>
                    </button>
                  </div>
                  <textarea
                    className="w-full h-[500px] bg-[#070b12] border border-white/15 rounded-xl p-4 text-xs font-mono text-teal-100 focus:outline-none focus:border-teal-400 leading-relaxed resize-none custom-scrollbar"
                    value={rawMdText}
                    onChange={(e) => setRawMdText(e.target.value)}
                  />
                </div>
              )}

              {bibleDrawerTab === 'json' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center bg-[#0d1322] p-3 rounded-xl border border-white/10">
                    <span className="text-xs font-mono text-emerald-300 font-bold">story_bible.json State</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveRawJson}
                        className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => handleCopy(rawJsonText, 'drawer_json')}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/10"
                      >
                        {copiedText === 'drawer_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'drawer_json' ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="w-full h-[500px] bg-[#070b12] border border-white/15 rounded-xl p-4 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400 leading-relaxed resize-none custom-scrollbar"
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT STORY BIBLE MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0d1322] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white">Import Story Bible Data</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">Paste JSON string or raw text to load or sync into `story_bible.json` and `STORY_BIBLE.md`.</p>
            <textarea
              className="w-full h-56 bg-[#070b12] border border-white/15 rounded-xl p-3 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-400 resize-none custom-scrollbar"
              placeholder="Paste JSON object here..."
              value={importInputText}
              onChange={(e) => setImportInputText(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button onClick={handleImportBibleSubmit} className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CRITIQUE & AUDIT MODAL */}
      {showCritiqueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0d1322] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">AI Story Bible Audit & Critique</h3>
              </div>
              <button onClick={() => setShowCritiqueModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#070b12] rounded-xl border border-white/10 text-xs leading-relaxed text-amber-100 whitespace-pre-wrap select-text">
              {isCritiqueLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Cpu className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p>Running multi-phase AI narrative analysis across intake, personas, matrix, and CPSD scenes...</p>
                </div>
              ) : (
                critiqueText
              )}
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button onClick={() => setShowCritiqueModal(false)} className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase cursor-pointer">
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
