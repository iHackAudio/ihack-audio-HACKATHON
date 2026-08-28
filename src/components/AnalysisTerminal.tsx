import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Cpu, 
  Save, 
  Plus, 
  MessageSquare, 
  PanelRightOpen, 
  PanelRightClose, 
  X, 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  CornerLeftUp,
  TerminalSquare,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTTS } from '../hooks/useTTS';

interface AnalysisTerminalProps {
  onAnalyzeRequest?: (filename: string) => void;
  onToggleGlassBox?: () => void;
  isGlassBoxOpen?: boolean;
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

interface FileMetadata {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
}

export default function AnalysisTerminal({ onAnalyzeRequest, onToggleGlassBox, isGlassBoxOpen, isOpen = true, setIsOpen, onFocusChange }: AnalysisTerminalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const actualIsOpen = setIsOpen ? isOpen : internalIsOpen;
  const toggleOpen = () => setIsOpen ? setIsOpen(!actualIsOpen) : setInternalIsOpen(!actualIsOpen);

  const [isFocused, setIsFocusedInternal] = useState(false); // Used for full-screen text editor
  
  const setIsFocused = (focused: boolean) => {
    setIsFocusedInternal(focused);
    if (onFocusChange) onFocusChange(focused);
  };
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');

  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewContent, setPreviewContent] = useState<{name: string, content: string, isNew?: boolean} | null>(null);
  const tts = useTTS();

  type FileComment = {
    id: string;
    lines: { start: number, end: number };
    text: string;
    agent: string;
  };
  const [comments, setComments] = useState<FileComment[]>([]);
  const [selectedLines, setSelectedLines] = useState<{start: number, end: number} | null>(null);
  const [currentAgent, setCurrentAgent] = useState('jarvis');
  const [currentDraft, setCurrentDraft] = useState('');

  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    if (start !== end) {
      const textBeforeStart = target.value.substring(0, start);
      const textBeforeEnd = target.value.substring(0, end);
      const startLine = textBeforeStart.split('\n').length;
      const endLine = textBeforeEnd.split('\n').length;
      setSelectedLines({ start: startLine, end: endLine });
    } else {
      const textBeforeStart = target.value.substring(0, start);
      const currentLine = textBeforeStart.split('\n').length;
      setSelectedLines({ start: currentLine, end: currentLine });
    }
  };

  const handleAddComment = () => {
    if (!currentDraft.trim() || !selectedLines) return;
    setComments(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      lines: selectedLines,
      text: currentDraft.trim(),
      agent: currentAgent
    }]);
    setCurrentDraft('');
  };

  const handleSendAllComments = () => {
    if (!onAnalyzeRequest || comments.length === 0) return;
    
    const grouped = comments.reduce((acc, comment) => {
      if (!acc[comment.agent]) acc[comment.agent] = [];
      acc[comment.agent].push(comment);
      return acc;
    }, {} as Record<string, FileComment[]>);
    
    Object.entries(grouped).forEach(([agent, agentComments]) => {
      let msg = `@${agent} [File: ${previewContent!.name}]\n`;
      agentComments.forEach(c => {
        const lineText = c.lines.start === c.lines.end ? `Line ${c.lines.start}` : `Lines ${c.lines.start}-${c.lines.end}`;
        msg += `- ${lineText}: ${c.text}\n`;
      });
      onAnalyzeRequest(msg);
    });
    
    setComments([]);
    setIsFocused(false);
  };

  const fetchFiles = async (subdir: string = currentPath) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(subdir)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setCurrentPath(subdir);
      }
    } catch(e) {
      console.error("Failed to fetch files", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (filePath: string) => {
    try {
      const res = await fetch(`/api/files/content/${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent({ name: filePath, content: data.content });
        setIsFocused(true); // Open in full screen editor
      }
    } catch(e) {
      console.error("Failed to preview", e);
    }
  };

  const handleSave = async () => {
    if (!previewContent || !previewContent.name.trim()) return;
    try {
      let finalFilename = previewContent.name;
      if (previewContent.isNew) {
        finalFilename = currentPath ? `${currentPath}/${previewContent.name}` : previewContent.name;
      }

      await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: finalFilename, content: previewContent.content })
      });
      setPreviewContent({ name: finalFilename, content: previewContent.content, isNew: false });
      setIsFocused(false);
      
      fetchFiles(currentPath);
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const targetDirPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      const res = await fetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetDirPath })
      });
      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderInput(false);
        fetchFiles(currentPath);
      }
    } catch (e) {
      console.error("Failed to create folder", e);
    }
  };

  useEffect(() => {
    fetchFiles('');
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch(`/api/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData
      });
      fetchFiles(currentPath);
    } catch(e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    uploadFile(event.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      fetchFiles(currentPath);
    } catch(e) {
      console.error("Delete failed", e);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const segments = currentPath.split('/').filter(Boolean);
    const targetPath = segments.slice(0, index + 1).join('/');
    fetchFiles(targetPath);
  };

  const segments = currentPath.split('/').filter(Boolean);

  // Full Screen Editor Overlay
  if (isFocused && previewContent) {
    return (
      <div className="w-full h-full bg-[#0c0e14] text-white flex flex-col p-4 animate-in fade-in duration-300 overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-cyan-400" />
              {previewContent.isNew ? 'New File' : previewContent.name}
            </h2>
            <p className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">{previewContent.isNew ? 'Unsaved Text File' : 'Editing File'}</p>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={() => {
                  if (tts.isSpeaking) {
                    tts.stop();
                  } else if (previewContent?.content) {
                    tts.speak(previewContent.content);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md uppercase text-[10px] font-bold transition-all cursor-pointer ${
                  tts.isSpeaking
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                }`}
                title="Listen to File Content (Text-To-Speech)"
              >
                {tts.isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {tts.isSpeaking ? 'Stop TTS' : 'Read Aloud'}
              </button>
             <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-md uppercase text-[10px] font-bold transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save File
              </button>
              <button 
                onClick={() => setIsFocused(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md uppercase text-[10px] font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left side: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {previewContent.isNew && (
              <div className="mb-4 flex items-center gap-4">
                <label className="text-xs text-white/50 font-mono">FILENAME</label>
                <input 
                  value={previewContent.name} 
                  onChange={e => setPreviewContent({...previewContent, name: e.target.value})}
                  placeholder="e.g. index.html, script.py"
                  className="bg-black/50 border border-white/10 text-sm font-mono text-cyan-400 px-3 py-2 rounded flex-1 max-w-md focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            <div className="flex-1 w-full flex bg-[#0c0e14] border border-white/5 focus-within:border-[#00d2ff]/30 rounded-xl overflow-hidden shadow-inner relative">
              <div 
                id="editor-line-numbers"
                className="w-10 bg-black/40 text-white/30 text-right py-4 pr-2 font-mono text-[13px] leading-relaxed select-none overflow-hidden"
              >
                {previewContent.content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea 
                className="flex-1 bg-transparent p-4 pl-3 text-[13px] leading-relaxed text-white/90 font-mono resize-none focus:outline-none custom-scrollbar whitespace-pre"
                value={previewContent.content}
                onChange={e => setPreviewContent({...previewContent, content: e.target.value})}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                onScroll={e => {
                   const lineNumbers = document.getElementById('editor-line-numbers');
                   if (lineNumbers) {
                      lineNumbers.scrollTop = e.currentTarget.scrollTop;
                   }
                }}
                placeholder="Start typing..."
                spellCheck={false}
                wrap="off"
              />
            </div>
          </div>

          {/* Right side: Comments Panel */}
          {!previewContent.isNew && onAnalyzeRequest && (
            <div className="w-72 flex flex-col bg-[#0e0b02] border border-white/10 rounded-xl overflow-hidden shrink-0 shadow-lg">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Direct Agent Chat
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-[11px] text-white/30 text-center mt-6 px-2 leading-relaxed">
                    Select lines in the editor and add instructions below.
                  </div>
                ) : (
                  comments.map((c, idx) => (
                    <div 
                      key={c.id} 
                      className={`border border-white/10 rounded-lg p-2.5 text-[11px] flex flex-col gap-1.5 ${idx % 2 === 0 ? 'bg-[#1b0505]' : 'bg-[#020223]'}`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#00d2ff] font-bold uppercase">@{c.agent}</span>
                        <span className="text-white/40 font-mono">
                          {c.lines.start === c.lines.end ? `L${c.lines.start}` : `L${c.lines.start}-${c.lines.end}`}
                        </span>
                      </div>
                      <div className="text-white/80 leading-relaxed">{c.text}</div>
                      <button 
                        onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                        className="text-red-400/50 hover:text-red-400 text-[10px] self-end uppercase font-bold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-white/5 border-t border-white/10 flex flex-col gap-2">
                <div className="text-[10px] text-white/50 flex justify-between">
                  <span>Selected:</span>
                  <span className="text-cyan-400 font-mono">
                    {selectedLines ? (selectedLines.start === selectedLines.end ? `Line ${selectedLines.start}` : `Lines ${selectedLines.start}-${selectedLines.end}`) : 'None'}
                  </span>
                </div>
                <select 
                  value={currentAgent}
                  onChange={e => setCurrentAgent(e.target.value)}
                  className="bg-black/50 border border-white/10 text-[11px] text-white px-2 py-1.5 rounded focus:outline-none"
                >
                  <option value="jarvis">JARVIS</option>
                  <option value="agenta">Agent A</option>
                  <option value="agentb">Agent B</option>
                  <option value="agentc">Agent C</option>
                </select>
                <textarea
                  value={currentDraft}
                  onChange={e => setCurrentDraft(e.target.value)}
                  placeholder="Type instruction..."
                  className="w-full bg-black/50 border border-white/10 text-[11px] text-white px-2 py-1.5 rounded focus:outline-none focus:border-[#00d2ff]/50 min-h-[60px] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!currentDraft.trim() || !selectedLines}
                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded uppercase text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                  {comments.length > 0 && (
                    <button
                      onClick={handleSendAllComments}
                      className="flex-1 py-1.5 bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 rounded uppercase text-[10px] font-bold transition-colors"
                    >
                      Send All
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative h-full flex flex-col shrink-0 transition-all duration-300 ease-in-out ${actualIsOpen ? 'w-full border-l border-white/10 bg-[#0c0e14]' : 'w-0 border-l-0'}`}
    >
      {/* Sidebar Toggle Button */}
      <div className="absolute top-3 -left-7 z-40 flex flex-col gap-1">
        <button 
          onClick={toggleOpen}
          className="bg-[#0c0e14] border border-white/10 border-r-0 rounded-l-md p-1.5 hover:bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer shadow-md"
          title={actualIsOpen ? "Collapse Explorer" : "Expand Explorer"}
        >
          {actualIsOpen ? <PanelRightClose className="w-3.5 h-3.5 text-[#00d2ff]" /> : <PanelRightOpen className="w-3.5 h-3.5 text-white/60" />}
        </button>
        {onToggleGlassBox && (
          <button 
            onClick={onToggleGlassBox}
            className={`bg-[#0c0e14] border border-r-0 rounded-l-md p-1.5 transition-colors cursor-pointer shadow-md ${isGlassBoxOpen ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white'}`}
            title="Toggle Glass Box"
          >
            <TerminalSquare className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`flex flex-col h-full w-full overflow-hidden ${actualIsOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-10 border-b border-white/5 flex items-center px-3 justify-between shrink-0 select-none bg-[#0a0d16]"
        >
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[10px] font-mono text-cyan-400 tracking-wider font-bold">WORKSPACE EXPLORER</h3>
          </div>
          <button onClick={() => fetchFiles(currentPath)} className="text-white/40 hover:text-white transition-colors p-1 rounded" title="Refresh Files">
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dynamic Breadcrumbs */}
        <div className="bg-black/35 px-3 py-1.5 border-b border-white/5 text-[10px] font-mono text-white/50 flex items-center flex-wrap gap-1 overflow-x-auto select-none">
          <span 
            className="hover:text-cyan-400 cursor-pointer transition-colors" 
            onClick={() => fetchFiles('')}
          >
            ~
          </span>
          {segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-2.5 h-2.5 text-white/20 shrink-0" />
              <span 
                className={`hover:text-cyan-400 cursor-pointer transition-colors ${idx === segments.length - 1 ? 'text-cyan-400 font-semibold' : ''}`}
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {seg}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-2.5 sm:p-3 flex flex-col gap-3 custom-scrollbar">
          {/* Ultra Compact File Upload Bar */}
          <div 
            className="border border-dashed border-white/15 rounded-lg p-2 flex items-center gap-2 text-left hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all cursor-pointer relative bg-white/[0.01] shrink-0"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white/80 truncate">Upload to active folder</p>
            </div>
            <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">Browse</span>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
          </div>

          {uploading && <div className="text-[10px] text-cyan-400 font-mono text-center animate-pulse">Uploading...</div>}

          {/* New Folder Inline Form */}
          {showNewFolderInput && (
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] font-mono text-cyan-400 mb-2 font-bold uppercase tracking-wider">Create New Folder</p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="bg-black/50 border border-white/10 text-xs font-mono text-white/95 px-2.5 py-1.5 rounded flex-1 focus:outline-none focus:border-cyan-500/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolderInput(false);
                  }}
                  autoFocus
                />
                <button 
                  onClick={handleCreateFolder}
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-bold rounded cursor-pointer transition-colors"
                >
                  OK
                </button>
                <button 
                  onClick={() => setShowNewFolderInput(false)}
                  className="px-2 py-1 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs rounded cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* File Explorer Workspace System */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h4 className="text-[10px] font-mono text-white/40 tracking-wider uppercase">Workspace Explorer</h4>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowNewFolderInput(true)}
                  className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 rounded uppercase cursor-pointer transition-all font-semibold"
                  title="Create Subfolder"
                >
                  <FolderPlus className="w-3 h-3" /> +Folder
                </button>
                <button 
                  onClick={() => {
                    setPreviewContent({ name: 'untitled.txt', content: '', isNew: true });
                    setIsFocused(true);
                  }}
                  className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded uppercase cursor-pointer transition-all font-semibold"
                  title="Create Text/Markdown File"
                >
                  <Plus className="w-3 h-3" /> +File
                </button>
              </div>
            </div>

            {/* Folder browser */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                {/* Back up directory */}
                {currentPath && (
                  <div 
                    onClick={() => {
                      const parent = segments.slice(0, -1).join('/');
                      fetchFiles(parent);
                    }}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:bg-white/5 cursor-pointer text-white/50 hover:text-cyan-400 transition-all text-xs font-mono select-none"
                  >
                    <CornerLeftUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>.. / Up One Dir</span>
                  </div>
                )}

                {files.length === 0 && !currentPath ? (
                  <div className="flex justify-center items-center py-12 text-xs text-white/20 font-mono">No files in workspace root</div>
                ) : files.length === 0 && currentPath ? (
                  <div className="flex justify-center items-center py-12 text-xs text-white/20 font-mono">This folder is empty</div>
                ) : (
                  files.map(file => {
                    const isDir = file.isDirectory;
                    return (
                      <div 
                        key={file.path} 
                        className={`flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border transition-all group ${
                          isDir 
                            ? 'border-yellow-500/5 hover:border-yellow-500/20 hover:bg-yellow-500/[0.02]' 
                            : 'border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02]'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1 select-none"
                          onClick={() => {
                            if (isDir) {
                              fetchFiles(file.path);
                            } else {
                              handlePreview(file.path);
                            }
                          }}
                        >
                          {isDir ? (
                            <Folder className="w-4 h-4 text-yellow-500/70 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-cyan-400/60 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className={`text-xs truncate ${isDir ? 'text-white/95 group-hover:text-yellow-400 font-medium' : 'text-white/85 group-hover:text-cyan-300'}`}>
                              {file.name}
                            </p>
                            {!isDir && (
                              <p className="text-[9px] text-white/40 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* File analyze shortcut */}
                          {!isDir && onAnalyzeRequest && (
                            <button 
                              onClick={() => onAnalyzeRequest(file.path)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-purple-500/20 text-purple-400 rounded transition-all"
                              title="Ask J.A.R.V.I.S. to analyze"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.path); }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 text-white/40 rounded transition-all"
                            title={isDir ? "Delete folder recursively" : "Delete file"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
