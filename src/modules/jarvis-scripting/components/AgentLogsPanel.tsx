import React, { useState } from 'react';
import { ChatMessage } from '../types/index';
import { Cpu, Sparkles, TerminalSquare, Copy, Check, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function AgentLogsPanel({ messages }: { messages: ChatMessage[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const logs = messages.filter(m => m.role === 'model' && m.agentId !== 'jarvis');

  return (
    <div className="flex flex-col h-full bg-[#080a0f] text-white overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-[#0c0e14] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 text-[#00d2ff]">
          <TerminalSquare className="w-5 h-5" />
          <h2 className="font-semibold tracking-wide text-sm">Sub-Agent Raw Output Logs</h2>
        </div>
        <div className="text-xs text-white/50 font-mono">
          Intercepted by Gemma Pipeline
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 font-mono text-sm gap-2">
            <TerminalSquare className="w-8 h-8 opacity-20" />
            No agent logs yet. Start a cognitive task.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map(log => {
              const LogIcon = log.agentId?.toLowerCase() === 'agenta' ? Cpu : (log.agentId?.toLowerCase() === 'agentc' || log.agentId?.toLowerCase() === 'gemma-middleman') ? Filter : Sparkles;
              const colorClass = log.agentId?.toLowerCase() === 'agenta' ? 'text-[#ff00d2] border-[#ff00d2]/30 bg-[#ff00d2]/5' : 
                                 (log.agentId?.toLowerCase() === 'agentc' || log.agentId?.toLowerCase() === 'gemma-middleman') ? 'text-teal-400 border-teal-400/30 bg-teal-400/5' :
                                 'text-[#d2ff00] border-[#d2ff00]/30 bg-[#d2ff00]/5';

              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={log.id} 
                  className={`w-full relative p-4 rounded-xl border ${colorClass} flex flex-col gap-3 font-mono`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                     <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px]">
                       <LogIcon className="w-4 h-4" />
                       [{log.agentId}] {(log.agentId?.toLowerCase() === 'agentc' || log.agentId?.toLowerCase() === 'gemma-middleman') ? 'GEMMA PIPELINE LOG' : 'RAW TRACE'}
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="text-[10px] text-white/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                     </div>
                  </div>
                  <div className="text-xs text-white/70 overflow-x-auto whitespace-pre-wrap leading-relaxed max-w-none pb-6">
                    {log.content}
                  </div>
                  {/* Action buttons at bottom right */}
                  <div className="absolute bottom-3 right-3 pointer-events-auto flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(log.id, log.content)}
                      className="opacity-20 hover:opacity-100 text-white transition-opacity p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase"
                      title="Copy Raw Trace"
                    >
                      {copiedId === log.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
