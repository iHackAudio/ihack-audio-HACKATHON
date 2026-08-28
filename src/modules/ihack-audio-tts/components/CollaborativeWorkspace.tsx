import React, { useRef, useEffect, useState } from 'react';
import { Bot, User, NotebookPen, X, ArrowRight, Send, Paperclip } from 'lucide-react';
import { Button } from './Button';

interface Message {
  id: string;
  sender: 'jojo' | 'user';
  text: string;
  finished?: boolean;
}

interface CollaborativeWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  contextBoardText: string;
  setContextBoardText: (val: string) => void;
  onTransferToMain: () => void;
  onSendMessage?: (text: string) => void;
}

export function CollaborativeWorkspace({
  isOpen,
  onClose,
  messages,
  contextBoardText,
  setContextBoardText,
  onTransferToMain,
  onSendMessage
}: CollaborativeWorkspaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (onSendMessage) onSendMessage(inputText);
    setInputText('');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text && onSendMessage) {
        onSendMessage(`[User uploaded file]: ${file.name}\n\n${text}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-[90vw] max-w-7xl shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-slate-950/95 border-l border-cyan-500/20 flex flex-col animate-slideLeft backdrop-blur-xl">
        
        {/* Header */}
        <div className="h-16 border-b border-cyan-500/20 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
             <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Bot className="w-5 h-5" />
             </div>
             <h2 className="font-black tracking-widest text-white uppercase text-sm">Jojo Comm-Link</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cyan-500/10 rounded-full text-slate-400 hover:text-cyan-400 transition-colors relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* Side A: Live Comm-Link (60%) */}
           <div className="w-3/5 flex flex-col border-r border-cyan-500/20 bg-slate-950/50 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-5 pointer-events-none mix-blend-overlay" />
              <div className="p-4 bg-slate-900/30 border-b border-cyan-500/10 font-bold text-[10px] uppercase tracking-widest text-cyan-500 flex items-center justify-between">
                <span>Terminal / Live Transcription</span>
                <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
              </div>
              
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative z-10"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                    <Bot className="w-16 h-16 mb-6 opacity-20 text-cyan-500" />
                    <p className="font-mono uppercase tracking-widest text-xs opacity-50">System Standby</p>
                    <p className="font-mono text-xs opacity-40 mt-2">Initialize voice link or transmit text data.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-5 ${
                         msg.sender === 'user' 
                          ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.1)] rounded-tr-sm'
                          : 'bg-slate-900/60 text-slate-300 border border-slate-700/50 rounded-tl-sm'
                      }`}>
                         <div className={`flex items-center gap-2 mb-3 text-[10px] uppercase font-black tracking-widest ${msg.sender === 'user' ? 'text-cyan-400' : 'text-slate-500'}`}>
                           {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                           {msg.sender === 'user' ? 'Operator' : 'Jojo'}
                         </div>
                         <p className="leading-relaxed font-mono text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50 z-10">
                <div className="flex items-center gap-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-2 shadow-inner focus-within:border-cyan-500/60 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all">
                  <label className="p-2 text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors bg-slate-900 rounded-lg">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" accept=".txt,.md,.pdf,.docx,.doc,.html" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Transmit text command or data..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-cyan-50 outline-none placeholder:text-slate-600"
                  />
                  <button onClick={handleSend} className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-slate-950 transition-colors font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
           </div>

           {/* Side B: Context Board (40%) */}
           <div className="w-2/5 flex flex-col bg-slate-900/30 relative">
              <div className="p-4 bg-slate-900/50 border-b border-emerald-500/20 font-bold text-[10px] uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <NotebookPen className="w-4 h-4" />
                Data Buffer
              </div>
              <div className="flex-1 p-6 flex flex-col">
                 <textarea
                   value={contextBoardText}
                   onChange={(e) => setContextBoardText(e.target.value)}
                   placeholder="Awaiting extraction prompts... (e.g., 'Save this parameters')"
                   className="flex-1 bg-slate-950/50 border border-emerald-500/10 rounded-2xl p-6 text-emerald-50 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] resize-none font-mono text-xs leading-relaxed custom-scrollbar shadow-inner transition-all"
                 />
              </div>

              {/* Action Bar */}
              <div className="p-6 border-t border-emerald-500/20 bg-slate-900/50 flex justify-end">
                 <Button
                    onClick={onTransferToMain}
                    disabled={!contextBoardText.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none"
                    icon={<ArrowRight />}
                 >
                    Export to Main Editor
                 </Button>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
