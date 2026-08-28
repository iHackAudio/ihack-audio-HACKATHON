import React, { useState, useEffect } from 'react';
import { StoryBible } from '../types/storyBible';
import { Play, Sparkles, MessageSquare, Edit3, Volume2, CheckCircle2, RefreshCw, FileText, Save, Bot, ChevronRight, Award, Send, Code, Eye, Wand2 } from 'lucide-react';

interface LineComment {
  id: string;
  lineId: string;
  lineText: string;
  instruction: string;
  createdAt: number;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: number;
}

export default function ScriptOptimizationPanel() {
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [approvedProse, setApprovedProse] = useState<string>('');
  
  // Dual Editor Modes: 'manual' (Direct text typing) or 'visual' (Line inspector & comments)
  const [editorMode, setEditorMode] = useState<'manual' | 'visual'>('manual');
  
  // Raw script text for manual editing
  const [rawText, setRawText] = useState<string>('');

  const [scriptLines, setScriptLines] = useState<{ id: string; text: string }[]>([]);

  // Sync scriptLines whenever rawText changes or mounts
  useEffect(() => {
    const rawLines = rawText.split('\n');
    const parsed = rawLines.map((line: string, idx: number) => ({
      id: `L${idx + 1}`,
      text: line
    }));
    setScriptLines(parsed);
  }, [rawText]);

  // Inline Line Editing State (for Visual mode)
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState<string>('');

  const [slotA, setSlotA] = useState<string>('');
  const [slotB, setSlotB] = useState<string>('');
  const [slotC, setSlotC] = useState<string>('');
  const [jarvisFinal, setJarvisFinal] = useState<string>('');
  const [jarvisScore, setJarvisScore] = useState<number | null>(8.8);
  const [jarvisReport, setJarvisReport] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Right Sidebar Tab: 'chat' | 'jarvis' | 'comments'
  const [rightTab, setRightTab] = useState<'chat' | 'jarvis' | 'comments'>('chat');

  // AI Script Agent Chat State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: 'msg-init',
      sender: 'jarvis',
      text: "Greetings. I am J.A.R.V.I.S., your Script Editor Agent. Chat with me to make any live edits, re-writes, or formatting changes to your script in real time.",
      timestamp: Date.now()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Line comment & Targeted Rewrite State
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [comments, setComments] = useState<LineComment[]>([]);
  const [newCommentInput, setNewCommentInput] = useState<string>('');
  const [isRewritingLine, setIsRewritingLine] = useState<boolean>(false);
  
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  // Audio Playback State
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBible();
  }, []);

  const loadSceneState = (activeScene: any) => {
    if (activeScene.scriptContent) {
       setRawText(activeScene.scriptContent);
       setApprovedProse(activeScene.rawProse || '');
    } else if (activeScene.rawProse) {
       setRawText(activeScene.rawProse);
       setApprovedProse(activeScene.rawProse);
    } else {
       setRawText('');
       setApprovedProse('');
    }

    if (activeScene.scriptVersions) {
      const getScriptText = (slot: any) => {
        if (!slot) return '';
        if (typeof slot === 'string') return slot;
        return slot.script || '';
      };
      setSlotA(getScriptText(activeScene.scriptVersions.slotA));
      setSlotB(getScriptText(activeScene.scriptVersions.slotB));
      setSlotC(getScriptText(activeScene.scriptVersions.slotC));
      setJarvisFinal(getScriptText(activeScene.scriptVersions.jarvis));
    } else {
      setSlotA('');
      setSlotB('');
      setSlotC('');
      setJarvisFinal('');
    }
  };

  const fetchBible = async () => {
    try {
      const res = await fetch('/api/story-bible');
      if (res.ok) {
        const data: StoryBible = await res.json();
        setBible(data);
        if (data.scenes && data.scenes.length > 0) {
          const activeScene = activeSceneId 
            ? data.scenes.find(s => s.id === activeSceneId) || data.scenes[0]
            : data.scenes[0];
          
          if (!activeSceneId) setActiveSceneId(activeScene.id);
          
          loadSceneState(activeScene);
          
          if (activeScene.scriptContent) {
             setStatusMsg(`Loaded existing script for ${activeScene.title}`);
             setTimeout(() => setStatusMsg(null), 3500);
          } else if (activeScene.rawProse) {
             setStatusMsg(`Script synced from Phase 3 for ${activeScene.title}!`);
             setTimeout(() => setStatusMsg(null), 3500);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching bible:', e);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    setActiveSceneId(sceneId);
    if (!bible) return;
    const activeScene = bible.scenes.find(s => s.id === sceneId);
    if (activeScene) {
      loadSceneState(activeScene);
    }
  };

  const handleSaveToBible = async () => {
    if (!bible || !activeSceneId) return;
    try {
      const updatedScenes = bible.scenes.map(s => 
        s.id === activeSceneId 
          ? { 
              ...s, 
              scriptContent: rawText,
              scriptVersions: {
                slotA: { writer: "Writer A (The Architect)", script: slotA },
                slotB: { writer: "Writer B (The Pulse)", script: slotB },
                slotC: { writer: "Writer C (The Polisher)", script: slotC },
                jarvis: { writer: "J.A.R.V.I.S. (Director)", script: jarvisFinal }
              }
            }
          : s
      );
      const updatedBible = { ...bible, scenes: updatedScenes };
      
      const res = await fetch('/api/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible)
      });
      if (res.ok) {
        setBible(updatedBible);
        setStatusMsg('Script successfully saved to Story Bible!');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error('Failed to save to Bible:', e);
    }
  };

  const handleRunOptimizationPipeline = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/script/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedProse: rawText })
      });

      if (res.ok) {
        const data = await res.json();
        setSlotA(data.slotA);
        setSlotB(data.slotB);
        setSlotC(data.slotC);
        setJarvisFinal(data.jarvisFinal || '');
        setJarvisScore(data.jarvisScore);
        setJarvisReport(data.jarvisReport);

        // Update active script lines & raw text from J.A.R.V.I.S. Director's Final Script or Slot C master script
        const activeScript = data.jarvisFinal || data.slotC;
        if (activeScript) {
          setRawText(activeScript);
          setStatusMsg(data.jarvisFinal ? "J.A.R.V.I.S. Director's Final Script generated & loaded!" : 'Slot C Master Script generated & loaded into Editor!');
          setTimeout(() => setStatusMsg(null), 3000);
          
          // Auto-save to Story Bible using immediate API response values
          if (bible && activeSceneId) {
            const updatedScenes = bible.scenes.map(s => 
              s.id === activeSceneId 
                ? { 
                    ...s, 
                    scriptContent: activeScript,
                    scriptVersions: {
                      slotA: { writer: "Writer A (The Architect)", script: data.slotA },
                      slotB: { writer: "Writer B (The Pulse)", script: data.slotB },
                      slotC: { writer: "Writer C (The Polisher)", script: data.slotC },
                      jarvis: { writer: "J.A.R.V.I.S. (Director)", script: data.jarvisFinal || '' }
                    },
                    jarvisScore: data.jarvisScore,
                    jarvisFeedback: data.jarvisReport
                  }
                : s
            );
            const updatedBible = { ...bible, scenes: updatedScenes };
            fetch('/api/story-bible', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedBible)
            }).then(saveRes => {
              if (saveRes.ok) {
                setBible(updatedBible);
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Optimization pipeline failed:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // AI Live Script Agent Chat Handler
  const handleSendChatEdit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim() || isChatSending) return;

    const userMsg: ChatMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptToSend.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch('/api/script/chat-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentScript: rawText,
          userPrompt: promptToSend.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScript) {
          setRawText(data.updatedScript);
        }
        const jarvisMsg: ChatMsg = {
          id: `msg-j-${Date.now()}`,
          sender: 'jarvis',
          text: data.agentReply || 'Updated the script based on your instructions.',
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, jarvisMsg]);
        setStatusMsg('Script Live-Updated by AI!');
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (e) {
      console.error('Chat edit failed:', e);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'jarvis',
          text: 'Sorry, I encountered an issue updating the script. Please try again.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Inline Line Edit Handler
  const handleSaveInlineLine = (lineId: string) => {
    const updated = scriptLines.map(l => (l.id === lineId ? { ...l, text: inlineEditText } : l));
    setScriptLines(updated);
    setRawText(updated.map(l => l.text).join('\n'));
    setEditingLineId(null);
  };

  const handleAddComment = () => {
    if (!activeLineId || !newCommentInput.trim()) return;
    const target = scriptLines.find(l => l.id === activeLineId);
    if (!target) return;

    const comment: LineComment = {
      id: `c-${Date.now()}`,
      lineId: activeLineId,
      lineText: target.text,
      instruction: newCommentInput.trim(),
      createdAt: Date.now()
    };

    setComments(prev => [...prev, comment]);
    setNewCommentInput('');
    setRightTab('comments');
  };

  const handleTargetedLineRewrite = async (comment: LineComment) => {
    setIsRewritingLine(true);
    try {
      const res = await fetch('/api/script/rewrite-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullScript: rawText,
          targetLineId: comment.lineId,
          targetLineText: comment.lineText,
          commentInstruction: comment.instruction
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedScript) {
          setRawText(data.updatedScript);
          setStatusMsg(`Targeted rewrite applied for Line ${comment.lineId}!`);
          setTimeout(() => setStatusMsg(null), 3000);
        }
      }
    } catch (e) {
      console.error('Line rewrite failed:', e);
    } finally {
      setIsRewritingLine(false);
    }
  };

  const handleSynthesizeAudio = async () => {
    setIsSynthesizingAudio(true);
    try {
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: rawText,
          voice: bible?.speakers.narratorVoiceId || 'Kore',
          outputFileName: `scene-script-${Date.now()}.mp3`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setStatusMsg('Audio synthesized via Edge-TTS!');
          setTimeout(() => setStatusMsg(null), 3000);
        }
      }
    } catch (e) {
      console.error('Audio synthesis failed:', e);
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  const handleDownloadScriptText = () => {
    const textString = `data:text/plain;charset=utf-8,${encodeURIComponent(rawText)}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', textString);
    downloadAnchor.setAttribute('download', `Script_${activeSceneId || 'Scene'}_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyScriptText = () => {
    navigator.clipboard.writeText(rawText);
    setStatusMsg('Script copied to clipboard!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg-slate text-slate-light overflow-hidden">
      {/* Header Bar */}
      <div className="h-11 border-b border-white/10 bg-[#0d1322] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-teal-500/20 flex items-center justify-center border border-teal-500/50 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.3)]">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-extrabold text-teal-300 tracking-wider text-xs font-sans flex items-center gap-1.5">
              PHASE 4: SCRIPT OPTIMIZATION & DIRECT EDITOR
              <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/40 font-bold">LIVE AI CHAT & MANUAL EDIT</span>
            </h2>
            <p className="text-[10px] text-slate-400">Direct Typing • AI Live Agent Chat • Slot A/B/C Optimization • Audio Synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bible && bible.scenes && bible.scenes.length > 0 && (
            <select
              value={activeSceneId || ''}
              onChange={(e) => handleSceneChange(e.target.value)}
              className="h-7 bg-[#080c14] border border-teal-500/40 rounded px-2 text-[10px] text-teal-200 font-bold focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              {bible.scenes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.sceneNumber}. {s.title}
                </option>
              ))}
            </select>
          )}

          {statusMsg && (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 h-7 rounded border border-emerald-500/50 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3 h-3" /> {statusMsg}
            </span>
          )}

          <button
            onClick={handleCopyScriptText}
            className="h-7 px-2.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[10px] font-bold text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy current script to clipboard"
          >
            Copy
          </button>

          <button
            onClick={handleDownloadScriptText}
            className="h-7 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Download script as .txt file"
          >
            Download .txt
          </button>

          <button
            onClick={handleSaveToBible}
            className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            title="Save this script to the Story Bible"
          >
            <CheckCircle2 className="w-3 h-3" /> Save to Bible
          </button>

          <button
            onClick={fetchBible}
            className="h-7 px-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-[10px] font-bold text-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Reload latest script from Phase 3 Story Bible"
          >
            <RefreshCw className="w-3 h-3 text-teal-400" /> Sync Phase 3
          </button>

          <button
            onClick={handleRunOptimizationPipeline}
            disabled={isOptimizing}
            className="h-7 px-3 rounded bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-teal-400/40 shadow-[0_0_10px_rgba(20,184,166,0.35)]"
          >
            {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isOptimizing ? 'Optimizing...' : 'Run Optimization Pipeline'}
          </button>

          <button
            onClick={handleSynthesizeAudio}
            disabled={isSynthesizingAudio}
            className="h-7 px-3 rounded bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
          >
            {isSynthesizingAudio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
            {isSynthesizingAudio ? 'Synthesizing...' : 'Edge-TTS Speak Script'}
          </button>
        </div>
      </div>

      {/* Main Layout: Left Editor (Manual Text Area or Visual Inspector) & Right Sidebar */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Script Editor */}
        <div className="flex-1 flex flex-col border-r border-tab-blue/30 bg-bg-slate overflow-hidden">
          
          {/* Editor Mode Toolbar */}
          <div className="h-11 border-b border-tab-blue/30 bg-bg-dark-slate/90 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorMode('manual')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'manual'
                    ? 'bg-tab-blue text-text-black shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'text-slate-light/70 hover:text-slate-light hover:bg-bg-slate'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Direct Manual Text Editor
              </button>

              <button
                onClick={() => setEditorMode('visual')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'visual'
                    ? 'bg-tab-blue text-text-black shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'text-slate-light/70 hover:text-slate-light hover:bg-bg-slate'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Structured Line Inspector & Comments
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-light/70 flex items-center gap-3">
              <span>Lines: {scriptLines.length}</span>
              <span>Characters: {rawText.length}</span>
            </div>
          </div>

          {/* Audio Player Bar if synthesized */}
          {audioUrl && (
            <div className="p-3 bg-bg-dark-slate border-b border-tab-blue/30 flex items-center justify-between px-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-light">
                <Volume2 className="w-4 h-4 text-slate-light animate-pulse" /> Edge-TTS Synthesized Audio Playback
              </div>
              <audio controls src={audioUrl} className="h-8 max-w-xs" />
            </div>
          )}

          {/* MODE 1: Direct Manual Text Editor (Full Typing & Editing) */}
          {editorMode === 'manual' && (
            <div className="flex-1 p-4 flex flex-col overflow-hidden bg-bg-dark-slate">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Type or paste your script here directly..."
                className="w-full h-full bg-transparent font-sans text-xs text-slate-light leading-relaxed focus:outline-none resize-none p-2 space-y-1 selection:bg-tab-blue/40"
                spellCheck={false}
              />
            </div>
          )}

          {/* MODE 2: Structured Line Inspector & Line Comments */}
          {editorMode === 'visual' && (
            <div className="flex-1 overflow-y-auto p-6 text-xs space-y-1 bg-bg-dark-slate font-sans">
              {scriptLines.map(line => {
                const isSelected = activeLineId === line.id;
                const hasComment = comments.some(c => c.lineId === line.id);
                const isTag = line.text.startsWith('[') && line.text.endsWith(']');
                const isHeading = line.text.startsWith('#');
                const isEditingThisLine = editingLineId === line.id;

                return (
                  <div
                    key={line.id}
                    className={`flex items-center gap-4 px-3 py-1.5 rounded transition-all group ${
                      isSelected ? 'bg-bg-slate border-l-2 border-[#f1f5f9]' : 'hover:bg-bg-slate/50'
                    }`}
                  >
                    <span
                      onClick={() => setActiveLineId(line.id)}
                      className={`w-8 shrink-0 text-right select-none cursor-pointer font-mono ${
                        isSelected ? 'text-slate-light font-bold' : 'text-slate-light/40'
                      }`}
                    >
                      {line.id}
                    </span>

                    <div className="flex-1 flex items-center justify-between gap-3">
                      {isEditingThisLine ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={inlineEditText}
                            onChange={(e) => setInlineEditText(e.target.value)}
                            className="flex-1 bg-bg-slate border border-tab-blue rounded px-2 py-1 text-xs text-slate-light focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveInlineLine(line.id)}
                            className="px-2 py-1 rounded bg-[#f1f5f9] text-text-black font-bold text-[10px]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingLineId(null)}
                            className="px-2 py-1 rounded bg-bg-slate text-slate-light/70 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => setActiveLineId(line.id)}
                          className={`cursor-pointer flex-1 ${
                            isHeading ? 'text-amber-300 font-bold text-sm' : isTag ? 'text-slate-light font-semibold italic' : 'text-slate-light'
                          }`}
                        >
                          {line.text}
                        </span>
                      )}

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isEditingThisLine && (
                          <button
                            onClick={() => {
                              setEditingLineId(line.id);
                              setInlineEditText(line.text);
                            }}
                            className="p-1 rounded bg-bg-slate hover:bg-bg-dark-slate text-slate-light text-[10px]"
                            title="Edit line text"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {hasComment && (
                        <span className="text-[10px] bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded border border-amber-600/40 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Commented
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Line Comment Overlay in Visual Mode */}
          {editorMode === 'visual' && activeLineId && (
            <div className="p-4 bg-bg-dark-slate border-t border-tab-blue/30 flex items-center gap-3 font-sans">
              <span className="text-xs text-slate-light font-bold">{activeLineId}:</span>
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Add line revision instruction (e.g., Make vocal sub-profile whispering)..."
                className="flex-1 bg-bg-slate border border-tab-blue/40 rounded-lg px-3 py-1.5 text-xs text-slate-light focus:outline-none focus:border-[#f1f5f9]"
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-1.5 rounded-lg bg-[#f1f5f9] text-text-black font-bold text-xs hover:bg-[#ffffff] cursor-pointer"
              >
                Add Comment
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Script Agent Chat / J.A.R.V.I.S. Critic / Comments */}
        <div className="w-full md:w-96 bg-bg-dark-slate border-l border-tab-blue/30 flex flex-col shrink-0">
          
          {/* Sidebar Tabs */}
          <div className="h-11 border-b border-tab-blue/30 bg-bg-slate px-3 flex items-center gap-1 shrink-0">
            <button
              onClick={() => setRightTab('chat')}
              className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                rightTab === 'chat'
                  ? 'bg-tab-blue text-text-black shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-light/60 hover:text-slate-light'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> AI Live Chat
            </button>

            <button
              onClick={() => setRightTab('jarvis')}
              className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                rightTab === 'jarvis'
                  ? 'bg-tab-blue text-text-black shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-light/60 hover:text-slate-light'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Critic Report
            </button>

            <button
              onClick={() => setRightTab('comments')}
              className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                rightTab === 'comments'
                  ? 'bg-tab-blue text-text-black shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-light/60 hover:text-slate-light'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Comments ({comments.length})
            </button>
          </div>

          {/* TAB 1: DEDICATED LIVE AI AGENT CHAT */}
          {rightTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
              
              {/* Quick AI Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-light/70 uppercase tracking-wider block">Quick AI Script Edits</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendChatEdit("Add dramatic [Beat] pauses after every line of monologue.")}
                    className="text-[10px] font-bold bg-bg-slate hover:bg-bg-dark-slate text-slate-light px-2 py-1 rounded border border-tab-blue/40 cursor-pointer"
                  >
                    ⚡ Add Beat Pauses
                  </button>
                  <button
                    onClick={() => handleSendChatEdit("Make Kaelen sound more desperate and breathless.")}
                    className="text-[10px] font-bold bg-bg-slate hover:bg-bg-dark-slate text-slate-light px-2 py-1 rounded border border-tab-blue/40 cursor-pointer"
                  >
                    ⚡ Intensify Subtext
                  </button>
                  <button
                    onClick={() => handleSendChatEdit("Insert atmospheric sound effect tags [Sound: ...] between beats.")}
                    className="text-[10px] font-bold bg-bg-slate hover:bg-bg-dark-slate text-slate-light px-2 py-1 rounded border border-tab-blue/40 cursor-pointer"
                  >
                    ⚡ Insert SFX Tags
                  </button>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-sans">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-bg-slate border border-tab-blue/40 ml-4'
                        : 'bg-bg-slate/80 border border-tab-blue/60 mr-2'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-light/70">
                      <span className={msg.sender === 'user' ? 'text-slate-light font-bold' : 'text-slate-light font-bold flex items-center gap-1'}>
                        {msg.sender === 'user' ? 'YOU' : <><Bot className="w-3 h-3 text-slate-light" /> J.A.R.V.I.S. AGENT</>}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-light leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}

                {isChatSending && (
                  <div className="p-3 rounded-xl bg-bg-slate border border-tab-blue text-xs font-bold text-slate-light flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-light" />
                    <span>J.A.R.V.I.S. is modifying script live...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <div className="pt-2 border-t border-tab-blue/30 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatEdit()}
                  placeholder="Ask J.A.R.V.I.S. to edit script live..."
                  className="flex-1 bg-bg-slate border border-tab-blue/40 rounded-xl px-3 py-2 text-xs text-slate-light focus:outline-none focus:border-[#f1f5f9]"
                />
                <button
                  onClick={() => handleSendChatEdit()}
                  disabled={isChatSending || !chatInput.trim()}
                  className="p-2 rounded-xl bg-[#f1f5f9] text-text-black hover:bg-[#ffffff] disabled:opacity-40 cursor-pointer shadow-[0_0_8px_rgba(241,245,249,0.3)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: J.A.R.V.I.S. CRITIC REPORT */}
          {rightTab === 'jarvis' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="p-5 rounded-2xl bg-bg-slate border border-tab-blue space-y-3 relative shadow-lg font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-light font-bold flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-tab-blue" /> J.A.R.V.I.S. CRITIC REPORT
                  </span>
                  {jarvisScore !== null && (
                    <span className="text-xs text-text-black font-bold bg-[#f1f5f9] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> {jarvisScore} / 10
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-light/90 leading-relaxed whitespace-pre-wrap">
                  {jarvisReport || 'Run Optimization Pipeline to receive J.A.R.V.I.S. Audio Readiness Critique.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LINE COMMENTS STACK */}
          {rightTab === 'comments' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              <span className="text-xs text-slate-light font-bold uppercase tracking-wider block">
                Line Comment Stack ({comments.length})
              </span>

              {comments.length === 0 ? (
                <p className="text-xs text-slate-light/50 italic">Switch to 'Structured Line Inspector' mode and click any line to attach revision instructions.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-bg-slate border border-tab-blue/40 space-y-2 font-sans">
                    <div className="flex items-center justify-between text-[11px] text-slate-light">
                      <span>Line {c.lineId}</span>
                      <button
                        onClick={() => handleTargetedLineRewrite(c)}
                        disabled={isRewritingLine}
                        className="text-[10px] bg-tab-blue text-text-black font-bold hover:bg-[#60a5fa] px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                      >
                        {isRewritingLine ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Targeted AI Rewrite
                      </button>
                    </div>
                    <p className="text-xs text-slate-light font-bold">"{c.instruction}"</p>
                    <p className="text-[10px] text-slate-light/60 truncate">On: {c.lineText}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
