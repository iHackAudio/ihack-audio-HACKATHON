import React, { useState, useEffect } from 'react';
import { 
  Terminal, Sparkles, MessageSquare, Sliders, Activity, 
  Layers, ArrowLeft, Cpu, Volume2, ShieldCheck, Film, 
  TerminalSquare, RefreshCw
} from 'lucide-react';
import ChatPanel from './components/ChatPanel';
import { JarvisConsole } from './components/JarvisConsole';
import SimplifiedPipelineDemo from './components/SimplifiedPipelineDemo';
import SubtextDiscussionStudio from './components/SubtextDiscussionStudio';
import LiveLogPanel from './components/LiveLogPanel';
import SettingsPanel from './components/SettingsPanel';
import StressTestPanel from './components/StressTestPanel';
import DevTimeWidget from './components/DevTimeWidget';
import VoiceModal from '../ihack-audio-tts/components/VoiceModal';
import { useVoiceSession } from './hooks/useVoiceSession';
import { MessageBus } from './utils/MessageBus';
import { ChatMessage } from './types/index';
import { StoryBible, createDefaultStoryBible } from './types/storyBible';

interface JarvisScriptingAppProps {
  onBackToHub?: () => void;
}

export type JarvisSubView = 'AURA' | 'CONSOLE' | 'PIPELINE' | 'SUBTEXT' | 'SETTINGS';

const baseBible = createDefaultStoryBible();
const DEFAULT_STORY_BIBLE: StoryBible = {
  ...baseBible,
  concept: {
    ...baseBible.concept,
    title: 'The Neural Cipher',
    hook: 'A cognitive engineer discovers an encoded AI heartbeat deep inside an obsolete mainframe.',
    summary: 'A thrilling investigative narrative through high-stakes audio intelligence and neural voice synthesis.',
    genre: 'Cyber-Thriller / Sci-Fi Audio Drama',
    targetEmotion: 'Suspense and Awe',
    tone: 'Cinematic Noir, Hyper-Analytical',
    targetAudience: 'Audiophiles & Narrative Fiction Listeners'
  },
  characterProfiles: [
    {
      id: 'char_1',
      name: 'Agent Vance',
      role: 'protagonist',
      age: '34',
      vocalProfile: 'Crisp, measured, subtle Australian undertone',
      voiceId: 'Puck',
      background: 'Former counter-intelligence signal auditor',
      speechQuirks: 'Speaks in precise, clipped cadences',
      motivations: 'Uncover the encrypted truth before the network self-destructs',
      isLocked: true
    }
  ]
};

export const JarvisScriptingApp: React.FC<JarvisScriptingAppProps> = ({ onBackToHub }) => {
  const [subView, setSubView] = useState<JarvisSubView>('PIPELINE');
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const voiceSession = useVoiceSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'active' | 'idle' | 'offline' | 'working' | 'thinking' | 'preparing' | 'sending'>>({
    jarvis: 'idle',
    agentA: 'idle',
    agentB: 'idle',
    agentC: 'idle'
  });
  const [activeProtocol, setActiveProtocol] = useState<string>('protocol1');
  const [storyBible, setStoryBible] = useState<StoryBible>(DEFAULT_STORY_BIBLE);

  useEffect(() => {
    fetch('/api/protocols')
      .then(res => res.json())
      .then(data => {
        if (data && data.activeProtocol) {
          setActiveProtocol(data.activeProtocol);
        }
      })
      .catch(() => {});

    const unsub = MessageBus.subscribe('protocol_changed', (protocolId: string) => {
      setActiveProtocol(protocolId);
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Stage Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
              >
                <ArrowLeft className="w-4 h-4" /> Hub
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Stage 2</span>
                <span className="text-slate-500">•</span>
                <h1 className="text-sm font-black text-white font-mono tracking-tight uppercase">Jarvis Scripting & Agent Pipeline</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Cinematic 5-Phase Script Progression, Subtext Engineering & JOJO Console</p>
            </div>
          </div>

          {/* Sub-view switcher tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSubView('PIPELINE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'PIPELINE'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Cinematic Pipeline
            </button>
            <button
              onClick={() => setSubView('AURA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'AURA'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Jarvis Aura
            </button>
            <button
              onClick={() => setSubView('CONSOLE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'CONSOLE'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              JOJO Console
            </button>
            <button
              onClick={() => setSubView('SUBTEXT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'SUBTEXT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Subtext Studio
            </button>
            <button
              onClick={() => setSubView('SETTINGS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                subView === 'SETTINGS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Settings & Logs
            </button>
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-2">
            <DevTimeWidget />
            <button
              onClick={() => setShowVoiceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Voice Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full overflow-y-auto">
        {subView === 'PIPELINE' && (
          <div className="w-full">
            <SimplifiedPipelineDemo onAttachToMainSystem={() => setSubView('AURA')} />
          </div>
        )}

        {subView === 'AURA' && (
          <div className="max-w-[1800px] mx-auto p-6 h-[calc(100vh-80px)]">
            <ChatPanel
              voiceHook={voiceSession}
              messages={messages}
              setMessages={setMessages}
              setAgentStatuses={setAgentStatuses}
            />
          </div>
        )}

        {subView === 'CONSOLE' && (
          <div className="max-w-[1800px] mx-auto p-6">
            <JarvisConsole />
          </div>
        )}

        {subView === 'SUBTEXT' && (
          <div className="max-w-[1800px] mx-auto p-6">
            <SubtextDiscussionStudio
              storyBible={storyBible}
              onUpdateStoryBible={setStoryBible}
              onSwitchToHardcoreMode={() => setSubView('PIPELINE')}
            />
          </div>
        )}

        {subView === 'SETTINGS' && (
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            <SettingsPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveLogPanel onClose={() => setSubView('AURA')} />
              <StressTestPanel />
            </div>
          </div>
        )}
      </main>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <VoiceModal onClose={() => setShowVoiceModal(false)} sessionHook={voiceSession} />
      )}
    </div>
  );
};

export default JarvisScriptingApp;
