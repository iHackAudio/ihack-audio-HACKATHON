import React, { useState, useEffect, useRef } from 'react';
import { Terminal, FolderOpen, File, Play, ChevronRight, HardDrive, Cpu, AlertCircle, RefreshCcw, Send, Settings, Eye, Lock, Globe, Power, Maximize2, Minimize2 } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
}

interface AgentConfig {
  enabled: boolean;
  systemInstruction: string;
  model: string;
}

interface SystemConfig {
  agentA: AgentConfig;
  agentB: AgentConfig;
  agentC: AgentConfig;
  allowAppMutation?: boolean;
}

const MODELS = [
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-latest",
  "gemini-pro-latest",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash-lite",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it"
];

interface JarvisConsoleProps {
  scriptingModel?: string;
  jojoApiKey?: string;
  jojoSystemInstruction?: string;
  jojoJsonProtocol?: boolean;
}

export function JarvisConsole({
  scriptingModel,
  jojoApiKey,
  jojoSystemInstruction,
  jojoJsonProtocol
}: JarvisConsoleProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] JOJO Uplink Established.']);
  const [inputTask, setInputTask] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchFiles = async (dir = '') => {
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        setCurrentPath(dir);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/agent-config');
      const data = await res.json();
      setSysConfig(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchConfig();
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams();
    if (jojoApiKey) params.append('key', jojoApiKey);
    if (scriptingModel) params.append('model', scriptingModel);
    if (jojoSystemInstruction) params.append('instruction', jojoSystemInstruction);
    if (jojoJsonProtocol) params.append('json_protocol', 'true');
    params.append('voice', 'Achernar'); // Default high-tech voice

    const ws = new WebSocket(`${protocol}//${location.host}/live?${params.toString()}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.glassBoxEvent) {
           setLogs(prev => [...prev, `[SYSTEM] ${msg.glassBoxEvent}`]);
        }
        if (msg.agentStream) {
           const { agentId, chunk } = msg.agentStream;
           setLogs(prev => {
             const newLogs = [...prev];
             const lastIdx = newLogs.length - 1;
             if (lastIdx >= 0 && newLogs[lastIdx].startsWith(`[${agentId}] `)) {
               newLogs[lastIdx] = newLogs[lastIdx] + chunk;
               return newLogs;
             } else {
               return [...prev, `[${agentId}] ${chunk}`];
             }
           });
        }
        if (msg.agentChat) {
           setLogs(prev => {
             const newLogs = [...prev];
             const lastIdx = newLogs.length - 1;
             if (lastIdx >= 0 && newLogs[lastIdx].startsWith(`[${msg.agentChat.agentId}] `)) {
               newLogs[lastIdx] = `[${msg.agentChat.agentId}] ${msg.agentChat.text}`;
               return newLogs;
             } else {
               return [...prev, `[${msg.agentChat.agentId}] ${msg.agentChat.text}`];
             }
           });
        }
        if (msg.agentStatus) {
           setAgentStatuses(prev => ({ ...prev, [msg.agentStatus.agentId]: msg.agentStatus.status }));
           if (msg.agentStatus.agentId === 'jarvis' && msg.agentStatus.status === 'idle') {
             setIsRunning(false);
             fetchFiles(currentPath);
           }
        }
        if (msg.error) {
           setLogs(prev => [...prev, `[ERROR] ${msg.error}`]);
           setIsRunning(false);
        }
        // Only output raw streams if we really need to, but it could be noisy.
      } catch (e) {}
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 5000); // Reconnect on drop
    };
  };

  const saveConfig = async (newConfig: SystemConfig) => {
    setSysConfig(newConfig);
    try {
      await fetch('/api/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      setLogs(prev => [...prev, `[SYSTEM] Agent configurations synced.`]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.isDirectory) {
      fetchFiles(file.path);
    } else {
      setSelectedFile(file.name);
      try {
        const res = await fetch(`/api/files/content/${encodeURIComponent(file.path)}`);
        const data = await res.json();
        setFileContent(data.content || '');
      } catch (e) {
        setFileContent('Error loading file.');
      }
    }
  };

  const executeJarvisCommand = async () => {
    if (!inputTask.trim()) return;
    setIsRunning(true);
    setLogs(prev => [...prev, `[USER] ${inputTask}`]);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
       wsRef.current.send(JSON.stringify({ text: inputTask }));
    } else {
       setLogs(prev => [...prev, `[ERROR] No live connection to JOJO.`]);
       setIsRunning(false);
    }
    
    setInputTask('');
  };

  const renderAgentConfig = (agentKey: keyof Omit<SystemConfig, 'allowAppMutation'>, title: string, desc: string, icon: any, defaultKeyMask: string) => {
    if (!sysConfig) return null;
    const config = sysConfig[agentKey] as AgentConfig;
    const status = agentStatuses[agentKey] || 'idle';
    return (
      <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                {title}
                {status !== 'idle' && <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>}
              </div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          </div>
          <button 
            onClick={() => saveConfig({ ...sysConfig, [agentKey]: { ...config, enabled: !config.enabled } })}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${config.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
          >
            <Power className="w-3 h-3" />
            {config.enabled ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/30 px-3 py-2 rounded-lg">
          <Lock className="w-3 h-3" /> Key: {defaultKeyMask}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Operational Brain</label>
          <select 
            value={config.model}
            onChange={(e) => saveConfig({ ...sysConfig, [agentKey]: { ...config, model: e.target.value } })}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500/50"
          >
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">System Directives</label>
          <textarea 
            value={config.systemInstruction}
            onChange={(e) => saveConfig({ ...sysConfig, [agentKey]: { ...config, systemInstruction: e.target.value } })}
            className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500/50 resize-none font-mono custom-scrollbar"
          />
        </div>
      </div>
    );
  };

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-[80vh] w-full flex gap-4 animate-fadeIn relative">
      {/* File System Panel (Collapsible) */}
      {showFiles && (
        <div className="w-1/3 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-xl shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-slate-900">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-bold tracking-wide">Workspace Files</h3>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => fetchFiles(currentPath)} className="text-slate-400 hover:text-white transition-colors">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setShowFiles(false)} className="text-slate-400 hover:text-white transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {currentPath && (
            <div className="px-4 pt-3 flex items-center gap-2 text-xs text-emerald-400 cursor-pointer hover:underline"
                 onClick={() => {
                   const parent = currentPath.split('/').slice(0, -1).join('/');
                   fetchFiles(parent);
                 }}>
              ← Back
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {files.map((f, i) => (
              <div key={i} 
                   onClick={() => handleFileClick(f)}
                   className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                {f.isDirectory ? <FolderOpen className="w-5 h-5 text-amber-400" /> : <File className="w-5 h-5 text-slate-400" />}
                <div className="flex flex-col flex-1 truncate">
                  <span className="text-sm text-slate-200 group-hover:text-white truncate">{f.name}</span>
                  {!f.isDirectory && <span className="text-[10px] text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>}
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center p-8 text-slate-500 text-sm">
                No files here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel (Collapsible) */}
      {showSettings && sysConfig && (
        <div className="w-[400px] bg-slate-950/90 backdrop-blur-xl border border-indigo-500/20 rounded-3xl flex flex-col overflow-hidden shadow-2xl shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h3 className="text-white font-bold">Active Swarm Reprogramming Board</h3>
            </div>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
            
            {/* App Core Mutation */}
            <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-indigo-400 font-bold text-sm">App Core Mutation</span>
                <span className="text-xs text-slate-400">Autonomously mutate app.tsx</span>
              </div>
              <button 
                 onClick={() => saveConfig({...sysConfig, allowAppMutation: !sysConfig.allowAppMutation})}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${sysConfig.allowAppMutation ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                {sysConfig.allowAppMutation ? '🔓 ACTIVE' : '🔒 INACTIVE'}
              </button>
            </div>

            {renderAgentConfig('agentC', 'Agent C', 'QC Critic / Gemma Core', <Globe className="w-5 h-5 text-fuchsia-400" />, 'System Default')}
            {renderAgentConfig('agentA', 'Agent A', 'Text Engine', <File className="w-5 h-5 text-sky-400" />, '••••EsXg')}
            {renderAgentConfig('agentB', 'Agent B', 'Communications Engine', <Cpu className="w-5 h-5 text-emerald-400" />, '••••RHtc')}
            
          </div>
        </div>
      )}

      {/* Console & Action Panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        
        <div className="flex gap-2 text-sm justify-between bg-slate-900/40 p-2 rounded-2xl border border-white/5 shrink-0">
           <div className="flex gap-2">
             <button onClick={() => setShowFiles(!showFiles)} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${showFiles ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
               <FolderOpen className="w-4 h-4" /> Files
             </button>
             <button onClick={() => setShowSettings(!showSettings)} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
               <Settings className="w-4 h-4" /> Telemetry Matrix
             </button>
           </div>
        </div>

        {selectedFile && showFiles && (
          <div className="h-1/3 bg-slate-900/80 rounded-3xl border border-white/10 overflow-hidden flex flex-col shrink-0">
            <div className="bg-slate-950 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400">{selectedFile}</span>
              <button onClick={() => setSelectedFile(null)} className="text-slate-500 hover:text-white"><Eye className="w-4 h-4" /></button>
            </div>
            <textarea 
              readOnly 
              value={fileContent} 
              className="flex-1 bg-transparent text-slate-300 font-mono text-[11px] p-4 outline-none resize-none custom-scrollbar" 
            />
          </div>
        )}

        {/* Real-time Glassbox / Terminal */}
        <div className="flex-1 bg-slate-950/90 border border-emerald-500/20 rounded-3xl overflow-hidden flex flex-col relative shadow-[0_0_40px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-50" />
          <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white tracking-widest uppercase text-sm">Agentic Terminal</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {agentStatuses['jarvis'] !== 'idle' ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
              )}
              <span className="text-emerald-500 font-mono tracking-widest uppercase opacity-80">JOJO Core {agentStatuses['jarvis'] === 'idle' ? 'Standby' : 'Online'}</span>
            </div>
          </div>

          {/* Chat / Logs Glassbox */}
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed flex flex-col gap-3 custom-scrollbar">
            {logs.map((log, idx) => (
              <div key={idx} className={`${
                log.startsWith('[USER]') ? 'text-emerald-300' : 
                log.startsWith('[ERROR]') ? 'text-rose-400' : 
                log.startsWith('[SYSTEM]') ? 'text-indigo-300 opacity-80' :
                'text-slate-300'} break-words whitespace-pre-wrap`}
              >
                {log}
              </div>
            ))}
            {isRunning && (
               <div className="text-emerald-500 opacity-70 animate-pulse flex items-center gap-2 mt-2">
                 <Cpu className="w-4 h-4 animate-spin-slow" /> [SYSTEM] Processing...
               </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-4 border-t border-white/10 bg-slate-900/50 shrink-0">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-emerald-500 font-mono select-none">❯</span>
              <input
                type="text"
                value={inputTask}
                onChange={e => setInputTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && executeJarvisCommand()}
                disabled={isRunning}
                placeholder="Give JOJO a task or ask about the workspace..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-10 pr-14 text-white font-mono text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={executeJarvisCommand}
                disabled={isRunning}
                className="absolute right-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
