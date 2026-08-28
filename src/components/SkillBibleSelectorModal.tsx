import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Play, Copy, BookOpen, Layers, RefreshCw, Check } from 'lucide-react';

interface SkillItem {
  num: number;
  title: string;
}

interface SkillFile {
  fileName: string;
  relativePath: string;
  skills: SkillItem[];
}

interface BibleFile {
  fileName: string;
  relativePath: string;
  title: string;
}

interface SkillBibleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (commandText: string) => void;
}

export default function SkillBibleSelectorModal({
  isOpen,
  onClose,
  onExecute
}: SkillBibleSelectorModalProps) {
  const [skillFiles, setSkillFiles] = useState<SkillFile[]>([]);
  const [bibleFiles, setBibleFiles] = useState<BibleFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Selection state
  const [selectedSkillFile, setSelectedSkillFile] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<Record<number, boolean>>({});
  const [selectedBible, setSelectedBible] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, biblesRes] = await Promise.all([
        fetch('/api/skills').then(r => r.json()),
        fetch('/api/bibles').then(r => r.json())
      ]);

      if (Array.isArray(skillsRes)) {
        setSkillFiles(skillsRes);
        if (skillsRes.length > 0) {
          const firstFile = skillsRes[0];
          setSelectedSkillFile(firstFile.relativePath);
          // Default select skills 1, 3, 5 if available, else all
          const initSelections: Record<number, boolean> = {};
          firstFile.skills.forEach((s: SkillItem) => {
            initSelections[s.num] = [1, 3, 5].includes(s.num) || firstFile.skills.length <= 2;
          });
          setSelectedSkills(initSelections);
        }
      }

      if (Array.isArray(biblesRes)) {
        setBibleFiles(biblesRes);
        if (biblesRes.length > 0) {
          setSelectedBible(biblesRes[0].relativePath);
        }
      }
    } catch (e) {
      console.error("Failed to load skills or bibles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSkillFileObj = skillFiles.find(f => f.relativePath === selectedSkillFile) || skillFiles[0];

  const activeSkillNumbers = Object.entries(selectedSkills)
    .filter(([_, isChecked]) => isChecked)
    .map(([numStr]) => parseInt(numStr, 10))
    .sort((a, b) => a - b);

  const activeSkillsFormatted = activeSkillNumbers.join(', ');

  const generatedCommand = selectedSkillFile && selectedBible
    ? `${selectedSkillFile} Run skill ${activeSkillsFormatted || 'all'} for this story: ${selectedBible}`
    : 'Select a Skill Template and Story Bible below';

  const toggleSkill = (num: number) => {
    setSelectedSkills(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const handleSelectSkillFile = (fileRelPath: string) => {
    setSelectedSkillFile(fileRelPath);
    const target = skillFiles.find(f => f.relativePath === fileRelPath);
    if (target) {
      const newSel: Record<number, boolean> = {};
      target.skills.forEach(s => {
        newSel[s.num] = true;
      });
      setSelectedSkills(newSel);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    if (!generatedCommand) return;
    onExecute(generatedCommand);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0c0f1a] border border-[#00d2ff]/30 rounded-xl shadow-[0_0_40px_rgba(0,210,255,0.15)] flex flex-col max-h-[88vh] overflow-hidden text-white font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121624]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00d2ff]/10 flex items-center justify-center border border-[#00d2ff]/30 text-[#00d2ff]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-white font-mono flex items-center gap-2">
                Skill & Bible Interactive Matrix
              </h2>
              <p className="text-[11px] text-white/50">Select skills and story bibles with interactive toggles</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={fetchData} 
              className="p-1.5 rounded-md bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh Skill & Bible Files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00d2ff]' : ''}`} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-md bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
          
          {/* Section 1: Select Master Template */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#00d2ff] flex items-center gap-2 font-semibold">
              <span>1. Select Master Skill File</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {skillFiles.map((sf) => (
                <button
                  key={sf.relativePath}
                  onClick={() => handleSelectSkillFile(sf.relativePath)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedSkillFile === sf.relativePath
                      ? 'bg-[#00d2ff]/10 border-[#00d2ff] text-white shadow-[0_0_12px_rgba(0,210,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold truncate">
                    <span>🛠️</span> <span className="truncate">{sf.fileName}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5 font-mono">
                    {sf.skills.length} skills detected inside
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Toggle Interactive Skills */}
          {currentSkillFileObj && (
            <div className="space-y-2 bg-[#121624] p-3 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#00d2ff] flex items-center gap-2 font-semibold">
                  <span>Interactive Skill Checkboxes ({currentSkillFileObj.fileName})</span>
                </label>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <button 
                    onClick={() => {
                      const allSel: Record<number, boolean> = {};
                      currentSkillFileObj.skills.forEach(s => allSel[s.num] = true);
                      setSelectedSkills(allSel);
                    }}
                    className="text-[#00d2ff] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-white/20">|</span>
                  <button 
                    onClick={() => setSelectedSkills({})}
                    className="text-white/50 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {currentSkillFileObj.skills.map((skill) => {
                  const isChecked = !!selectedSkills[skill.num];
                  return (
                    <div
                      key={skill.num}
                      onClick={() => toggleSkill(skill.num)}
                      className={`flex items-center gap-2.5 p-2 rounded-md border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#00d2ff]/15 border-[#00d2ff]/50 text-white shadow-[0_0_8px_rgba(0,210,255,0.1)]'
                          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="shrink-0 text-[#00d2ff]">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#00d2ff]" />
                        ) : (
                          <Square className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 font-mono text-xs font-medium truncate">
                        <span className={isChecked ? 'text-[#00d2ff] font-bold' : 'text-white/50'}>
                          SKILL {skill.num}
                        </span>
                        <span className="mx-1.5 text-white/20">—</span>
                        <span className="truncate">{skill.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Select Story Bible */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#00d2ff] flex items-center gap-1.5 font-semibold">
              <BookOpen className="w-3 h-3" />
              <span>2. Select Story Bible</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bibleFiles.map((bf) => (
                <button
                  key={bf.relativePath}
                  onClick={() => setSelectedBible(bf.relativePath)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedBible === bf.relativePath
                      ? 'bg-purple-500/15 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold truncate text-purple-300">
                    <span>📖</span> <span className="truncate">{bf.title}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5 font-mono truncate">
                    {bf.relativePath}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Command Preview Box */}
          <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>Generated Command Prompt</span>
              <span className="text-[#00d2ff] font-semibold">
                Skills: [{activeSkillsFormatted || 'None'}]
              </span>
            </div>
            <div className="p-2.5 bg-black/40 rounded border border-white/5 font-mono text-[11px] text-cyan-300 break-all leading-snug">
              {generatedCommand}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-[#121624] flex items-center justify-between text-xs">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
            <span>{copied ? 'Copied!' : 'Copy Command'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={!activeSkillNumbers.length || !selectedBible}
              className="px-4 py-2 bg-gradient-to-r from-[#00d2ff] to-cyan-500 hover:from-cyan-400 hover:to-[#00d2ff] text-black font-semibold text-xs font-mono rounded-lg shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Pipeline</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

