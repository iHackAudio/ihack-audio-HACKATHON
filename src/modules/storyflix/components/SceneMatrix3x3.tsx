import React, { useState } from 'react';
import { Grid, Sparkles, MessageSquare, Send, Cpu, Check, Copy, Plus, Lock, ArrowRight, Layers, FileText, Trash2, Edit3 } from 'lucide-react';
import { SceneIdeaItem, SceneMatrix3x3Result, StoryFlixBible, BibleScene } from '../types/storyFlix';
import { generate3x3SceneMatrix, chatWithSceneDirector, generateCpsdAndProse } from '../services/storyFlixApi';

interface SceneMatrix3x3Props {
  bible: StoryFlixBible;
  onLockSceneToBible: (scene: BibleScene, matrixResult: SceneMatrix3x3Result) => Promise<void>;
  onBatchAddScenes: (scenes: BibleScene[]) => Promise<void>;
  onProceedToCpsd?: () => void;
  onSelectSceneForCpsd?: (scene: BibleScene) => void;
}

export const SceneMatrix3x3: React.FC<SceneMatrix3x3Props> = ({
  bible,
  onLockSceneToBible,
  onBatchAddScenes,
  onProceedToCpsd,
  onSelectSceneForCpsd
}) => {
  const nextSceneNumber = bible.scenes.length + 1;

  const [pathType, setPathType] = useState<'no_plan' | 'have_plan' | 'custom_builder'>('no_plan');
  const [userPlan, setUserPlan] = useState('');
  const [customFocus, setCustomFocus] = useState('Build plot momentum, high-friction subtext, and clear stakes.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [matrixResult, setMatrixResult] = useState<SceneMatrix3x3Result | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<SceneIdeaItem | null>(null);

  // Director Chat & Line-by-line editor state
  const [customSceneDraft, setCustomSceneDraft] = useState<SceneIdeaItem | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Greetings! I am J.A.R.V.I.S., your Scene & Dialogue Director. I am ready to formulate Scene ${nextSceneNumber} using our 3x3 Multi-Agent Matrix!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSynthesizingCpsd, setIsSynthesizingCpsd] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateMatrix = async () => {
    setIsGenerating(true);
    try {
      const result = await generate3x3SceneMatrix({
        pathType,
        userPlan,
        conceptSummary: bible.concept.summary,
        customFocus
      });
      result.sceneNumber = nextSceneNumber;
      setMatrixResult(result);
      if (result.agentC_ideas?.[0]) {
        setSelectedIdea(result.agentC_ideas[0]);
      }
    } catch (err) {
      console.error('Failed to generate 3x3 matrix:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendDirectorChat = async (presetPrompt?: string) => {
    const text = presetPrompt || chatInput.trim();
    if (!text || isChatLoading) return;

    if (!presetPrompt) setChatInput('');
    const newHist = [...chatHistory, { sender: 'user' as const, text }];
    setChatHistory(newHist);
    setIsChatLoading(true);

    try {
      const data = await chatWithSceneDirector({
        userMessage: text,
        chatHistory: newHist,
        currentCustomScene: customSceneDraft || selectedIdea
      });

      setChatHistory([...newHist, { sender: 'assistant', text: data.replyText || 'Scene adjusted!' }]);
      if (data.customScene) {
        setCustomSceneDraft(data.customScene);
        setSelectedIdea(data.customScene);
      }
    } catch (err: any) {
      setChatHistory([...newHist, { sender: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCustomizeInDirectorChat = (idea: SceneIdeaItem) => {
    setCustomSceneDraft(idea);
    setSelectedIdea(idea);
    setPathType('custom_builder');
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: `Loaded idea "${idea.title}" into the Custom Dialogue Builder. How would you like to refine the dialogue flow or dramatic beats?`
      }
    ]);
  };

  const handleUpdateBeat = (idx: number, val: string) => {
    if (!customSceneDraft) return;
    const beats = [...(customSceneDraft.keyDialogueBeats || [])];
    beats[idx] = val;
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdea?.id === updated.id) setSelectedIdea(updated);
  };

  const handleAddBeat = () => {
    if (!customSceneDraft) return;
    const beats = [...(customSceneDraft.keyDialogueBeats || []), 'New dialogue line or character action...'];
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdea?.id === updated.id) setSelectedIdea(updated);
  };

  const handleDeleteBeat = (idx: number) => {
    if (!customSceneDraft) return;
    const beats = (customSceneDraft.keyDialogueBeats || []).filter((_, i) => i !== idx);
    const updated = { ...customSceneDraft, keyDialogueBeats: beats };
    setCustomSceneDraft(updated);
    if (selectedIdea?.id === updated.id) setSelectedIdea(updated);
  };

  const handleLockAndDraftCpsd = async (ideaToLock?: SceneIdeaItem) => {
    const chosen = ideaToLock || customSceneDraft || selectedIdea || matrixResult?.agentC_ideas?.[0];
    if (!chosen) return;

    setIsSynthesizingCpsd(true);
    try {
      const targetScene: Partial<BibleScene> = {
        sceneNumber: nextSceneNumber,
        title: chosen.title,
        location: bible.concept.title ? 'Command Bridge / Primary Sector' : 'Scene Location',
        charactersInScene: bible.characterProfiles.slice(0, 2).map(c => c.name),
        summary: chosen.summary,
        dramaticWant: chosen.dramaticWant,
        subtextAndTension: chosen.subtextAndTension,
        keyDialogueBeats: chosen.keyDialogueBeats,
        twistOrHook: chosen.twistOrHook,
        emotionalTurningPoint: chosen.emotionalTurningPoint,
        agentSource: chosen.agent,
        status: 'approved'
      };

      const cpsdData = await generateCpsdAndProse({
        approvedScene: targetScene,
        customFocus
      });

      const finalScene: BibleScene = {
        id: `sc_${nextSceneNumber}_${Date.now()}`,
        sceneNumber: nextSceneNumber,
        title: chosen.title,
        location: targetScene.location || 'Primary Setting',
        charactersInScene: targetScene.charactersInScene || [],
        summary: chosen.summary,
        dramaticWant: chosen.dramaticWant,
        subtextAndTension: chosen.subtextAndTension,
        keyDialogueBeats: chosen.keyDialogueBeats,
        twistOrHook: chosen.twistOrHook,
        emotionalTurningPoint: chosen.emotionalTurningPoint,
        agentSource: chosen.agent,
        cpsdDocument: cpsdData.cpsdDocument || '',
        rawProse: cpsdData.cleanNarrativeProse || '',
        status: 'approved',
        updatedAt: Date.now()
      };

      const finalMatrix: SceneMatrix3x3Result = matrixResult || {
        sceneNumber: nextSceneNumber,
        title: chosen.title,
        agentA_ideas: [],
        agentB_ideas: [],
        agentC_ideas: [chosen],
        selectedIdea: chosen
      };

      await onLockSceneToBible(finalScene, finalMatrix);
      setMatrixResult(null);
      setSelectedIdea(null);
      setCustomSceneDraft(null);
      setUserPlan('');
      if (onProceedToCpsd) {
        onProceedToCpsd();
      }
    } catch (err) {
      console.error('Failed to lock scene and synthesize CPSD:', err);
    } finally {
      setIsSynthesizingCpsd(false);
    }
  };

  const handleBatchAdd = async (ideas: SceneIdeaItem[]) => {
    if (!ideas || ideas.length === 0) return;
    let currentNum = bible.scenes.length;
    const newScenes: BibleScene[] = ideas.map((idea, i) => {
      currentNum += 1;
      return {
        id: `sc_${currentNum}_${Date.now()}_${i}`,
        sceneNumber: currentNum,
        title: idea.title,
        location: 'Setting',
        charactersInScene: bible.characterProfiles.slice(0, 2).map(c => c.name),
        summary: idea.summary,
        dramaticWant: idea.dramaticWant,
        subtextAndTension: idea.subtextAndTension,
        keyDialogueBeats: idea.keyDialogueBeats,
        twistOrHook: idea.twistOrHook,
        emotionalTurningPoint: idea.emotionalTurningPoint,
        agentSource: idea.agent,
        status: 'approved',
        updatedAt: Date.now()
      };
    });

    await onBatchAddScenes(newScenes);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0e1322] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Step Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/15 px-2.5 py-1 rounded border border-purple-500/30">
              StoryFlix • Step 3
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              3×3 Multi-Agent Scene Matrix <span className="text-purple-400 font-mono text-lg">(Drafting Scene {nextSceneNumber})</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Agent A (Dramatic Realism), Agent B (Atmospheric Tension), and Agent C (Twisted Synthesis) generate 9 distinct directions.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl text-xs text-purple-300 font-bold">
            Total Story Bible Scenes: {bible.scenes.length}
          </div>
        </div>

        {/* 3 Path Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setPathType('no_plan')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              pathType === 'no_plan'
                ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-[#080c14] border-white/10 text-slate-400'
            }`}
          >
            <div className="font-extrabold text-sm text-purple-200 flex items-center justify-between">
              <span>Path A: No Plan</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">AI generates 9 divergent directions from premise and active characters.</div>
          </button>

          <button
            onClick={() => setPathType('have_plan')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              pathType === 'have_plan'
                ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-[#080c14] border-white/10 text-slate-400'
            }`}
          >
            <div className="font-extrabold text-sm text-purple-200 flex items-center justify-between">
              <span>Path B: Specific Plan</span>
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Provide scene notes for Agent C to expand with twisted variations.</div>
          </button>

          <button
            onClick={() => setPathType('custom_builder')}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              pathType === 'custom_builder'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-[#080c14] border-white/10 text-slate-400'
            }`}
          >
            <div className="font-extrabold text-sm text-amber-300 flex items-center justify-between">
              <span>Path C: Director Chat</span>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Collaborate directly with J.A.R.V.I.S. in live director mode.</div>
          </button>
        </div>

        {pathType === 'have_plan' && (
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
              Enter Specific Scene Plan / Directive
            </label>
            <textarea
              className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 resize-none h-20"
              placeholder={`Describe what should happen in Scene ${nextSceneNumber}...`}
              value={userPlan}
              onChange={(e) => setUserPlan(e.target.value)}
            />
          </div>
        )}

        {pathType !== 'custom_builder' && (
          <button
            onClick={handleGenerateMatrix}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-slate-950 font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-[1.005] transition-all cursor-pointer border border-purple-300 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running 3x3 Multi-Agent Matrix (Agent A, B, C)...</span>
              </>
            ) : (
              <>
                <Grid className="w-4 h-4 text-slate-950" />
                <span>Generate 3×3 Scene Matrix</span>
              </>
            )}
          </button>
        )}

        {/* Path C: Interactive Director Chat & Line-by-Line Beats Editor */}
        {pathType === 'custom_builder' && (
          <div className="bg-[#080c14] p-5 rounded-2xl border border-amber-500/30 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Scene Dialogue Flow Director (J.A.R.V.I.S.)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Chat with J.A.R.V.I.S. to refine subtext, tensions, and adjust line-by-line dialogue beats.
                </p>
              </div>

              <button
                onClick={() => handleLockAndDraftCpsd()}
                disabled={isSynthesizingCpsd}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer border border-amber-300 flex items-center gap-1.5 shadow-md"
              >
                {isSynthesizingCpsd ? <Cpu className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Lock Scene & Synthesize CPSD</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chat Column */}
              <div className="lg:col-span-6 bg-[#0d1322] p-4 rounded-xl border border-white/10 flex flex-col h-[480px]">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs custom-scrollbar">
                  {chatHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 ml-6'
                          : 'bg-[#080c14] text-slate-200 border border-white/10 mr-6'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                        {m.sender === 'user' ? 'You' : 'J.A.R.V.I.S. Director'}
                      </span>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="p-3 bg-[#080c14] rounded-xl text-amber-300 italic flex items-center gap-2 border border-white/10 text-xs">
                      <Cpu className="w-4 h-4 animate-spin text-amber-400" />
                      <span>J.A.R.V.I.S. is refining dialogue flow...</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10 mt-2">
                  <input
                    type="text"
                    className="flex-1 bg-[#080c14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    placeholder="Type instructions or adjustments for this scene..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendDirectorChat()}
                  />
                  <button
                    onClick={() => handleSendDirectorChat()}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>

              {/* Line-by-Line Beats Editor */}
              <div className="lg:col-span-6 bg-[#0d1322] p-4 rounded-xl border border-amber-500/20 space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Dialogue Beats & Stakes
                  </span>
                  <button
                    onClick={handleAddBeat}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Beat</span>
                  </button>
                </div>

                {customSceneDraft ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title</label>
                      <input
                        type="text"
                        className="w-full bg-[#080c14] border border-white/15 rounded px-2 py-1 text-xs text-white font-bold outline-none focus:border-amber-400"
                        value={customSceneDraft.title}
                        onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Summary</label>
                      <textarea
                        className="w-full bg-[#080c14] border border-white/15 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-400 resize-none h-16"
                        value={customSceneDraft.summary}
                        onChange={(e) => setCustomSceneDraft({ ...customSceneDraft, summary: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Line-by-Line Beats:</span>
                      {customSceneDraft.keyDialogueBeats?.map((beat, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5 bg-[#080c14] p-1.5 rounded border border-white/10">
                          <span className="text-[10px] font-mono text-slate-500 w-4">{bIdx + 1}</span>
                          <input
                            type="text"
                            className="flex-1 bg-transparent border-none text-xs text-white outline-none"
                            value={beat}
                            onChange={(e) => handleUpdateBeat(bIdx, e.target.value)}
                          />
                          <button
                            onClick={() => handleDeleteBeat(bIdx)}
                            className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 text-center">
                    Select a scene idea from the 3x3 matrix below or click "Refine Dialogue" on any card!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3x3 Matrix Grid Output */}
        {matrixResult && (
          <div className="pt-6 border-t border-white/10 space-y-6 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="text-base font-bold text-white">
                3×3 Matrix Options for Scene {nextSceneNumber}
              </h3>

              <button
                onClick={() => handleLockAndDraftCpsd()}
                disabled={isSynthesizingCpsd}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                {isSynthesizingCpsd ? (
                  <>
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing CPSD & Story Bible...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lock Scene & Synthesize CPSD</span>
                  </>
                )}
              </button>
            </div>

            {/* Batch Multi-Scene Quick Add Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-[#080c14] p-3 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-slate-300 mr-2 uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Multi-Scene Quick Add:</span>
              </span>
              <button
                onClick={() => handleBatchAdd(matrixResult.agentC_ideas)}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>Add All 3 Agent C Ideas</span>
              </button>
              <button
                onClick={() => handleBatchAdd(matrixResult.agentA_ideas)}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-blue-300" />
                <span>Add All 3 Agent A Ideas</span>
              </button>
              <button
                onClick={() => handleBatchAdd([...matrixResult.agentA_ideas, ...matrixResult.agentB_ideas, ...matrixResult.agentC_ideas])}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Add All 9 Ideas to Story Bible</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Agent A Column */}
              <div className="bg-[#080c14] p-4 rounded-xl border border-blue-500/30 space-y-3">
                <span className="text-xs font-black uppercase text-blue-400 block border-b border-white/10 pb-1.5">
                  Agent A (Dramatic Realism)
                </span>
                {matrixResult.agentA_ideas.map((idea) => (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 select-text ${
                      selectedIdea?.id === idea.id
                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-md'
                        : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-black text-xs text-blue-300">{idea.title}</h5>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyText(idea.summary, idea.id); }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      >
                        {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3">{idea.summary}</p>
                    {idea.dramaticWant && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-blue-300">Goal:</strong> {idea.dramaticWant}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLockAndDraftCpsd(idea); }}
                        className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                      >
                        Lock CPSD
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCustomizeInDirectorChat(idea); }}
                        className="py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent B Column */}
              <div className="bg-[#080c14] p-4 rounded-xl border border-teal-500/30 space-y-3">
                <span className="text-xs font-black uppercase text-teal-400 block border-b border-white/10 pb-1.5">
                  Agent B (Atmospheric Tension)
                </span>
                {matrixResult.agentB_ideas.map((idea) => (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 select-text ${
                      selectedIdea?.id === idea.id
                        ? 'bg-teal-500/20 border-teal-400 text-white shadow-md'
                        : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-black text-xs text-teal-300">{idea.title}</h5>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyText(idea.summary, idea.id); }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      >
                        {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3">{idea.summary}</p>
                    {idea.subtextAndTension && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-teal-300">Subtext:</strong> {idea.subtextAndTension}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLockAndDraftCpsd(idea); }}
                        className="flex-1 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                      >
                        Lock CPSD
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCustomizeInDirectorChat(idea); }}
                        className="py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent C Column */}
              <div className="bg-[#080c14] p-4 rounded-xl border border-purple-500/30 space-y-3">
                <span className="text-xs font-black uppercase text-purple-400 block border-b border-white/10 pb-1.5">
                  Agent C (Twisted Synthesis)
                </span>
                {matrixResult.agentC_ideas.map((idea) => (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 select-text ${
                      selectedIdea?.id === idea.id
                        ? 'bg-purple-500/20 border-purple-400 text-white shadow-md'
                        : 'bg-[#0d1322] border-white/10 text-slate-200 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-black text-xs text-purple-300">{idea.title}</h5>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyText(idea.summary, idea.id); }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      >
                        {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3">{idea.summary}</p>
                    {idea.twistOrHook && (
                      <div className="text-[11px] text-amber-300 font-bold bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                        ⚡ {idea.twistOrHook}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLockAndDraftCpsd(idea); }}
                        className="flex-1 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                      >
                        Lock CPSD
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCustomizeInDirectorChat(idea); }}
                        className="py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plotted Scenes Locked in Story Bible & CPSD */}
        {bible.scenes.length > 0 && (
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Plotted Scenes Locked in CPSD ({bible.scenes.length})</span>
              </h4>
              {onProceedToCpsd && (
                <button
                  onClick={onProceedToCpsd}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/30"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Step 4: CPSD Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {bible.scenes.map((s) => (
                <div key={s.id} className="bg-[#080c14] p-3 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white">Scene {s.sceneNumber}: {s.title}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{s.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      CPSD Synced
                    </span>
                    {onProceedToCpsd && (
                      <button
                        onClick={() => {
                          if (onSelectSceneForCpsd) onSelectSceneForCpsd(s);
                          onProceedToCpsd();
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 text-xs font-bold border border-sky-500/40 cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit in CPSD</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
