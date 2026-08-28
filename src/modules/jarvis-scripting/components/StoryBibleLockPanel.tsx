import React, { useState } from 'react';
import { 
  Lock, Unlock, Shield, ShieldCheck, Check, Plus, RefreshCw, Sparkles, ChevronDown, ChevronRight, Zap, Info,
  Search, Maximize2, Minimize2, Edit3, Trash2, Sliders, ArrowUpRight, HelpCircle, X
} from 'lucide-react';
import { ParameterLockItem, LocksMap } from '../types/discussion';
import { StoryBible } from '../types/storyBible';

interface StoryBibleLockPanelProps {
  locksMap: LocksMap;
  onToggleLock: (key: string) => void;
  onUpdateLockValue: (key: string, newValue: string) => void;
  onAddCustomLock: (lock: ParameterLockItem) => void;
  proposedLocks?: ParameterLockItem[];
  onAcceptProposedLocks: (proposed: ParameterLockItem[]) => void;
  onRejectProposedLock?: (key: string) => void;
  onSelectAlternativeOption?: (key: string, optionValue: string) => void;
  onSyncToHardcore: () => void;
  storyBible: StoryBible;
  isWideMode?: boolean;
  onToggleWideMode?: () => void;
}

export default function StoryBibleLockPanel({
  locksMap,
  onToggleLock,
  onUpdateLockValue,
  onAddCustomLock,
  proposedLocks = [],
  onAcceptProposedLocks,
  onRejectProposedLock,
  onSelectAlternativeOption,
  onSyncToHardcore,
  storyBible,
  isWideMode = false,
  onToggleWideMode
}: StoryBibleLockPanelProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'locked' | 'fluid' | 'phase1_concept' | 'phase2_personas' | 'phase3_matrix' | 'phase4_cpsd' | 'phase5_script'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Custom Lock form state
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<ParameterLockItem['category']>('phase1_concept');

  const locksList = Object.values(locksMap);
  const lockedCount = locksList.filter(l => l.isLocked).length;
  const fluidCount = locksList.length - lockedCount;

  const categories = [
    { id: 'all', label: `All (${locksList.length})` },
    { id: 'locked', label: `Locked 🔒 (${lockedCount})` },
    { id: 'fluid', label: `Fluid 🔓 (${fluidCount})` },
    { id: 'phase1_concept', label: 'Phase 1: Concept' },
    { id: 'phase2_personas', label: 'Phase 2: Personas' },
    { id: 'phase3_matrix', label: 'Phase 3: Scene Matrix' },
    { id: 'phase4_cpsd', label: 'Phase 4: CPSD' },
    { id: 'phase5_script', label: 'Phase 5: Script Rules' }
  ];

  const filteredLocks = locksList.filter(lock => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = lock.key.toLowerCase().includes(q);
      const matchLabel = lock.label.toLowerCase().includes(q);
      const matchVal = lock.value.toLowerCase().includes(q);
      if (!matchKey && !matchLabel && !matchVal) return false;
    }

    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'locked') return lock.isLocked;
    if (activeCategoryFilter === 'fluid') return !lock.isLocked;
    return lock.category === activeCategoryFilter;
  });

  const handleStartEdit = (lock: ParameterLockItem) => {
    setEditingKey(lock.key);
    setEditValue(lock.value);
  };

  const handleSaveEdit = (key: string) => {
    onUpdateLockValue(key, editValue);
    setEditingKey(null);
  };

  const handleCreateCustomLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newValue.trim()) return;

    const generatedKey = `custom.${newCategory}.${Date.now()}`;
    const newLock: ParameterLockItem = {
      key: generatedKey,
      label: newLabel.trim(),
      value: newValue.trim(),
      isLocked: true,
      category: newCategory,
      updatedAt: Date.now()
    };

    onAddCustomLock(newLock);
    setNewLabel('');
    setNewValue('');
    setShowAddModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0f1d] border-l border-white/15 text-slate-100 select-none overflow-hidden shadow-2xl">
      {/* HEADER BAR */}
      <div className="p-3.5 border-b border-white/15 bg-[#060a14] flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-300 flex items-center justify-center text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              Story Bible Locking System
            </h3>
            <p className="text-xs text-amber-300/90 font-semibold flex items-center gap-2 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{lockedCount} Locked Constraints</span>
              <span className="text-slate-500">•</span>
              <span className="text-sky-300/80">{fluidCount} Open Fluid</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
            title="Add Custom Parameter Lock"
          >
            <Plus className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">Add Lock</span>
          </button>

          <button
            type="button"
            onClick={onSyncToHardcore}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-md hover:brightness-110"
            title="Sync all active locked parameters into the Hardcore Pipeline backend"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
            <span className="hidden sm:inline">Sync Hardcore</span>
          </button>

          {onToggleWideMode && (
            <button
              type="button"
              onClick={onToggleWideMode}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title={isWideMode ? "Collapse Sidebar Width" : "Expand Sidebar Width for Maximum Readability"}
            >
              {isWideMode ? <Minimize2 className="w-4 h-4 text-sky-300" /> : <Maximize2 className="w-4 h-4 text-amber-300" />}
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND QUICK FILTER CONTROLS */}
      <div className="p-3 border-b border-white/10 bg-[#080d19] space-y-2 shrink-0">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parameter keys, labels, or values..."
            className="w-full bg-[#0d1426] border border-white/15 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeCategoryFilter === cat.id
                  ? 'bg-sky-500 text-slate-950 border-sky-300 font-extrabold shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI PROPOSED LOCKS BANNER */}
      {proposedLocks.length > 0 && (
        <div className="m-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-sky-950/80 border-2 border-purple-400/60 shadow-xl shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-300 animate-spin" />
              AI Candidate Lock Suggestions ({proposedLocks.length})
            </span>
            <button
              type="button"
              onClick={() => onAcceptProposedLocks(proposedLocks)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All Locks</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {proposedLocks.map((pl, idx) => (
              <div key={idx} className="p-2.5 bg-[#090e1a] rounded-lg border border-purple-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-purple-200">{pl.label}</span>
                  <span className="text-[10px] text-amber-300 font-semibold italic">{pl.reason}</span>
                </div>
                <p className="text-xs text-slate-200 bg-slate-950/70 p-2 rounded border border-white/10 leading-relaxed font-sans">
                  "{pl.value}"
                </p>

                {/* Alternatives if present */}
                {pl.alternatives && pl.alternatives.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <span className="text-[10px] font-bold text-sky-300 block">Alternative Options (If No):</span>
                    {pl.alternatives.map((alt, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => onSelectAlternativeOption && onSelectAlternativeOption(pl.key, alt)}
                        className="w-full text-left p-1.5 rounded bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-[11px] text-sky-200 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>• {alt}</span>
                        <ArrowUpRight className="w-3 h-3 text-sky-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN PARAMETER LOCK CARDS FEED */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredLocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Lock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">No story parameters match this filter.</p>
            <p className="text-[11px] text-slate-500">Try searching or clearing your filter query.</p>
          </div>
        ) : (
          filteredLocks.map(lock => (
            <div
              key={lock.key}
              className={`p-3.5 rounded-xl border-2 transition-all ${
                lock.isLocked
                  ? 'bg-gradient-to-b from-[#14120b] to-[#0d121f] border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                  : 'bg-[#0d1322] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-extrabold leading-snug ${lock.isLocked ? 'text-amber-300' : 'text-slate-100'}`}>
                      {lock.label}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono border border-white/5">
                      {lock.key}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleLock(lock.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    lock.isLocked
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 border-amber-300 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-white/15'
                  }`}
                  title={lock.isLocked ? "Click to Unlock and make fluid" : "Click to Lock and enforce constraint"}
                >
                  {lock.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-950" />
                      <span>LOCKED 🔒</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                      <span>FLUID 🔓</span>
                    </>
                  )}
                </button>
              </div>

              {/* Value View & Edit Area */}
              {editingKey === lock.key ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-sky-400/80 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 leading-relaxed font-sans"
                    rows={3}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="px-3 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(lock.key)}
                      className="px-3 py-1 rounded-md text-xs font-extrabold bg-sky-500 text-slate-950 hover:bg-sky-400 shadow"
                    >
                      Save & Lock
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleStartEdit(lock)}
                  className="mt-1 p-2.5 rounded-lg bg-[#070b16] border border-white/10 text-xs text-slate-200 cursor-pointer hover:border-sky-400/50 transition-all leading-relaxed font-sans"
                  title="Click to edit value"
                >
                  {lock.value ? (
                    <p className="whitespace-pre-wrap">{lock.value}</p>
                  ) : (
                    <span className="text-slate-500 italic text-xs">Click to set locked parameter value...</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FOOTER INFO BAR */}
      <div className="p-3 border-t border-white/15 bg-[#060a14] text-xs text-slate-300 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-amber-300/90 font-medium text-[11px]">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Locked items act as unshakeable constraints during discussion.</span>
        </div>

        <button
          type="button"
          onClick={onSyncToHardcore}
          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer whitespace-nowrap"
        >
          Push to Story Bible
        </button>
      </div>

      {/* ADD CUSTOM LOCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border-2 border-sky-400/60 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-sky-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Add Custom Parameter Lock
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomLock} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1">
                  Parameter Name / Label:
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Protagonist Flaw, Climax Location, Dialogue Style"
                  className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1">
                  Category Phase:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                >
                  <option value="phase1_concept">Phase 1: Concept & Premise</option>
                  <option value="phase2_personas">Phase 2: Personas & Voices</option>
                  <option value="phase3_matrix">Phase 3: Scene Matrix & Twists</option>
                  <option value="phase4_cpsd">Phase 4: CPSD Blueprint</option>
                  <option value="phase5_script">Phase 5: Script Rules</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1">
                  Locked Parameter Value:
                </label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter the unshakeable story rule or parameter value..."
                  className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 leading-relaxed"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-extrabold hover:bg-sky-400 shadow-md"
                >
                  Lock Parameter 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
