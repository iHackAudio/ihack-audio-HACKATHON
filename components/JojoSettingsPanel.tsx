import React from 'react';
import { Settings, Cpu, ShieldCheck, Key, RefreshCcw, Save } from 'lucide-react';
import { JOJO_MODELS } from '../constants';
import { Button } from './Button';

interface JojoSettingsPanelProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  systemInstruction: string;
  onSystemInstructionChange: (instruction: string) => void;
  jsonProtocol: boolean;
  onJsonProtocolChange: (active: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}

export function JojoSettingsPanel({
  selectedModel,
  onModelChange,
  apiKey,
  onApiKeyChange,
  systemInstruction,
  onSystemInstructionChange,
  jsonProtocol,
  onJsonProtocolChange,
  onApply,
  onReset
}: JojoSettingsPanelProps) {
  return (
    <div className="glass-panel p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Settings className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-white">Neural Config</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">Dynamic Engine & Protocol Management</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button onClick={onReset} variant="outline" size="xs" icon={<RefreshCcw className="w-3 h-3" />} className="h-8 px-3 rounded-lg text-[9px] font-black uppercase">Reset</Button>
           <Button onClick={onApply} glowColor="indigo" size="xs" icon={<Save className="w-3 h-3" />} className="h-8 px-3 rounded-lg text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-500 text-white">Apply</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
            <Cpu className="w-3 h-3" /> Operational Model
          </label>
          <select 
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
          >
            {JOJO_MODELS.map(m => (
              <option key={m} value={m} className="bg-slate-900 text-indigo-300">{m}</option>
            ))}
          </select>
        </div>

        {/* API Key Override */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
            <Key className="w-3 h-3" /> API Key Override
          </label>
          <div className="relative">
             <input 
               type="password"
               value={apiKey}
               onChange={(e) => onApiKeyChange(e.target.value)}
               placeholder="Enter API Key (Optional)..."
               className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs font-mono text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all"
             />
             <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          </div>
        </div>
      </div>

      {/* System Instruction */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
          <ShieldCheck className="w-3 h-3" /> Protocol X-Ray (System Instruction)
        </label>
        <textarea 
          value={systemInstruction}
          onChange={(e) => onSystemInstructionChange(e.target.value)}
          placeholder="Inject custom system directives here..."
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-4 py-4 text-[11px] font-mono leading-relaxed text-slate-300 h-48 focus:outline-none focus:border-indigo-500/30 transition-all resize-none custom-scrollbar"
        />
        <p className="text-[9px] text-slate-500 font-medium italic">Note: These instructions will be sent with every JOJO query until reset.</p>
      </div>

      {/* JSON Protocol Toggle */}
      <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-3 h-3" /> JOJO JSON Protocol
          </span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Force structured JSON output for realtime logic</span>
        </div>
        <button 
           onClick={() => onJsonProtocolChange(!jsonProtocol)}
           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${jsonProtocol ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 border-white/5'}`}
        >
          {jsonProtocol ? '🟢 ACTIVE' : '⚪ INACTIVE'}
        </button>
      </div>
    </div>
  );
}
