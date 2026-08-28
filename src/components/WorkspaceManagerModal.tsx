import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, Download, Upload, Trash2, RefreshCw, FolderPlus, 
  FilePlus, Save, X, Search, Check, AlertTriangle, Layers, BookOpen, HardDrive, ShieldAlert, Cpu, Cloud
} from 'lucide-react';
import GoogleDriveIntegrationModal from './GoogleDriveIntegrationModal';

interface WorkspaceFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
}

interface WorkspaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshBible?: () => void;
}

export default function WorkspaceManagerModal({ isOpen, onClose, onRefreshBible }: WorkspaceManagerModalProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles(currentPath);
    }
  }, [isOpen, currentPath]);

  const loadFiles = async (pathStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(pathStr)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load workspace files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async (file: WorkspaceFile) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      setSelectedFile(null);
      setFileContent('');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files/content/${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || '');
      } else {
        setFileContent('Error loading file content.');
      }
    } catch (err) {
      setFileContent('Failed to load file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile.path, content: fileContent })
      });
      if (res.ok) {
        showStatus('success', 'File saved successfully.');
        loadFiles(currentPath);
      } else {
        showStatus('error', 'Failed to save file.');
      }
    } catch (err) {
      showStatus('error', 'Error saving file.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (file: WorkspaceFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const res = await fetch(`/api/files/${encodeURIComponent(file.path)}`, { method: 'DELETE' });
      if (res.ok) {
        showStatus('success', `Deleted ${file.name}`);
        if (selectedFile?.path === file.path) {
          setSelectedFile(null);
          setFileContent('');
        }
        loadFiles(currentPath);
      }
    } catch (err) {
      showStatus('error', 'Failed to delete item.');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
      const res = await fetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      if (res.ok) {
        showStatus('success', 'Folder created.');
        setNewFolderName('');
        setShowNewFolderModal(false);
        loadFiles(currentPath);
      }
    } catch (err) {
      showStatus('error', 'Failed to create folder.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch(`/api/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        showStatus('success', `Uploaded ${uploadedFile.name}`);
        loadFiles(currentPath);
      }
    } catch (err) {
      showStatus('error', 'Upload failed.');
    }
  };

  const handleExportWorkspace = async () => {
    try {
      const res = await fetch('/api/story-bible');
      if (res.ok) {
        const bibleData = await res.json();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(bibleData, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `JARVIS_Workspace_Export_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showStatus('success', 'Workspace exported to JSON!');
      }
    } catch (err) {
      showStatus('error', 'Failed to export workspace.');
    }
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/story-bible/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        showStatus('success', 'Factory Reset completed! Workspace restore complete.');
        setShowResetConfirm(false);
        if (onRefreshBible) onRefreshBible();
        loadFiles('');
        setSelectedFile(null);
        setFileContent('');
      } else {
        showStatus('error', 'Factory reset failed.');
      }
    } catch (err) {
      showStatus('error', 'Error during factory reset.');
    } finally {
      setIsResetting(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0d1322] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-[#090d16] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Workspace & File Manager
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                  J.A.R.V.I.S. Core Data
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage Story Bibles, cached scripts, and production files</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDriveModal(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Google Drive Integration"
            >
              <Cloud className="w-3.5 h-3.5" />
              Google Drive
            </button>

            <button
              onClick={handleExportWorkspace}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export Full Workspace to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Export Workspace
            </button>

            <label className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import File
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Factory Reset Workspace Cache"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Factory Reset
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {statusMessage.text}
          </div>
        )}

        {/* Modal Main Content Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: File Explorer Tree */}
          <div className="w-80 border-r border-white/10 bg-[#0b101d] flex flex-col shrink-0">
            {/* Search & New Folder Toolbar */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={() => setShowNewFolderModal(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              <button
                onClick={() => loadFiles(currentPath)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Refresh File List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Breadcrumb Path */}
            <div className="px-3 py-1.5 bg-[#080d17] border-b border-white/10 flex items-center gap-1 text-[11px] text-slate-400 overflow-x-auto">
              <button
                onClick={() => { setCurrentPath(''); setSelectedFile(null); }}
                className="hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <HardDrive className="w-3 h-3 text-sky-400" />
                root
              </button>
              {currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <button
                    onClick={() => {
                      const subPath = arr.slice(0, idx + 1).join('/');
                      setCurrentPath(subPath);
                    }}
                    className="hover:text-white font-medium text-slate-200 cursor-pointer"
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No files found in this workspace directory.
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => handleSelectFile(file)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-sky-500/20 text-sky-200 border-sky-400/50 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/60 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.isDirectory ? (
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : file.name.endsWith('.json') ? (
                          <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                        {!file.isDirectory && (
                          <span className="text-[10px] text-slate-500 font-mono mr-1">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteFile(file, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete"
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

          {/* Right Column: File Preview / Code Editor */}
          <div className="flex-1 bg-[#090d16] flex flex-col">
            {selectedFile ? (
              <>
                {/* Editor Header */}
                <div className="px-4 py-2.5 border-b border-white/10 bg-[#0d1322] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">{selectedFile.path}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveFile}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving...' : 'Save File'}
                    </button>
                  </div>
                </div>

                {/* Editor Text Area */}
                <div className="flex-1 p-3 overflow-hidden">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full h-full bg-[#070b12] border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500/50 resize-none custom-scrollbar leading-relaxed"
                    placeholder="File content..."
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Layers className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-300">No File Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a file from the workspace explorer tree on the left to inspect, edit, or save changes.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0d1322] border border-white/10 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              Create New Folder
            </h3>
            <input
              type="text"
              placeholder="Folder Name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-[#080c14] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset Confirm Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#0d1322] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="text-base font-extrabold text-white">Confirm Factory Reset Workspace</h3>
                <p className="text-xs text-rose-300/80">Danger Zone Operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              This action will reset the <strong>Story Bible</strong>, clear all intake questionnaire responses, reset sub-agent memory vectors, and restore default workspace settings. Any unsaved scripts or custom character bibles in cache will be restored to defaults.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFactoryReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetting Workspace...' : 'Yes, Factory Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GoogleDriveIntegrationModal 
        isOpen={showDriveModal} 
        onClose={() => setShowDriveModal(false)} 
        workspaceFiles={files} 
      />
    </div>
  );
}
