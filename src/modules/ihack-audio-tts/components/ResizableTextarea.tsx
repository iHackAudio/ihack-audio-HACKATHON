import React, { useState } from 'react';
import { Terminal, Maximize2, ChevronDown, ChevronRight } from 'lucide-react';

interface ResizableTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  minHeightClass?: string; // e.g. min-h-[150px]
  color?: 'emerald' | 'pink' | 'cyber';
  icon?: React.ReactNode;
  minHeight?: string;
}

export const ResizableTextarea: React.FC<ResizableTextareaProps> = ({
  value,
  onChange,
  placeholder = "",
  label,
  minHeightClass = "min-h-[160px]",
  color = 'cyber',
  icon,
  minHeight
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Styles depending on color theme
  let borderFocusStyle = "focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30";
  let labelColor = "text-pink-400";
  let cornerAccents = "border-pink-500/30";

  if (color === 'emerald') {
    borderFocusStyle = "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";
    labelColor = "text-emerald-400";
    cornerAccents = "border-emerald-500/30";
  } else if (color === 'cyber') {
    borderFocusStyle = "focus:border-rose-500/60 focus:ring-2 focus:ring-blue-900/40 focus:border-indigo-500";
    labelColor = "text-indigo-400";
    cornerAccents = "border-indigo-500/30";
  }

  // Handle inline minHeight styles or classes
  const resolvedMinHeight = minHeight || (minHeightClass.includes('[') 
    ? minHeightClass.match(/min-h-\[(.*?)\]/)?.[1] 
    : undefined);

  const styleAttr = resolvedMinHeight ? { minHeight: resolvedMinHeight } : {};

  // Formatted preview of collapsed text
  const textPreview = value.trim() 
    ? (value.length > 35 ? value.substring(0, 35).trim() + "..." : value)
    : "Empty";

  return (
    <div className="relative group/textarea flex flex-col w-full transition-all duration-300">
      {/* Decorative Outer Cyber-Glow */}
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${
        color === 'cyber' ? 'from-blue-600/10 via-purple-600/5 to-rose-600/10 group-focus-within/textarea:from-blue-500/30 group-focus-within/textarea:to-rose-500/30' : 
        color === 'emerald' ? 'from-emerald-500/0 to-emerald-500/0 group-focus-within/textarea:from-emerald-500/10 group-focus-within/textarea:to-emerald-500/20' : 
        'from-pink-500/0 to-pink-500/0 group-focus-within/textarea:from-pink-500/10 group-focus-within/textarea:to-pink-500/20'
      } blur-md transition-all duration-500 pointer-events-none rounded-xl`} />

      {/* Main Container */}
      <div className={`relative flex flex-col bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 group-hover/textarea:border-white/20 group-focus-within/textarea:border-transparent ${
        color === 'cyber' ? 'group-focus-within/textarea:bg-gradient-to-b group-focus-within/textarea:from-slate-950 group-focus-within/textarea:to-slate-950' : ''
      }`}>
        
        {/* Cyber Corners Accents */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl-xl ${cornerAccents}`} />
        <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r rounded-tr-xl ${cornerAccents}`} />
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l rounded-bl-xl ${cornerAccents}`} />
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br-xl ${cornerAccents}`} />

        {/* Header/Label */}
        {label && (
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-between px-4 py-3 border-b border-white/5 select-none cursor-pointer hover:bg-white/[0.02]"
          >
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${labelColor}`}>
              {icon ? icon : <Terminal className="w-3 h-3" />}
              {label}
            </span>
            <div className="flex items-center gap-3">
              {isCollapsed && (
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px] md:max-w-[150px]">
                  {textPreview}
                </span>
              )}
              <span className="text-[9px] font-mono text-slate-500">
                {value.length} CHARS
              </span>
              <button 
                type="button"
                className="text-slate-400 hover:text-white transition-colors"
                title={isCollapsed ? "Expand" : "Minimize"}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Textarea Input (only if not collapsed) */}
        {!isCollapsed && (
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full bg-transparent px-4 py-3 text-[11px] md:text-xs text-white outline-none font-mono leading-relaxed whitespace-pre-wrap select-text resize-y custom-scrollbar transition-all ${borderFocusStyle}`}
              style={{ ...styleAttr, resize: 'vertical' }}
            />

            {/* Visual Cue for resizing */}
            <div className="absolute bottom-1 right-2 pointer-events-none flex items-center justify-center opacity-30 group-hover/textarea:opacity-80 transition-opacity">
              <Maximize2 className={`w-3 h-3 rotate-45 ${labelColor}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
