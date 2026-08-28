import React, { useState, useEffect } from 'react';
import { 
  TerminalSquare, ArrowLeft, Cpu, Sparkles, MessageSquare, 
  Settings, Activity, Zap, Layers, RefreshCw, Send, ShieldAlert,
  Server, HardDrive
} from 'lucide-react';
import ChatPanel from '../src/components/ChatPanel';
import SettingsPanel from '../src/components/SettingsPanel';
import LiveLogPanel from '../src/components/LiveLogPanel';
import StressTestPanel from '../src/components/StressTestPanel';
import DevTimeWidget from '../src/components/DevTimeWidget';
import { JarvisConsole } from './JarvisConsole';
import { MessageBus } from '../src/utils/MessageBus';
import { ChatMessage } from '../src/types/index';

interface JarvisAuraAppProps {
  onBackToHub?: () => void;
}

export default function JarvisAuraApp({ onBackToHub }: JarvisAuraAppProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'console' | 'protocols' | 'logs' | 'stress'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'active' | 'idle' | 'offline' | 'working' | 'thinking' | 'preparing' | 'sending'>>({
    jarvis: 'idle',
    agentA: 'idle',
    agentB: 'idle',
    agentC: 'idle'
  });
  const [activeProtocol, setActiveProtocol] = useState<string>('protocol1');

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

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="h-14 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          {onBackToHub && (
            <button 
              onClick={onBackToHub}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TerminalSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2 font-mono">
                JARVIS <span className="text-[#00d2ff]">AURA SCRIPTING</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {activeProtocol}
                </span>
              </h1>
            </div>
          </div>
          <DevTimeWidget />
        </div>

        {/* Live Agent Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5">
          {Object.entries(agentStatuses).map(([agent, status]) => {
            const isActive = status === 'working' || status === 'preparing' || status === 'thinking';
            return (
              <div key={agent} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00d2ff] animate-pulse shadow-[0_0_8px_#00d2ff]' : 'bg-white/20'}`} />
                <span className={`capitalize text-[11px] ${isActive ? 'text-[#00d2ff] font-bold' : 'text-slate-400'}`}>
                  {agent}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Console
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'protocols'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Protocols
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Logs
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'stress'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Stress Test
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="h-full w-full p-4 overflow-y-auto">
            <ChatPanel 
              messages={messages} 
              setMessages={setMessages}
              setAgentStatuses={setAgentStatuses}
            />
          </div>
        )}
        {activeTab === 'console' && (
          <div className="h-full w-full p-6 overflow-y-auto">
            <JarvisConsole />
          </div>
        )}
        {activeTab === 'protocols' && (
          <div className="h-full w-full p-6 overflow-y-auto max-w-[1600px] mx-auto">
            <SettingsPanel />
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="h-full w-full p-6 overflow-y-auto max-w-[1600px] mx-auto">
            <LiveLogPanel onClose={() => setActiveTab('chat')} />
          </div>
        )}
        {activeTab === 'stress' && (
          <div className="h-full w-full p-6 overflow-y-auto max-w-[1600px] mx-auto">
            <StressTestPanel />
          </div>
        )}
      </div>
    </div>
  );
}
