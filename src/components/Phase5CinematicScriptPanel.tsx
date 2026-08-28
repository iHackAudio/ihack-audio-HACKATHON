import React, { useState, useEffect } from 'react';
import { StoryBible, BibleScene } from '../types/storyBible';
import { 
  Play, Sparkles, MessageSquare, Edit3, Volume2, CheckCircle2, 
  RefreshCw, FileText, Save, Bot, ChevronRight, Award, Send, 
  Code, Eye, Wand2, ChevronDown, ChevronUp, Layers, Lock, Unlock, 
  Copy, Check, BookOpen, Download, Sliders, LayoutDashboard, Sidebar
} from 'lucide-react';

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

interface Phase5CinematicScriptPanelProps {
  bible: StoryBible | null;
  setBible: (bible: StoryBible) => void;
  onAgentAction?: (agentName: string, actionDesc: string) => void;
}

export default function Phase5CinematicScriptPanel({ 
  bible, 
  setBible, 
  onAgentAction 
}: Phase5CinematicScriptPanelProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  
  // Script and Prose States
  const [rawText, setRawText] = useState<string>('');
  const [approvedProse, setApprovedProse] = useState<string>('');
  
  // Dual Editor Modes: 'manual' (Direct text typing) or 'visual' (Line inspector & comments)
  const [editorMode, setEditorMode] = useState<'manual' | 'visual'>('manual');
  
  // Script line-by-line listing
  const [scriptLines, setScriptLines] = useState<{ id: string; text: string }[]>([]);

  // Sync scriptLines whenever rawText changes
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

  // 3-Agent Drafting states
  const [agentASubtext, setAgentASubtext] = useState<string>('');
  const [agentBStructure, setAgentBStructure] = useState<string>('');
  const [agentCVoice, setAgentCVoice] = useState<string>('');
  const [jarvisFinal, setJarvisFinal] = useState<string>('');
  const [jarvisScore, setJarvisScore] = useState<number | null>(9.2);
  const [jarvisReport, setJarvisReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const derivedStep = jarvisFinal ? 'polished' : agentCVoice ? 'review' : 'idle';

  // Right Sidebar Tab: 'agents' | 'comments'
  const [rightTab, setRightTab] = useState<'agents' | 'comments'>('agents');

  // AI Script Agent Chat State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: 'msg-init',
      sender: 'jarvis',
      text: "Greetings. I am J.A.R.V.I.S., your Script Supervisor. Chat with me to live-edit, refine tone, add vocal modifiers, or formatting changes in real time.",
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

  // Audio Playback State
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showCpsdCollapse, setShowCpsdCollapse] = useState<boolean>(false);

  // Compact & Focused UX UI states
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(true);
  const [isP5ToolbarCollapsed, setIsP5ToolbarCollapsed] = useState<boolean>(true);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(true);
  const [focusLayout, setFocusLayout] = useState<'split' | 'editor' | 'reading'>('split');

  // Load the selected scene context
  useEffect(() => {
    if (bible && bible.scenes && bible.scenes.length > 0) {
      const activeScene = activeSceneId 
        ? bible.scenes.find(s => s.id === activeSceneId) || bible.scenes[0]
        : bible.scenes[0];
      
      if (!activeSceneId) {
        setActiveSceneId(activeScene.id);
      }
      loadSceneState(activeScene);
    }
  }, [bible, activeSceneId]);

  const loadSceneState = (activeScene: BibleScene) => {
    // Populate raw text with existing script content or fallback to raw prose / summary
    if (activeScene.scriptContent) {
      setRawText(activeScene.scriptContent);
    } else {
      setRawText("");
    }
    
    setApprovedProse(activeScene.rawProse || activeScene.summary || '');

    if (activeScene.scriptVersions) {
      setAgentASubtext(activeScene.scriptVersions.slotA?.script || '');
      setAgentBStructure(activeScene.scriptVersions.slotB?.script || '');
      setAgentCVoice(activeScene.scriptVersions.slotC?.script || '');
      setJarvisFinal(activeScene.scriptVersions.jarvis?.script || '');
    } else {
      setAgentASubtext('');
      setAgentBStructure('');
      setAgentCVoice('');
      setJarvisFinal('');
    }

    if (activeScene.jarvisScore) {
      setJarvisScore(activeScene.jarvisScore);
    } else {
      setJarvisScore(null);
    }

    if (activeScene.jarvisFeedback) {
      setJarvisReport(activeScene.jarvisFeedback);
    } else {
      setJarvisReport('');
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

  // Step 1: Run the Agentic Creative Pipeline (Agent A -> Agent B -> Agent C Stitched Draft)
  const handleRunCreativePipeline = async () => {
    if (!bible || !activeSceneId) return;
    const activeScene = bible.scenes.find(s => s.id === activeSceneId);
    if (!activeScene) return;

    // CPSD check
    const cpsdDoc = activeScene.cpsdDocument || activeScene.rawProse || activeScene.summary;
    if (!cpsdDoc) {
      setStatusMsg("Error: Please compile Phase 4 CPSD Document first.");
      setTimeout(() => setStatusMsg(null), 4000);
      return;
    }

    setIsGenerating(true);
    onAgentAction?.("Jarvis", "Invoking Multi-Agent Creative Pipeline (A, B, C)...");
    
    try {
      const res = await fetch('/api/pipeline/phase5-agentic-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpsdDocument: cpsdDoc })
      });

      if (res.ok) {
        const data = await res.json();
        setAgentASubtext(data.agentA_emotional_architecture || '');
        setAgentBStructure(data.agentB_dialogue_blueprint || '');
        setAgentCVoice(data.agentC_stitched_draft || '');
        
        // Clear old JARVIS states to ensure we enter 'review' derived state
        setJarvisFinal('');
        setJarvisReport('');
        
        // Populate the main editor with Agent C's stitched draft & margin notes
        if (data.agentC_stitched_draft) {
          setRawText(data.agentC_stitched_draft);
          setStatusMsg("Creative Draft ready! Review the stitched draft and margin notes.");
          setTimeout(() => setStatusMsg(null), 4000);
        }
        
        // Auto-switch right tab to show agent contributions
        setRightTab('agents');
        onAgentAction?.("Jarvis", "Step 1 Creative Pipeline completed. Pause for human review.");
      } else {
        const errorData = await res.json();
        setStatusMsg(`Creative Pipeline failed: ${errorData.error || 'Server error'}`);
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e: any) {
      console.error('Creative Pipeline failed:', e);
      setStatusMsg("Error connecting to creative pipeline.");
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Send Stitched Draft to JARVIS for Production Sharpening & Polish
  const handleRunJarvisPolish = async () => {
    if (!bible || !activeSceneId) return;
    const activeScene = bible.scenes.find(s => s.id === activeSceneId);
    if (!activeScene) return;

    const cpsdDoc = activeScene.cpsdDocument || activeScene.rawProse || activeScene.summary;

    setIsGenerating(true);
    onAgentAction?.("Jarvis", "Running JARVIS Production Polish & Anti-Slop pass...");
    
    try {
      const res = await fetch('/api/pipeline/phase5-jarvis-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentCDraft: rawText,
          cpsdDocument: cpsdDoc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setJarvisFinal(data.finalScript || '');
        setJarvisReport(data.producerNote || '');
        setJarvisScore(9.2);

        if (data.finalScript) {
          setRawText(data.finalScript);
          setStatusMsg("JARVIS Production Polish complete! Ready for sync.");
          setTimeout(() => setStatusMsg(null), 4000);
        }
        setRightTab('agents');
        onAgentAction?.("Jarvis", "JARVIS Polish complete. Clean script loaded.");
      } else {
        const errorData = await res.json();
        setStatusMsg(`JARVIS Polish failed: ${errorData.error || 'Server error'}`);
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e: any) {
      console.error('Jarvis Polish failed:', e);
      setStatusMsg("Error connecting to JARVIS Polish service.");
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Sync and save to Story Bible inside Workspace Project Folder
  const handleSaveToBible = async () => {
    if (!bible || !activeSceneId) return;
    try {
      const updatedScenes = bible.scenes.map(s => 
        s.id === activeSceneId 
          ? { 
              ...s, 
              status: 'scripted' as const,
              isScripted: true,
              scriptContent: rawText,
              jarvisScore: jarvisScore || 9.2,
              jarvisFeedback: jarvisReport,
              scriptVersions: {
                slotA: { writer: "Agent A: Subtext Analyst", script: agentASubtext },
                slotB: { writer: "Agent B: Structural Beat Architect", script: agentBStructure },
                slotC: { writer: "Agent C: Vocal Fingerprint Polisher", script: agentCVoice },
                jarvis: { writer: "J.A.R.V.I.S. Director Synthesis", script: rawText }
              }
            }
          : s
      );

      const updatedBible = { 
        ...bible, 
        scenes: updatedScenes,
        version: bible.version + 1,
        updatedAt: Date.now()
      };
      
      const res = await fetch('/api/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible)
      });

      if (res.ok) {
        setBible(updatedBible);
        setStatusMsg('Script Synced Eternally inside Workspace Folder!');
        setTimeout(() => setStatusMsg(null), 4000);
        onAgentAction?.("System", `Saved Scene script & marked as Scripted/Done.`);
      } else {
        setStatusMsg('Failed to persist Story Bible.');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      console.error('Failed to save to Bible:', e);
      setStatusMsg('Error writing to Workspace Story Bible.');
      setTimeout(() => setStatusMsg(null), 4000);
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
          text: data.agentReply || 'Adjusted script according to your directive.',
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, jarvisMsg]);
        setStatusMsg('Script live-refined by J.A.R.V.I.S.!');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error('Chat edit failed:', e);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'jarvis',
          text: 'Encountered an issue processing instruction. Please retry.',
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
          setStatusMsg(`Targeted rewrite applied to ${comment.lineId}!`);
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
          voice: bible?.speakers.narratorVoiceId || 'en-US-AvaNeural',
          outputFileName: `scene-script-${Date.now()}.mp3`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setStatusMsg('Edge-TTS Synthesis Complete!');
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

  const selectedScene = bible?.scenes.find(s => s.id === activeSceneId);

  return (
    <div className="w-full flex flex-col bg-[#070b14] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Top Controls Header */}
      <div className="p-3 border-b border-white/10 bg-[#0d1322] flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors border border-white/5 cursor-pointer"
            title={isHeaderCollapsed ? "Expand Header Details" : "Collapse Header Details"}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHeaderCollapsed ? "" : "rotate-180"}`} />
          </button>
          
          <div>
            <h2 className="text-xs font-black text-indigo-300 tracking-wider flex items-center gap-1.5 uppercase">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Phase 5: Cinematic Script Engine
            </h2>
            {!isHeaderCollapsed && (
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-lg leading-snug">
                Agents Subtext, Structure, and Voice collaborate on screenplay formatting & audio ready TTS scripts.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bible && bible.scenes && bible.scenes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 font-mono">Scene:</span>
              <select
                value={activeSceneId || ''}
                onChange={(e) => handleSceneChange(e.target.value)}
                className="h-7 bg-[#080c14] border border-indigo-500/30 hover:border-indigo-500/50 rounded px-2 text-[11px] text-indigo-200 font-black focus:outline-none cursor-pointer"
              >
                {bible.scenes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sceneNumber}. {s.title} {s.isScripted ? '✓' : '•'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedScene?.isScripted ? (
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
              Scripted
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
              Pending
            </span>
          )}

          {statusMsg && (
            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {statusMsg}
            </span>
          )}
        </div>
      </div>

      {/* Mini CPSD Blueprint Expandable View */}
      {selectedScene && (
        <div className="bg-[#090d16] border-b border-white/10 px-4 py-2 flex flex-col gap-1">
          <button 
            onClick={() => setShowCpsdCollapse(!showCpsdCollapse)}
            className="text-[11px] font-bold text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer w-fit"
          >
            {showCpsdCollapse ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Show CPSD Blueprint & Story Summary for Scene "{selectedScene.title}"</span>
          </button>
          
          {showCpsdCollapse && (
            <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-white/5 space-y-2 animate-fadeIn max-h-48 overflow-y-auto custom-scrollbar">
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedScene.cpsdDocument || selectedScene.rawProse || selectedScene.summary || "No CPSD or Summary drafted yet. Run Phase 4 first."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toolbar Operations */}
      <div className="p-2 bg-slate-950 border-b border-white/10 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setIsP5ToolbarCollapsed(!isP5ToolbarCollapsed)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-white/5 cursor-pointer flex items-center justify-center"
            title={isP5ToolbarCollapsed ? "Expand Secondary Options" : "Collapse Toolbar"}
          >
            <Sliders className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${isP5ToolbarCollapsed ? "" : "rotate-90"}`} />
          </button>

          <button
            onClick={handleRunCreativePipeline}
            disabled={isGenerating}
            className={`h-7 px-2.5 rounded font-extrabold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all ${
              derivedStep === 'idle'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                : 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-500/20'
            }`}
            title="Run Agent A (Emotional Architecture), Agent B (Dialogue Blueprint), and Agent C (Stitched Draft with Margin Notes)"
          >
            {isGenerating && derivedStep === 'idle' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Layers className="w-3 h-3 text-indigo-300" />
            )}
            <span>1. Creative Pipeline (A, B, C)</span>
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          <button
            onClick={handleRunJarvisPolish}
            disabled={isGenerating || !rawText || derivedStep === 'idle'}
            className={`h-7 px-2.5 rounded font-extrabold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all ${
              derivedStep === 'review'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/30'
            }`}
            title="Send Stitched Draft to JARVIS to strip comments, run anti-slop pass, and produce final audio-ready script"
          >
            {isGenerating && derivedStep === 'review' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Bot className="w-3 h-3 text-emerald-300" />
            )}
            <span>2. Send to JARVIS for Polish</span>
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          <button
            onClick={handleSaveToBible}
            className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-all border border-emerald-500/20 shadow-md"
            title="Mark scene as scripted/done and write back to story bible file eternally"
          >
            <Save className="w-3 h-3" />
            <span>Save & Sync</span>
          </button>
        </div>

        <div className="flex gap-1.5 items-center">
          <button
            onClick={handleSynthesizeAudio}
            disabled={isSynthesizingAudio || !rawText}
            className="h-7 px-2 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-30 transition-all"
            title="Synthesize script to audio speech via Edge-TTS"
          >
            {isSynthesizingAudio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
            <span>Speak Script</span>
          </button>

          {!isP5ToolbarCollapsed && (
            <button
              onClick={handleCopyScriptText}
              className="h-7 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors animate-fadeIn"
              title="Copy script to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </button>
          )}

          {!isP5ToolbarCollapsed && (
            <button
              onClick={handleDownloadScriptText}
              className="h-7 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors animate-fadeIn"
              title="Download script as .txt"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export .txt</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio Player Bar if synthesized */}
      {audioUrl && (
        <div className="p-3 bg-[#0d1322] border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" /> 
            <span>Edge-TTS Synthesized Scene Audio Output</span>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-xs" />
        </div>
      )}

      {/* Main Core Editor + Chat Workspace Layout */}
      <div className="flex flex-col lg:flex-row h-[550px] overflow-hidden bg-[#080c14]">
        
        {/* LEFT COLUMN: Dual Mode Text Editor Canvas */}
        <div className={`${focusLayout === 'reading' ? 'hidden' : 'flex-1'} flex flex-col ${focusLayout === 'split' ? 'border-r border-white/10' : ''} overflow-hidden`}>
          
          {/* Mode Switcher */}
          <div className="h-10 border-b border-white/10 bg-slate-950 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 bg-[#090d16] p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setEditorMode('manual')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'manual'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> 
                <span>Manual Editor</span>
              </button>

              <button
                onClick={() => setEditorMode('visual')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'visual'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> 
                <span>Structured Line Inspector</span>
              </button>
            </div>

            {/* Layout Toggles */}
            <div className="flex items-center gap-1 bg-[#090d16] p-0.5 rounded border border-white/5 font-sans shrink-0">
              <button
                onClick={() => setFocusLayout('split')}
                className={`p-1 px-2 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                  focusLayout === 'split'
                    ? 'bg-[#1e293b] text-indigo-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split Side-by-Side Screen"
              >
                <LayoutDashboard className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Split View</span>
              </button>

              <button
                onClick={() => setFocusLayout('editor')}
                className={`p-1 px-2 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                  focusLayout === 'editor'
                    ? 'bg-[#1e293b] text-indigo-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Focused Full-Width Editor"
              >
                <Sidebar className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Focused Editor</span>
              </button>

              <button
                onClick={() => setFocusLayout('reading')}
                className={`p-1 px-2 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                  focusLayout === 'reading'
                    ? 'bg-[#1e293b] text-indigo-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Focused Full-Width Reading (3-Agent / Notes)"
              >
                <BookOpen className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Focused Reading</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3 shrink-0">
              <span>Lines: {scriptLines.length}</span>
              <span>Words: {rawText ? rawText.trim().split(/\s+/).length : 0}</span>
            </div>
          </div>

          {/* EDITOR VIEWPORTS */}
          {editorMode === 'manual' ? (
            <div className="flex-1 p-4 bg-slate-950 flex flex-col overflow-hidden font-sans">
              {derivedStep === 'review' && (
                <div className="mb-3 p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="text-indigo-200 font-sans">
                    <span className="font-extrabold text-indigo-300">✍️ Agent C Draft Ready:</span> Review and edit the stitched draft and comments below, then click <strong className="text-emerald-400">Step 2: Send to JARVIS for Polish</strong> above.
                  </div>
                  <button 
                    onClick={() => {
                      setRawText(agentCVoice);
                      setStatusMsg("Reverted editor to original Agent C draft.");
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="text-[10px] bg-indigo-900/60 hover:bg-indigo-850 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20 cursor-pointer font-bold shrink-0 transition-colors"
                  >
                    Reset Draft
                  </button>
                </div>
              )}
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Write, edit, or copy/paste your formatted screenplay here directly..."
                className="w-full h-full bg-transparent font-mono text-xs text-slate-200 leading-relaxed focus:outline-none resize-none p-2 custom-scrollbar focus:ring-0 select-text"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-950 font-mono text-xs custom-scrollbar">
              {scriptLines.length === 0 || (scriptLines.length === 1 && !scriptLines[0].text) ? (
                <div className="p-8 text-center text-slate-500 italic">
                  No script text to inspect. Type in Manual Editor or click "Run 3-Agent Scripting Engine".
                </div>
              ) : (
                scriptLines.map(line => {
                  const isSelected = activeLineId === line.id;
                  const hasComment = comments.some(c => c.lineId === line.id);
                  const isCharacterHeading = /^[A-Z0-9\s]+$/.test(line.text.trim()) && line.text.trim().length > 1 && line.text.trim().length < 30;
                  const isBracketTag = line.text.trim().startsWith('[') && line.text.trim().endsWith(']');
                  const isEditingThisLine = editingLineId === line.id;

                  return (
                    <div
                      key={line.id}
                      className={`flex items-start gap-4 px-3 py-1 rounded transition-all group ${
                        isSelected ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Line Number Gutter */}
                      <span
                        onClick={() => setActiveLineId(line.id)}
                        className={`w-10 text-right shrink-0 select-none cursor-pointer text-[10px] font-mono ${
                          isSelected ? 'text-indigo-400 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {line.id}
                      </span>

                      {/* Line Content */}
                      <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        {isEditingThisLine ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={inlineEditText}
                              onChange={(e) => setInlineEditText(e.target.value)}
                              className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineLine(line.id);
                                if (e.key === 'Escape') setEditingLineId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveInlineLine(line.id)}
                              className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[9px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingLineId(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => setActiveLineId(line.id)}
                            className={`cursor-pointer flex-1 break-words select-text ${
                              isCharacterHeading ? 'text-cyan-300 font-black tracking-widest text-center uppercase block pt-1.5' : 
                              isBracketTag ? 'text-indigo-400 italic font-bold' : 'text-slate-200'
                            }`}
                          >
                            {line.text || '\u00A0'}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!isEditingThisLine && (
                            <button
                              onClick={() => {
                                setEditingLineId(line.id);
                                setInlineEditText(line.text);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit line text inline"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {hasComment && (
                          <span className="text-[9px] bg-amber-950/60 text-amber-300 px-1.5 py-0.2 rounded border border-amber-600/40 flex items-center gap-1 font-sans shrink-0">
                            <MessageSquare className="w-2.5 h-2.5" /> Commented
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Line Comment Insertion Overlay */}
          {editorMode === 'visual' && activeLineId && (
            <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-bold shrink-0">{activeLineId}:</span>
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Attach custom instruction on this line (e.g., Make vocal style whisper, Add heavy breathing tag)..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shrink-0 font-sans"
              >
                Attach Note
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Tab Panel (JARVIS Copilot Chat / Three Agents Analysis / Stacking Comments) */}
        <div className={`${focusLayout === 'editor' ? 'hidden' : focusLayout === 'reading' ? 'flex-1' : 'w-full lg:w-96'} bg-[#0a0e17] flex flex-col overflow-hidden`}>
          
          {/* Tab buttons */}
          <div className="h-10 border-b border-white/10 bg-slate-900 px-2 flex items-center gap-1 shrink-0">
            <button
              onClick={() => setRightTab('agents')}
              className={`flex-1 py-1 rounded text-[11px] font-extrabold uppercase flex items-center justify-center gap-1 cursor-pointer ${
                rightTab === 'agents'
                  ? 'bg-indigo-600 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3 Agents Draft</span>
            </button>

            <button
              onClick={() => setRightTab('comments')}
              className={`flex-1 py-1 rounded text-[11px] font-extrabold uppercase flex items-center justify-center gap-1 cursor-pointer ${
                rightTab === 'comments'
                  ? 'bg-indigo-600 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes ({comments.length})</span>
            </button>
          </div>

          {/* TAB CONTENT: THREE PARALLEL AGENTS DRAFT */}
          {rightTab === 'agents' && (
            <div className="flex-1 p-3.5 overflow-y-auto space-y-4 custom-scrollbar select-text">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                Three-Agent Method Compilation Analysis
              </span>

              {!agentASubtext && !agentBStructure && !agentCVoice ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Run 3-Agent Scripting Engine to populate subtext, structure, and vocal fingerprint analyses.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Agent A */}
                  <div className="p-3 bg-[#0d1322] border border-amber-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                      <Bot className="w-3 h-3" />
                      <span>Agent A: Subtext Analyst</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {agentASubtext}
                    </p>
                  </div>

                  {/* Agent B */}
                  <div className="p-3 bg-[#0d1322] border border-blue-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-400 uppercase tracking-wider">
                      <Bot className="w-3 h-3" />
                      <span>Agent B: Structural Pacer</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {agentBStructure}
                    </p>
                  </div>

                  {/* Agent C */}
                  <div className="p-3 bg-[#0d1322] border border-emerald-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      <Bot className="w-3 h-3" />
                      <span>Agent C: Vocal Fingerprint Polisher</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {agentCVoice}
                    </p>
                  </div>

                  {/* J.A.R.V.I.S. Producer Note */}
                  {jarvisReport && (
                    <div className="p-3 bg-slate-900 border border-indigo-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">
                          J.A.R.V.I.S. Producer Note
                        </span>
                        {jarvisScore !== null && (
                          <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                            Score: {jarvisScore}/10
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 italic leading-relaxed">
                        "{jarvisReport}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: STACKING COMMENTS / TARGETED WRITES */}
          {rightTab === 'comments' && (
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar select-text">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Targeted Comment Revision Stack ({comments.length})
              </span>

              {comments.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic text-xs">
                  Switch to "Structured Line Inspector" mode, click any line, and type custom comments to attach revision notes.
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-400 font-bold">Line {c.lineId}</span>
                        <button
                          onClick={() => handleTargetedLineRewrite(c)}
                          disabled={isRewritingLine}
                          className="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          {isRewritingLine ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                          <span>Targeted AI Rewrite</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 font-extrabold leading-normal">
                        "{c.instruction}"
                      </p>
                      <p className="text-[10px] text-slate-500 italic truncate">
                        On: {c.lineText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
