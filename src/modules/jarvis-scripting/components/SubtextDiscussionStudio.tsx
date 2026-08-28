import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, Send, Brain, Lock, Unlock, Sparkles, Zap, Shield, Eye, EyeOff, 
  ChevronDown, ChevronUp, RefreshCw, Volume2, Plus, ArrowRight, Layers, FileText, Users, Trophy,
  Check, X, Edit3, HelpCircle, ArrowUpRight, Maximize2, Minimize2, CheckCircle2, RotateCcw
} from 'lucide-react';
import { DiscussionPhase, DiscussionMessage, ParameterLockItem, LocksMap } from '../types/discussion';
import { StoryBible } from '../types/storyBible';
import StoryBibleLockPanel from './StoryBibleLockPanel';

interface SubtextDiscussionStudioProps {
  storyBible: StoryBible;
  onUpdateStoryBible: (updated: StoryBible) => void;
  onSwitchToHardcoreMode: () => void;
}

export default function SubtextDiscussionStudio({
  storyBible,
  onUpdateStoryBible,
  onSwitchToHardcoreMode
}: SubtextDiscussionStudioProps) {
  const [currentPhase, setCurrentPhase] = useState<DiscussionPhase>(1);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLocksDrawer, setShowLocksDrawer] = useState(true);
  const [isWideLocksDrawer, setIsWideLocksDrawer] = useState(false);
  const [locksMap, setLocksMap] = useState<LocksMap>({});
  const [proposedLocks, setProposedLocks] = useState<ParameterLockItem[]>([]);
  
  // Interactive Editing State for proposed cards
  const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
  const [editingCardValue, setEditingCardValue] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Locks Map from Story Bible
  useEffect(() => {
    const initialLocks: LocksMap = {
      'concept.title': {
        key: 'concept.title',
        label: 'Story Title',
        value: storyBible.concept?.title || 'The Shadow Over Verona',
        isLocked: !!storyBible.concept?.title,
        category: 'phase1_concept'
      },
      'concept.hook': {
        key: 'concept.hook',
        label: 'Logline / Premise Hook',
        value: storyBible.concept?.logline || storyBible.concept?.hook || '',
        isLocked: !!storyBible.concept?.logline,
        category: 'phase1_concept'
      },
      'concept.tone': {
        key: 'concept.tone',
        label: 'Tone & Atmosphere',
        value: storyBible.concept?.tone || 'Gothic Psychological Noir',
        isLocked: !!storyBible.concept?.tone,
        category: 'phase1_concept'
      },
      'concept.genre': {
        key: 'concept.genre',
        label: 'Genre',
        value: storyBible.concept?.genre || 'Historical Mystery Thriller',
        isLocked: !!storyBible.concept?.genre,
        category: 'phase1_concept'
      },
      'phase1.theme': {
        key: 'phase1.theme',
        label: 'Theme & Moral Underpinning',
        value: storyBible.phase1Intake?.theme || 'The burden of obsession and unsaid guilt',
        isLocked: !!storyBible.phase1Intake?.theme,
        category: 'phase1_concept'
      }
    };

    // Add character profiles
    storyBible.characterProfiles?.forEach((char) => {
      initialLocks[`character.${char.id}.motivations`] = {
        key: `character.${char.id}.motivations`,
        label: `${char.name} Motivations`,
        value: char.motivations || char.background || '',
        isLocked: char.isLocked || false,
        category: 'phase2_personas'
      };
      initialLocks[`character.${char.id}.vocalProfile`] = {
        key: `character.${char.id}.vocalProfile`,
        label: `${char.name} Voice Register`,
        value: char.vocalProfile || '',
        isLocked: char.isLocked || false,
        category: 'phase2_personas'
      };
    });

    // Add scene matrix items
    storyBible.scenes?.forEach((sc) => {
      initialLocks[`scene.${sc.id}.summary`] = {
        key: `scene.${sc.id}.summary`,
        label: `Scene ${sc.sceneNumber}: ${sc.title}`,
        value: sc.summary || '',
        isLocked: false,
        category: 'phase3_matrix'
      };
    });

    setLocksMap(initialLocks);

    // Initial welcome message
    setMessages([
      {
        id: 'welcome_disc_1',
        sender: 'ai',
        text: `Welcome to the **Interactive Story Discussion Studio**.

In Discussion Mode, I **think deeply from your perspective** before responding. We negotiate story parameters through a continuous lock loop:

1. **Ask & Suggest**: I present candidate parameter locks (Logline, Tone, Character Voice, Scene Twists).
2. **If YES 🔒**: Click **Lock** to fix the rule into our Story Bible Locking System.
3. **If NO 💬**: Click **No / Discuss** to tell me why. I will generate 3 creative alternatives and discuss options with you until we reach a **"YES"**!`,
        timestamp: Date.now(),
        phase: 1,
        thinkingTrace: {
          userPerspectiveAnalysis: "The story architect is launching Discussion Mode to collaboratively refine story parameters through an interactive ask-suggest-lock loop.",
          subtextAndUnstatedNeeds: "Needs explicit parameter lock proposals with instant options if rejected.",
          storyBibleLocksCheck: "Loaded initial Story Bible state. Parameter locks ready for user negotiation.",
          dramaticAndNarrativeReasoning: "Establishing a supportive, high-craft conversational baseline across Phases 1 through 5."
        },
        proposedLocks: [
          {
            key: 'concept.tone',
            label: 'Phase 1 Atmosphere & Tone',
            value: storyBible.concept?.tone || 'Gothic Psychological Noir with Melancholic Subtext',
            isLocked: false,
            category: 'phase1_concept',
            reason: 'Suggested for Phase 1 Premise Lock',
            alternatives: [
              'High-Stakes Neo-Noir Detective Thriller',
              'Subdued Victorian Period Mystery',
              'Ethereal Supernatural Horror Drama'
            ],
            status: 'pending'
          }
        ],
        isThinkingOpen: true
      }
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleToggleLock = (key: string) => {
    setLocksMap(prev => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isLocked: !existing.isLocked,
          updatedAt: Date.now()
        }
      };
    });
  };

  const handleUpdateLockValue = (key: string, newValue: string) => {
    setLocksMap(prev => {
      const existing = prev[key];
      const updatedItem: ParameterLockItem = {
        key,
        label: existing?.label || key,
        value: newValue,
        isLocked: true,
        category: existing?.category || 'phase1_concept',
        updatedAt: Date.now()
      };

      // Also sync to Backend Story Bible
      syncLockToBackendBible(key, newValue);

      return {
        ...prev,
        [key]: updatedItem
      };
    });
  };

  const syncLockToBackendBible = async (key: string, value: string) => {
    try {
      const updatedBible = { ...storyBible };
      if (key === 'concept.title') {
        updatedBible.concept = { ...updatedBible.concept, title: value };
      } else if (key === 'concept.hook' || key === 'concept.logline') {
        updatedBible.concept = { ...updatedBible.concept, logline: value, hook: value };
      } else if (key === 'concept.tone') {
        updatedBible.concept = { ...updatedBible.concept, tone: value };
      } else if (key === 'concept.genre') {
        updatedBible.concept = { ...updatedBible.concept, genre: value };
      }

      onUpdateStoryBible(updatedBible);

      await fetch('/api/story-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible)
      });
    } catch (e) {
      console.warn('[DiscussionStudio] Failed to sync lock to backend story bible:', e);
    }
  };

  const handleAddCustomLock = (lock: ParameterLockItem) => {
    setLocksMap(prev => ({ ...prev, [lock.key]: lock }));
    syncLockToBackendBible(lock.key, lock.value);
  };

  const handleAcceptProposedLocks = (proposed: ParameterLockItem[]) => {
    proposed.forEach(p => {
      handleUpdateLockValue(p.key, p.value);
    });
    setProposedLocks([]);
  };

  // User accepts an individual proposed candidate lock ("YES")
  const handleAcceptIndividualLock = (msgId: string, lock: ParameterLockItem) => {
    handleUpdateLockValue(lock.key, lock.value);

    // Update message proposedLocks status
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposedLocks) {
        return {
          ...m,
          proposedLocks: m.proposedLocks.map(pl => pl.key === lock.key ? { ...pl, status: 'accepted', isLocked: true } : pl)
        };
      }
      return m;
    }));

    // Send confirmation message in discussion
    const confirmText = `🔒 **YES! Parameter Locked**: I've locked **${lock.label}** as:
> "${lock.value}"

This is now an unshakeable Story Bible constraint for Phase ${currentPhase}. What parameter should we discuss next?`;

    setMessages(prev => [
      ...prev,
      {
        id: `lock_confirm_${Date.now()}`,
        sender: 'ai',
        text: confirmText,
        timestamp: Date.now(),
        phase: currentPhase
      }
    ]);
  };

  // User rejects an individual proposed candidate lock ("NO > WHY ? GIVE OPTIONS")
  const handleRejectIndividualLock = (msgId: string, lock: ParameterLockItem) => {
    // Update message proposedLocks status
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposedLocks) {
        return {
          ...m,
          proposedLocks: m.proposedLocks.map(pl => pl.key === lock.key ? { ...pl, status: 'rejected' } : pl)
        };
      }
      return m;
    }));

    // Trigger AI discussion prompt to analyze why and give 3 options
    const rejectPrompt = `No, the proposed lock for "${lock.label}" ("${lock.value}") does not fit my creative vision. Please ask me why it doesn't fit, analyze my artistic perspective, and provide 3 distinct creative alternatives/options for us to discuss!`;
    
    handleSendMessage(rejectPrompt);
  };

  // User selects an alternative option
  const handleSelectAlternative = (msgId: string, lock: ParameterLockItem, alternativeValue: string) => {
    handleUpdateLockValue(lock.key, alternativeValue);

    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposedLocks) {
        return {
          ...m,
          proposedLocks: m.proposedLocks.map(pl => pl.key === lock.key ? { ...pl, value: alternativeValue, status: 'accepted', isLocked: true } : pl)
        };
      }
      return m;
    }));

    const confirmText = `🔒 **YES! Parameter Locked via Alternative Option**: I've locked **${lock.label}** as:
> "${alternativeValue}"

This constraint is now active in our Story Bible Locking System!`;

    setMessages(prev => [
      ...prev,
      {
        id: `lock_alt_confirm_${Date.now()}`,
        sender: 'ai',
        text: confirmText,
        timestamp: Date.now(),
        phase: currentPhase
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim() || isLoading) return;

    const userMessageObj: DiscussionMessage = {
      id: `user_msg_${Date.now()}`,
      sender: 'user',
      text: finalMsg,
      timestamp: Date.now(),
      phase: currentPhase
    };

    setMessages(prev => [...prev, userMessageObj]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/discussion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: finalMsg,
          currentPhase,
          discussionHistory: messages.map(m => ({ sender: m.sender, text: m.text, phase: m.phase })),
          storyBible,
          locksMap
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        if (data.message.proposedLocks && data.message.proposedLocks.length > 0) {
          setProposedLocks(data.message.proposedLocks);
        }
      }
    } catch (err: any) {
      console.error('[DiscussionStudio] Chat request failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_msg_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Discussion Connection Error**: ${err.message || 'Unable to connect to AI discussion service.'}. Retrying...`,
          timestamp: Date.now(),
          phase: currentPhase
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleThinkingForMessage = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, isThinkingOpen: !m.isThinkingOpen } : m))
    );
  };

  const phasesList: Array<{ id: DiscussionPhase; title: string; subtitle: string; icon: any }> = [
    { id: 1, title: 'Phase 1: Concept & Premise', subtitle: 'Title, Hook, Tone, Theme', icon: Zap },
    { id: 2, title: 'Phase 2: Personas & Voices', subtitle: 'Character Bibles & Psychology', icon: Users },
    { id: 3, title: 'Phase 3: Scene Matrix', subtitle: 'Dramatic Beats & Twists', icon: Trophy },
    { id: 4, title: 'Phase 4: CPSD Blueprint', subtitle: 'Raw Drafts & Milestones', icon: FileText },
    { id: 5, title: 'Phase 5: Cinematic Polish', subtitle: 'Oscar Dialogue & Sensory Bridges', icon: Sparkles }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#070a12] text-slate-100 overflow-hidden select-none">
      {/* PHASE CONTEXT BAR */}
      <div className="h-13 border-b border-white/15 bg-[#0a0f1d] px-4 flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-sky-400 animate-pulse" />
            Discussion Focus:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          {phasesList.map(p => {
            const Icon = p.icon;
            const isActive = currentPhase === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPhase(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-black border-sky-300 shadow-[0_0_14px_rgba(14,165,233,0.5)]'
                    : 'bg-white/5 text-slate-300 hover:text-slate-100 hover:bg-white/10 border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-sky-400'}`} />
                <span>P{p.id}: {p.title.split(':')[1]?.trim() || p.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLocksDrawer(!showLocksDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showLocksDrawer
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border-white/10'
            }`}
            title="Toggle Story Bible Locking System Panel"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Story Bible Locks</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE BODY (CHAT + LOCKS PANEL) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* CHAT MESSAGES VIEWPORT */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14] relative">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-4xl mx-auto space-y-2`}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-extrabold px-1">
                  {msg.sender === 'user' ? (
                    <span className="text-amber-400">You (Story Architect)</span>
                  ) : (
                    <span className="text-sky-400 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-sky-400" />
                      J.A.R.V.I.S. Contextual AI (Phase {msg.phase})
                    </span>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* AI Thinking & Subtext Inspector */}
                {msg.sender === 'ai' && msg.thinkingTrace && (
                  <div className="w-full bg-[#0d1424] border-2 border-sky-500/40 rounded-2xl overflow-hidden shadow-xl">
                    <button
                      type="button"
                      onClick={() => toggleThinkingForMessage(msg.id)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-purple-950/80 border-b border-sky-500/30 flex items-center justify-between text-xs font-black text-sky-200 hover:text-sky-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-sky-400 animate-pulse" />
                        <span>🧠 AI Cognitive Thought Vector (User Perspective & Subtext Analysis)</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-sky-400 font-bold">
                        <span>{msg.isThinkingOpen ? 'Hide Analysis' : 'Inspect Reasoning'}</span>
                        {msg.isThinkingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {msg.isThinkingOpen && (
                      <div className="p-4 text-xs space-y-2.5 bg-[#080d19] border-t border-sky-500/20 leading-relaxed">
                        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30">
                          <span className="font-extrabold text-sky-300 block mb-1 text-xs">👤 User Perspective Analysis:</span>
                          <p className="text-slate-200 text-xs leading-relaxed">{msg.thinkingTrace.userPerspectiveAnalysis}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                          <span className="font-extrabold text-indigo-300 block mb-1 text-xs">🔍 Subtext & Unstated Narrative Needs:</span>
                          <p className="text-slate-200 text-xs leading-relaxed">{msg.thinkingTrace.subtextAndUnstatedNeeds}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                          <span className="font-extrabold text-amber-300 block mb-1 text-xs">🔒 Story Bible Locks Compliance:</span>
                          <p className="text-slate-200 text-xs leading-relaxed">{msg.thinkingTrace.storyBibleLocksCheck}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                          <span className="font-extrabold text-purple-300 block mb-1 text-xs">🎭 Dramatic & Narrative Reasoning:</span>
                          <p className="text-slate-200 text-xs leading-relaxed">{msg.thinkingTrace.dramaticAndNarrativeReasoning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Markdown Text Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed max-w-full shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-none border border-amber-300 text-xs'
                      : 'bg-[#0e1628] text-slate-100 border border-white/15 rounded-bl-none'
                  }`}
                >
                  <div className="markdown-body prose prose-invert max-w-none text-xs leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>

                {/* INTERACTIVE LOCK CANDIDATE CARDS IN CHAT */}
                {msg.sender === 'ai' && msg.proposedLocks && msg.proposedLocks.length > 0 && (
                  <div className="w-full space-y-3 pt-1">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Candidate Story Parameter Locks Proposed by AI:</span>
                    </div>

                    {msg.proposedLocks.map((pl, pIdx) => {
                      const isAccepted = pl.status === 'accepted' || pl.isLocked;
                      const isRejected = pl.status === 'rejected';

                      return (
                        <div
                          key={pIdx}
                          className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                            isAccepted
                              ? 'bg-amber-950/30 border-amber-400/80 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                              : isRejected
                              ? 'bg-rose-950/20 border-rose-500/40 opacity-75'
                              : 'bg-[#0f172a] border-sky-400/60 shadow-xl'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-xs text-sky-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                              {pl.label}
                            </span>

                            {isAccepted ? (
                              <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 border border-amber-300">
                                <Lock className="w-3.5 h-3.5 text-slate-950" />
                                <span>LOCKED 🔒</span>
                              </span>
                            ) : isRejected ? (
                              <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                                REJECTED / DISCUSSING
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-400/30">
                                PROPOSAL PENDING
                              </span>
                            )}
                          </div>

                          {/* Proposed Value Display or Edit */}
                          {editingCardKey === pl.key ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCardValue}
                                onChange={(e) => setEditingCardValue(e.target.value)}
                                className="w-full bg-slate-950 border-2 border-sky-400 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none leading-relaxed"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCardKey(null)}
                                  className="px-3 py-1 rounded text-xs bg-slate-800 text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateLockValue(pl.key, editingCardValue);
                                    setEditingCardKey(null);
                                  }}
                                  className="px-3 py-1 rounded text-xs bg-sky-500 text-slate-950 font-extrabold"
                                >
                                  Save & Lock 🔒
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-white/10 leading-relaxed font-sans">
                              "{pl.value}"
                            </p>
                          )}

                          {/* Action Buttons: YES / NO > WHY / EDIT */}
                          {!isAccepted && !isRejected && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleAcceptIndividualLock(msg.id, pl)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4 text-slate-950" />
                                <span>YES — LOCK THIS 🔒</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectIndividualLock(msg.id, pl)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <X className="w-4 h-4 text-rose-400" />
                                <span>NO — DISCUSS & GIVE OPTIONS 💡</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCardKey(pl.key);
                                  setEditingCardValue(pl.value);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Edit Value</span>
                              </button>
                            </div>
                          )}

                          {/* Alternative Options if user wants options */}
                          {pl.alternatives && pl.alternatives.length > 0 && !isAccepted && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                              <span className="text-xs font-extrabold text-sky-300 block">
                                💡 Creative Alternative Options (Click to select & lock):
                              </span>
                              <div className="space-y-1">
                                {pl.alternatives.map((alt, aIdx) => (
                                  <button
                                    key={aIdx}
                                    type="button"
                                    onClick={() => handleSelectAlternative(msg.id, pl, alt)}
                                    className="w-full text-left p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between transition-colors cursor-pointer"
                                  >
                                    <span>• {alt}</span>
                                    <span className="text-[10px] font-extrabold text-sky-400 flex items-center gap-0.5">
                                      Select & Lock <ArrowUpRight className="w-3.5 h-3.5" />
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0d1424] border-2 border-sky-500/40 max-w-xl mx-auto text-sky-300 text-xs font-bold animate-pulse shadow-xl">
                <Brain className="w-5 h-5 text-sky-400 animate-spin shrink-0" />
                <span>Thinking deeply from your perspective, analyzing subtext, & formulating parameter options...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Chips & Input Area */}
          <div className="p-3.5 border-t border-white/15 bg-[#080c18] shrink-0 space-y-2.5">
            {/* Quick Action Chips */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar text-xs">
              <button
                type="button"
                onClick={() => handleSendMessage("Analyze my user perspective, emotional subtext, and narrative intent for this story phase.")}
                className="px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <Brain className="w-3.5 h-3.5 text-sky-400" />
                <span>Analyze Subtext & Intent</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Propose new candidate parameters to lock for our current phase.")}
                className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Propose Locks for Phase {currentPhase}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Propose character psychology and voice registers (Shield, Whiplash, Leak, Stone) for my protagonist and antagonist.")}
                className="px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Refine Voice Registers</span>
              </button>

              <button
                type="button"
                onClick={onSwitchToHardcoreMode}
                className="px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-black"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Switch to Hardcore Mode</span>
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#0d1426] p-2 rounded-2xl border-2 border-white/15 focus-within:border-sky-400 shadow-inner"
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Discuss Phase ${currentPhase} ideas, parameter locks, or options... (Press Enter to send)`}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-24 custom-scrollbar leading-relaxed"
                rows={1}
              />

              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-slate-950 font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-lg flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>Discuss</span>
              </button>
            </form>
          </div>
        </div>

        {/* EXPANDABLE STORY BIBLE LOCKS SIDEBAR PANEL */}
        {showLocksDrawer && (
          <div className={`${isWideLocksDrawer ? 'w-[540px]' : 'w-96'} h-full shrink-0 transition-all duration-300 z-20`}>
            <StoryBibleLockPanel
              locksMap={locksMap}
              onToggleLock={handleToggleLock}
              onUpdateLockValue={handleUpdateLockValue}
              onAddCustomLock={handleAddCustomLock}
              proposedLocks={proposedLocks}
              onAcceptProposedLocks={handleAcceptProposedLocks}
              onRejectProposedLock={(key) => {
                setProposedLocks(prev => prev.filter(p => p.key !== key));
              }}
              onSelectAlternativeOption={(key, alt) => {
                handleUpdateLockValue(key, alt);
                setProposedLocks(prev => prev.filter(p => p.key !== key));
              }}
              onSyncToHardcore={onSwitchToHardcoreMode}
              storyBible={storyBible}
              isWideMode={isWideLocksDrawer}
              onToggleWideMode={() => setIsWideLocksDrawer(!isWideLocksDrawer)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
