import React, { useState, useEffect } from 'react';
import { Save, Flame, Network, Zap, Cpu, HelpCircle, Shield, Eye, Compass, LogIn, LogOut, Mic2 } from 'lucide-react';
import { MessageBus } from '../utils/MessageBus';
import { initAuth, googleSignIn, logout, getAccessToken } from '../utils/auth';

export default function SettingsPanel() {
  const [jarvisKey, setJarvisKey] = useState('');
  const [textKey, setTextKey] = useState('');
  const [groqKey, setGroqKey] = useState('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');
  
  const [jarvisModelLive, setJarvisModelLive] = useState('gemini-3.1-flash-live-preview');
  
  const [agentAKey, setAgentAKey] = useState('AIzaSyAmTIhQLjiG2UGUIKuIJ8lEuy-33M6EsXg');
  
  const [agentBKey, setAgentBKey] = useState('AIzaSyBqtio3nymw7gkRXa0sUC0nCB9GEyxRHtc');
  
  const [configs, setConfigs] = useState<any>({
    agentA: { enabled: true, systemInstruction: '', model: 'gemini-3.1-flash-lite' },
    agentB: { enabled: true, systemInstruction: '', model: 'gemini-3.1-flash-lite' },
    agentC: { enabled: true, systemInstruction: '', model: 'gemma-4-31b-it' },
    jarvis: { systemInstruction: 'JARVIS_SYSTEM_INSTRUCTION', textModel: 'gemini-3.1-flash-lite' },
    resolved: {}
  });
  
  const [protocols, setProtocols] = useState<any[]>([]);
  const [activeProtocol, setActiveProtocol] = useState('');
  const [modelMap, setModelMap] = useState<any>({});
  const [defaultJarvisInstruction, setDefaultJarvisInstruction] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Auth Initialization
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    // Drop old local storage key from previous version if it exists
    localStorage.removeItem('jarvis_instruction');

    fetch('/api/agent-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.agentA) {
          setConfigs(data);
        }
      })
      .catch(err => console.error("Error loading server agent-config:", err));

    fetch('/api/models')
      .then(r => r.json())
      .then(data => setModelMap(data || {}))
      .catch(err => console.error("Failed to load models:", err));

    fetch('/api/protocols')
      .then(res => res.json())
      .then(data => {
        if (data && data.activeProtocol) {
          setActiveProtocol(data.activeProtocol);
          setProtocols(Object.entries(data.protocols).map(([id, info]: [any, any]) => ({ id, ...info })));
        }
      });

    fetch('/api/system-instructions')
      .then(res => res.json())
      .then(data => {
        if (data && data.jarvis) {
          setDefaultJarvisInstruction(data.jarvis);
        }
      })
      .catch(err => console.error("Error loading system instructions:", err));

    const mlive = localStorage.getItem('jarvis_model_live');
    if (mlive) setJarvisModelLive(mlive);
    
    // Cleanup old local storage as we use backend config per-protocol now
    localStorage.removeItem('jarvis_instruction_v2');

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleProtocolChange = (id: string) => {
    fetch('/api/protocols/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId: id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setActiveProtocol(id);
        MessageBus.publish('protocol_changed', id);
        // FORCE refresh all agent configurations and system instructions
        fetch('/api/agent-config').then(res => res.json()).then(setConfigs);
        fetch('/api/system-instructions')
          .then(res => res.json())
          .then(instrData => {
            if (instrData && instrData.jarvis) {
              setDefaultJarvisInstruction(instrData.jarvis);
              // It's safe to just rely on the configs object fetched right above
            }
          });
      }
    });
  };

  const handleSave = () => {
    const nextConfigs = { ...configs };
    fetch('/api/agent-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextConfigs)
    })
    .catch(err => console.error("Failed to save server dynamic settings:", err));

    localStorage.setItem('jarvis_model_live', jarvisModelLive);
    alert('Settings saved!');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      {/* Header telemetry info bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Zap className="w-4 h-4 text-[#00d2ff]" />
             <h2 className="text-xl font-semibold text-white tracking-tight">System Settings</h2>
           </div>
           
           {/* Google Auth Button */}
           <div className="border-l border-white/20 pl-4">
             {needsAuth ? (
               <button onClick={async () => {
                  try {
                    await googleSignIn();
                  } catch(e) { console.error('Sign In error:', e); }
               }}
               className="px-3 py-1.5 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 border border-[#4285F4]/50 rounded flex items-center gap-2 text-xs font-mono text-[#4285F4] transition-colors">
                 <LogIn className="w-3 h-3" /> Connect Google Workspace
               </button>
             ) : (
               <div className="flex items-center gap-3">
                 <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {user?.email || "Workspace Connected"}
                 </span>
                 <button onClick={logout} className="p-1 hover:bg-red-500/10 rounded text-red-500/70 hover:text-red-400 transition-colors">
                    <LogOut className="w-3 h-3" />
                 </button>
               </div>
             )}
           </div>
        </div>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Save className="w-4 h-4" /> Save Phase Config
        </button>
      </div>

      {/* Protocol Switcher - High Visibility */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-1 bg-black/40 rounded-xl border border-white/10 shadow-2xl">
        {protocols.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => handleProtocolChange(p.id)}
            className={`flex flex-col items-center py-5 px-6 rounded-lg transition-all duration-500 group relative overflow-hidden ${
              activeProtocol === p.id 
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] z-10 scale-[1.02]' 
                : 'text-white/20 hover:text-white/40 hover:bg-white/5'
            }`}
          >
            {activeProtocol === p.id && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-[#00d2ff] shadow-[0_0_10px_#00d2ff]"></div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              {idx === 0 ? <Zap className={`w-4 h-4 ${activeProtocol === p.id ? 'text-[#00d2ff]' : 'text-current'}`} /> : idx === 1 ? <Network className={`w-4 h-4 ${activeProtocol === p.id ? 'text-[#00d2ff]' : 'text-current'}`} /> : <Cpu className={`w-4 h-4 ${activeProtocol === p.id ? 'text-[#00d2ff]' : 'text-current'}`} />}
              <span className="text-[12px] font-black uppercase tracking-[0.25em] font-mono leading-none">
                {p.name || p.id}
              </span>
            </div>
            <span className={`text-[9px] uppercase tracking-[0.3em] font-mono opacity-50 font-bold ${activeProtocol === p.id ? 'text-black/60' : 'text-white/40'}`}>
              {p.id.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end mb-4 px-2">
        <button 
          onClick={() => setShowGroq(!showGroq)}
          className={`px-3 py-1.5 rounded text-[10px] font-bold font-mono transition-all border flex items-center gap-2 ${
            showGroq 
              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
              : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'
          }`}
        >
          <Flame className={`w-3 h-3 ${showGroq ? 'animate-pulse' : ''}`} />
          {showGroq ? 'DEACTIVATE HYPER-PERFORMANCE CORES' : 'REVEAL GROQ MULTIVERSE CORES'}
        </button>
      </div>

      <div className="space-y-6">
         {/* Active Swarm Reprogramming Board */}
         {configs && (
           <section className="bg-[#0c0e14] border border-[#00d2ff]/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,210,255,0.05)] relative">
             <div className="absolute top-0 left-0 w-[2px] h-full bg-[#00d2ff]"></div>
             <div className="px-6 py-4 border-b border-white/5 bg-[#1a1e26]/50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-[#00d2ff] rounded-full animate-pulse"></span>
                 <div>
                   <h3 className="font-medium text-white tracking-tight">Active Swarm Reprogramming Board</h3>
                   <p className="text-[10px] text-[#00d2ff]/60 font-mono mt-0.5">Real-Time Swarm Overrides & Focused Editing Panel</p>
                 </div>
               </div>
               
                <div className="flex items-center gap-3">
                   <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">App Core Mutation</span>
                  <button
                    onClick={() => {
                      const next = { ...configs };
                      next.allowAppMutation = !next.allowAppMutation;
                      setConfigs(next);
                    }}
                    className={`px-3 py-1 rounded text-[10px] font-bold font-mono transition-all border ${
                      configs.allowAppMutation 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {configs.allowAppMutation ? '🔓 AUTONOMOUS OVERRIDE ACTIVE' : '🔒 ENCLOSED SANDBOX ONLY'}
                  </button>
                </div>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
               
               {/* Agent A control slot */}
               <div className={`p-4 rounded-xl border transition-all ${configs.agentA?.enabled ? 'bg-[#121620]/40 border-[#00d2ff]/20 shadow-[inset_0_0_10px_rgba(0,210,255,0.01)]' : 'bg-[#111215]/30 border-white/5 opacity-60'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div>
                      <h4 className="font-semibold text-white text-[11px] flex flex-col gap-1">
                        Agent A
                        <span className="text-[8px] text-[#00d2ff] bg-[#00d2ff]/10 px-1 py-0.5 rounded border border-[#00d2ff]/10 font-mono w-max">
                           {protocols.find(p => p.id === activeProtocol)?.name?.toUpperCase() || 'UNKNOWN PROTOCOL'}
                        </span>
                      </h4>
                     <p className="text-[9px] text-emerald-400/50 font-mono mt-1 select-all">
                       🔑 Key: {agentAKey ? `••••${agentAKey.slice(-4)}` : (textKey ? "Inherited" : "System")}
                     </p>
                   </div>
                   <button
                     onClick={() => {
                       const next = { ...configs, agentA: { ...configs.agentA, enabled: !configs.agentA?.enabled } };
                       setConfigs(next);
                     }}
                     className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${configs.agentA?.enabled ? 'bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30' : 'bg-white/5 text-white/40 border-white/10'}`}
                   >
                     {configs.agentA?.enabled ? '🟢 ONLINE' : '🔴 SHUTDOWN'}
                   </button>
                 </div>
                 
                 <div className="space-y-3">
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">Operational Brain</label>
                     <select 
                        value={configs.agentA?.model || 'groq/openai/gpt-oss-120b'}
                        onChange={(e) => {
                          const next = { ...configs, agentA: { ...configs.agentA, model: e.target.value } };
                          setConfigs(next);
                        }}
                        className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00d2ff]"
                      >
                        
                        <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                        <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="groq/openai/gpt-oss-120b">groq/openai/gpt-oss-120b</option>
                        <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                        <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                        <option value="mimo/mimo-v2.5-pro-ultraspeed">mimo/mimo-v2.5-pro-ultraspeed</option>
                        <option value="groq/groq/compound">groq/groq/compound</option>
                        <option value="groq/gemma-4-31b-it">groq/gemma-4-31b-it</option>
                        <option value="groq/groq/compound-mini">groq/groq/compound-mini</option>
                        <option value="groq/allam-2-7b">groq/allam-2-7b</option>
                        <option value="groq/llama-3.3-70b-versatile">groq/llama-3.3-70b-versatile</option>
                      </select>
                   </div>
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">System Directives</label>
                     <textarea 
                       value={configs.agentA?.systemInstruction === 'AGENT_A_SYSTEM_INSTRUCTION' ? (configs.resolved?.agentA || 'MANAGED_BY_PROTOCOL') : (configs.agentA?.systemInstruction || '')}
                       onChange={(e) => {
                         const next = { ...configs, agentA: { ...configs.agentA, systemInstruction: e.target.value } };
                         setConfigs(next);
                       }}
                       placeholder="Dynamic protocol instruction..."
                       className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white h-24 focus:outline-none focus:border-[#00d2ff] font-mono resize-none overflow-y-auto"
                     />
                   </div>
                 </div>
               </div>

               {/* Agent B control slot */}
               <div className={`p-4 rounded-xl border transition-all ${configs.agentB?.enabled ? 'bg-[#121620]/40 border-[#00d2ff]/20 shadow-[inset_0_0_10px_rgba(0,210,255,0.01)]' : 'bg-[#111215]/30 border-white/5 opacity-60'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div>
                      <h4 className="font-semibold text-white text-[11px] flex flex-col gap-1">
                        Agent B
                        <span className="text-[8px] text-[#00d2ff] bg-[#00d2ff]/10 px-1 py-0.5 rounded border border-[#00d2ff]/10 font-mono w-max">
                           {protocols.find(p => p.id === activeProtocol)?.name?.toUpperCase() || 'UNKNOWN PROTOCOL'}
                        </span>
                      </h4>
                     <p className="text-[9px] text-indigo-400/50 font-mono mt-1 select-all">
                       🔑 Key: {agentBKey ? `••••${agentBKey.slice(-4)}` : (textKey ? "Inherited" : "System")}
                     </p>
                   </div>
                   <button
                     onClick={() => {
                       const next = { ...configs, agentB: { ...configs.agentB, enabled: !configs.agentB?.enabled } };
                       setConfigs(next);
                     }}
                     className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${configs.agentB?.enabled ? 'bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30' : 'bg-white/5 text-white/40 border-white/10'}`}
                   >
                     {configs.agentB?.enabled ? '🟢 ONLINE' : '🔴 SHUTDOWN'}
                   </button>
                 </div>
                 
                 <div className="space-y-3">
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">Operational Brain</label>
                     <select 
                        value={configs.agentB?.model || 'groq/openai/gpt-oss-120b'}
                        onChange={(e) => {
                          const next = { ...configs, agentB: { ...configs.agentB, model: e.target.value } };
                          setConfigs(next);
                        }}
                        className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00d2ff]"
                      >
                        
                        <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                        <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="groq/openai/gpt-oss-120b">groq/openai/gpt-oss-120b</option>
                        <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                        <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                        <option value="mimo/mimo-v2.5-pro-ultraspeed">mimo/mimo-v2.5-pro-ultraspeed</option>
                        <option value="groq/groq/compound">groq/groq/compound</option>
                        <option value="groq/gemma-4-31b-it">groq/gemma-4-31b-it</option>
                        <option value="groq/groq/compound-mini">groq/groq/compound-mini</option>
                        <option value="groq/allam-2-7b">groq/allam-2-7b</option>
                        <option value="groq/llama-3.3-70b-versatile">groq/llama-3.3-70b-versatile</option>
                      </select>
                   </div>
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">System Directives</label>
                     <textarea 
                       value={configs.agentB?.systemInstruction === 'AGENT_B_SYSTEM_INSTRUCTION' ? (configs.resolved?.agentB || 'MANAGED_BY_PROTOCOL') : (configs.agentB?.systemInstruction || '')}
                       onChange={(e) => {
                         const next = { ...configs, agentB: { ...configs.agentB, systemInstruction: e.target.value } };
                         setConfigs(next);
                       }}
                       placeholder="Dynamic protocol instruction..."
                       className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white h-24 focus:outline-none focus:border-[#00d2ff] font-mono resize-none overflow-y-auto"
                     />
                   </div>
                 </div>
               </div>

               {/* Agent C control slot */}
               <div className={`p-4 rounded-xl border transition-all ${configs.agentC?.enabled ? 'bg-[#121620]/40 border-[#00d2ff]/20 shadow-[inset_0_0_10px_rgba(0,210,255,0.01)]' : 'bg-[#111215]/30 border-white/5 opacity-60'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div>
                     <h4 className="font-semibold text-white text-[11px] flex flex-col gap-1">
                        Agent C
                        <span className="text-[8px] text-[#00d2ff] bg-[#00d2ff]/10 px-1 py-0.5 rounded border border-[#00d2ff]/10 font-mono w-max">
                           {protocols.find(p => p.id === activeProtocol)?.name?.toUpperCase() || 'UNKNOWN PROTOCOL'}
                        </span>
                      </h4>
                     <p className="text-[9px] text-[#00d2ff]/40 font-mono mt-1 select-all">
                       🔑 Key: {textKey ? `••••${textKey.slice(-4)}` : "System Default"}
                     </p>
                   </div>
                   <button
                     onClick={() => {
                       const next = { ...configs, agentC: { ...configs.agentC, enabled: !configs.agentC?.enabled } };
                       setConfigs(next);
                     }}
                     className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${configs.agentC?.enabled ? 'bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30' : 'bg-white/5 text-white/40 border-white/10'}`}
                   >
                     {configs.agentC?.enabled ? '🟢 ONLINE' : '🔴 SHUTDOWN'}
                   </button>
                 </div>
                 
                 <div className="space-y-3">
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">Operational Brain</label>
                     <select 
                        value={configs.agentC?.model || 'groq/openai/gpt-oss-120b'}
                        onChange={(e) => {
                          const next = { ...configs, agentC: { ...configs.agentC, model: e.target.value } };
                          setConfigs(next);
                        }}
                        className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00d2ff]"
                      >
                        
                        <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                        <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="groq/openai/gpt-oss-120b">groq/openai/gpt-oss-120b</option>
                        <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                        <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                        <option value="mimo/mimo-v2.5-pro-ultraspeed">mimo/mimo-v2.5-pro-ultraspeed</option>
                        <option value="groq/groq/compound">groq/groq/compound</option>
                        <option value="groq/gemma-4-31b-it">groq/gemma-4-31b-it</option>
                        <option value="groq/groq/compound-mini">groq/groq/compound-mini</option>
                        <option value="groq/allam-2-7b">groq/allam-2-7b</option>
                        <option value="groq/llama-3.3-70b-versatile">groq/llama-3.3-70b-versatile</option>
                      </select>
                   </div>
                   <div>
                     <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">System Directives</label>
                     <textarea 
                       value={configs.agentC?.systemInstruction === 'AGENT_C_SYSTEM_INSTRUCTION' ? (configs.resolved?.agentC || 'MANAGED_BY_PROTOCOL') : (configs.agentC?.systemInstruction || '')}
                       onChange={(e) => {
                         const next = { ...configs, agentC: { ...configs.agentC, systemInstruction: e.target.value } };
                          setConfigs(next);
                       }}
                       placeholder="Dynamic protocol instruction..."
                       className="w-full bg-[#171a22] border border-white/10 rounded p-1.5 text-xs text-white h-24 focus:outline-none focus:border-[#00d2ff] font-mono resize-none overflow-y-auto"
                     />
                   </div>
                 </div>
               </div>

             </div>
           </section>
         )}

         {/* Groq Multiverse Cores Configuration Matrix */}
         {showGroq && (
          <section className="bg-[#0c0e14] border border-amber-500/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)] relative mb-6">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="px-6 py-4 border-b border-white/5 bg-[#1a1e26]/50 flex justify-between items-center mr-[2px]">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-medium text-white text-sm">Groq Hyper-Performance Multiverse Cores</h3>
                  <p className="text-[10px] text-amber-500/70 font-mono mt-0.5">Ultra-Low Latency Inference Uplinks (Groq, Inc.)</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">Active Subsystem</span>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs text-white/50 mb-1 block font-medium">Groq Cloud API Key</label>
                <input 
                  type="password" 
                  value={groqKey} 
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-[#1a1e26] border border-amber-500/30 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" 
                />
                <p className="text-[10px] text-white/45 mt-1.5 font-sans">Saved securely in local storage and backend configuration schema.</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#00d2ff] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Network className="w-3 h-3" /> Registered Core Matrix Co-Processors</h4>
              </div>
            </div>
          </section>
         )}

          {/* Jarvis Agent Configuration (Commander Panel - Brain & Voice) */}
          <section className="bg-[#0c0e14] border border-[#00d2ff]/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,210,255,0.05)] relative mb-6">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#00d2ff]"></div>
             <div className="px-6 py-4 border-b border-white/5 bg-[#1a1e26]/50 flex justify-between items-center">
               <div>
                 <h3 className="font-medium text-white flex items-center gap-2 text-sm">
                    Commander: J.A.R.V.I.S. (The Brain)
                    <span className="text-[9px] text-[#00d2ff] bg-[#00d2ff]/10 px-2 py-0.5 rounded border border-[#00d2ff]/20 font-mono">
                      {protocols.find(p => p.id === activeProtocol)?.name?.toUpperCase() || 'UNKNOWN PROTOCOL'}
                    </span>
                 </h3>
                <p className="text-[9px] text-[#00d2ff]/50 font-mono mt-1 select-all">
                  🔑 Voice API Key: {jarvisKey ? `••••${jarvisKey.slice(-4)}` : "System Default"} | Text API Key: {textKey ? `••••${textKey.slice(-4)}` : "System Default"}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[#00d2ff] text-black px-3 py-1 rounded shadow-[0_0_15px_rgba(0,210,255,0.4)] font-mono">Commander</span>
            </div>
           <div className="p-6 space-y-6">
             
             <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider mb-2 block">System Instruction</label>
                <textarea 
                  className="w-full bg-[#1a1e26] border border-white/5 rounded-lg p-3 text-sm text-white min-h-[120px] outline-none focus:border-[#00d2ff]/50 resize-y transition-colors font-mono overflow-y-auto"
                   value={configs.jarvis?.systemInstruction === 'JARVIS_SYSTEM_INSTRUCTION' ? (configs.resolved?.jarvis || defaultJarvisInstruction) : (configs.jarvis?.systemInstruction || '')}
                  onChange={(e) => {
                       const next = { ...configs, jarvis: { ...(configs.jarvis || {}), systemInstruction: e.target.value } };
                       setConfigs(next);
                  }}
                  placeholder={defaultJarvisInstruction || "Default system instruction..."}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#1a1e26]/30 border border-white/5 rounded-xl">
               <div>
                  <h4 className="text-xs font-semibold text-white/80 mb-4 uppercase tracking-wider flex items-center gap-2"><Mic2 className="w-3 h-3 text-[#00d2ff]" /> Live Voice Synthesis</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-white/50 mb-1 block uppercase">Voice Identity (Gemini Live)</label>
                      <select 
                        value={localStorage.getItem('jarvis_voice') || 'Despina'}
                        onChange={(e) => {
                          localStorage.setItem('jarvis_voice', e.target.value);
                          window.location.reload(); 
                        }}
                        className="w-full bg-[#1a1e26] border border-[#00d2ff]/30 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-mono"
                      >
                        <option value="Puck">Puck (Energetic)</option>
                        <option value="Charon">Charon (Deep/Calm)</option>
                        <option value="Kore">Kore (Bright)</option>
                        <option value="Fenrir">Fenrir (Gravelly)</option>
                        <option value="Aoede">Aoede (Clear)</option>
                        <option value="Despina">Despina (Default)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-white/50 mb-1 block uppercase">Live API Key (Gemini)</label>
                      <input 
                        type="password" 
                        value={jarvisKey} 
                        onChange={(e) => setJarvisKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-[#1a1e26] border border-[#00d2ff]/30 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-white/50 mb-1 block uppercase">Live Model</label>
                      <input 
                        type="text" 
                        value={jarvisModelLive} 
                        onChange={(e) => setJarvisModelLive(e.target.value)}
                        placeholder="gemini-3.1-flash-live-preview"
                        className="w-full bg-[#1a1e26] border border-[#00d2ff]/30 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-mono" 
                      />
                    </div>
                  </div>
               </div>
               
               <div className="md:border-l border-white/5 md:pl-6">
                  <h4 className="text-xs font-semibold text-white/80 mb-4 uppercase tracking-wider">Text Mode Uplink</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-white/50 mb-1 block uppercase">Text API Key</label>
                       <input 
                        type="password" 
                        value={textKey} 
                        onChange={(e) => setTextKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-[#1a1e26] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-white/50 uppercase tracking-wider mb-1 block">Operational Brain</label>
                      <select 
                        value={configs.jarvis?.textModel || 'gemini-3.1-flash-lite'}
                        onChange={(e) => {
                          const next = { ...configs, jarvis: { ...(configs.jarvis || {}), textModel: e.target.value } };
                          setConfigs(next);
                        }}
                        className="w-full bg-[#1a1e26] border border-[#00d2ff]/30 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-mono"
                      >
                        
                        <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                        <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="groq/openai/gpt-oss-120b">groq/openai/gpt-oss-120b</option>
                        <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                        <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                        <option value="mimo/mimo-v2.5-pro-ultraspeed">mimo/mimo-v2.5-pro-ultraspeed</option>
                        <option value="groq/groq/compound">groq/groq/compound</option>
                        <option value="gemma-4-31b-it">gemma-4-31b-it</option>
                        <option value="groq/groq/compound-mini">groq/groq/compound-mini</option>
                        <option value="groq/allam-2-7b">groq/allam-2-7b</option>
                        <option value="groq/llama-3.3-70b-versatile">groq/llama-3.3-70b-versatile</option>
                      </select>
                    </div>
                  </div>
               </div>
             </div>

           </div>
         </section>

         <section className="bg-[#0c0e14] border border-white/10 rounded-xl p-6 mt-6">
           <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Network className="w-4 h-4 text-white/50" /> Backup Models / Fallback Chain
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {Object.entries(modelMap).map(([agent, models]: [string, any]) => (
               <div key={agent} className="bg-[#1a1e26]/30 p-3 rounded-lg border border-white/5">
                 <h4 className="text-xs text-[#00d2ff] uppercase font-mono mb-2">{agent}</h4>
                 <div className="flex flex-wrap gap-2">
                   {(Array.isArray(models) ? models : typeof models === "string" ? [models] : []).map((m: string, i: number) => (
                     <span key={i} className="text-[10px] font-mono bg-white/5 text-white/60 px-2 py-1 rounded">
                       {i === 0 ? 'Primary: ' : ''}{m}
                     </span>
                   ))}
                 </div>
               </div>
             ))}
           </div>
         </section>

      </div>
    </div>
  );
}
