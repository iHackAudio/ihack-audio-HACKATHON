import React, { useState } from 'react';
import { BookOpen, FileText, Zap, X, Check, Copy, Download, Upload, Sparkles, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { StoryFlixBible } from '../types/storyFlix';
import { compileCpsdMarkdown, runStoryBibleCritique, importStoryBibleData } from '../services/storyFlixApi';

interface CpsdStoryBibleViewerProps {
  bible: StoryFlixBible;
  isOpen: boolean;
  onClose: () => void;
  onExportJson: () => void;
  onExportMd: () => void;
  onReloadBible: () => Promise<void>;
}

export const CpsdStoryBibleViewer: React.FC<CpsdStoryBibleViewerProps> = ({
  bible,
  isOpen,
  onClose,
  onExportJson,
  onExportMd,
  onReloadBible
}) => {
  const [activeTab, setActiveTab] = useState<'cpsd' | 'json' | 'critique'>('cpsd');
  const [copied, setCopied] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueData, setCritiqueData] = useState<any>(null);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  if (!isOpen) return null;

  const markdownContent = compileCpsdMarkdown(bible);
  const jsonContent = JSON.stringify(bible, null, 2);

  const handleCopy = () => {
    const textToCopy = activeTab === 'cpsd' ? markdownContent : jsonContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCritique = async () => {
    setCritiqueLoading(true);
    setActiveTab('critique');
    try {
      const data = await runStoryBibleCritique();
      setCritiqueData(data);
    } catch (err: any) {
      console.error('Critique failed:', err);
    } finally {
      setCritiqueLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportError(null);

    try {
      await importStoryBibleData(importText);
      await onReloadBible();
      setShowImportModal(false);
      setImportText('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse and import Story Bible JSON.');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#080c14] border-l border-sky-500/30 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 bg-[#0d1322] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Live CPSD & Story Bible Dossier
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  v{bible.version} Real-Time Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous sync across Core Idea, Personas, 3x3 Matrix, and Scene Dossiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCritique}
              disabled={critiqueLoading}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer flex items-center gap-1.5"
            >
              {critiqueLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>AI Audit</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={onExportMd}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-bold border border-teal-500/30 cursor-pointer flex items-center gap-1"
              title="Download Markdown"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>.md</span>
            </button>

            <button
              onClick={onExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer flex items-center gap-1"
              title="Download JSON"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>.json</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs font-bold border border-purple-500/30 cursor-pointer flex items-center gap-1"
              title="Import JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-white/10 bg-[#0a0e19] px-4 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('cpsd')}
            className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
              activeTab === 'cpsd'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📑 CPSD Dossier (Markdown)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Story Bible State (JSON)
          </button>
          <button
            onClick={() => setActiveTab('critique')}
            className={`px-4 py-2.5 text-xs font-black cursor-pointer border-b-2 transition-all ${
              activeTab === 'critique'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ AI Narrative Critique
          </button>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar font-mono text-xs leading-relaxed text-slate-200 select-text bg-[#060911]">
          {activeTab === 'cpsd' && (
            <div className="whitespace-pre-wrap">{markdownContent}</div>
          )}

          {activeTab === 'json' && (
            <div className="whitespace-pre-wrap">{jsonContent}</div>
          )}

          {activeTab === 'critique' && (
            <div className="space-y-4 font-sans">
              {critiqueLoading ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-amber-200">Analyzing Story Bible & CPSD coherence...</p>
                </div>
              ) : critiqueData ? (
                <div className="space-y-4">
                  <div className="bg-[#0d1322] p-4 rounded-xl border border-amber-500/30 space-y-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Executive Coherence Summary</span>
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">{critiqueData.summary}</p>
                  </div>

                  {critiqueData.critiques && critiqueData.critiques.length > 0 && (
                    <div className="bg-[#0d1322] p-4 rounded-xl border border-rose-500/30 space-y-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                        ⚡ Dramatic & Logic Gaps
                      </span>
                      <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-1">
                        {critiqueData.critiques.map((c: string, idx: number) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {critiqueData.suggestions && critiqueData.suggestions.length > 0 && (
                    <div className="bg-[#0d1322] p-4 rounded-xl border border-emerald-500/30 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        ✨ Suggested Enhancements
                      </span>
                      <ul className="list-disc list-inside text-xs text-emerald-200/90 space-y-1">
                        {critiqueData.suggestions.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-400">Click "AI Audit" above to evaluate overall plot and character coherence!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-sm font-black uppercase text-purple-300 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import Story Bible Data (JSON)</span>
              </h4>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-purple-400 h-48 resize-none"
              placeholder="Paste Story Bible JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />

            {importError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importLoading || !importText.trim()}
                className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-40"
              >
                {importLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Import & Overwrite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
