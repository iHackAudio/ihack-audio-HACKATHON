import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Trophy, Sparkles, MessageSquare, Film, Layers, 
  ArrowLeft, Download, Upload, CheckCircle2, ChevronRight, Sliders,
  RefreshCw, ShieldCheck
} from 'lucide-react';
import StoryBiblePanel from '../src/components/StoryBiblePanel';
import SceneTournamentPanel from '../src/components/SceneTournamentPanel';
import Phase5CinematicScriptPanel from '../src/components/Phase5CinematicScriptPanel';
import SubtextDiscussionStudio from '../src/components/SubtextDiscussionStudio';
import { StoryBible, createDefaultStoryBible } from '../src/types/storyBible';

interface StoryStudioAppProps {
  onBackToHub?: () => void;
}

export default function StoryStudioApp({ onBackToHub }: StoryStudioAppProps) {
  const [activeTab, setActiveTab] = useState<'bible' | 'tournament' | 'script' | 'subtext'>('bible');
  const [bible, setBible] = useState<StoryBible>(() => {
    try {
      const stored = localStorage.getItem('story_bible_cache');
      return stored ? JSON.parse(stored) : createDefaultStoryBible();
    } catch {
      return createDefaultStoryBible();
    }
  });

  useEffect(() => {
    fetch('/api/story-bible')
      .then(res => res.json())
      .then(data => {
        if (data && data.concept) {
          setBible(data);
          localStorage.setItem('story_bible_cache', JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateBible = (updated: StoryBible) => {
    setBible(updated);
    localStorage.setItem('story_bible_cache', JSON.stringify(updated));
    fetch('/api/story-bible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => console.error("Failed to sync bible", err));
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col font-sans animate-fadeIn">
      {/* Story Studio Sub-Header */}
      <div className="h-14 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          {onBackToHub && (
            <button 
              onClick={onBackToHub}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Story Studio <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Cinematic Suite</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('bible')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bible'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Story Bible
          </button>
          <button
            onClick={() => setActiveTab('tournament')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tournament'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" /> Scene Tournament
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'script'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Phase 5 Scripting
          </button>
          <button
            onClick={() => setActiveTab('subtext')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'subtext'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" /> Subtext Studio
          </button>
        </div>
      </div>

      {/* Main Studio View Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'bible' && (
          <div className="p-6 max-w-[1800px] mx-auto animate-fadeIn">
            <StoryBiblePanel />
          </div>
        )}
        {activeTab === 'tournament' && (
          <div className="p-6 max-w-[1800px] mx-auto animate-fadeIn">
            <SceneTournamentPanel onSceneApproved={() => setActiveTab('script')} />
          </div>
        )}
        {activeTab === 'script' && (
          <div className="p-6 max-w-[1800px] mx-auto animate-fadeIn">
            <Phase5CinematicScriptPanel bible={bible} setBible={handleUpdateBible} />
          </div>
        )}
        {activeTab === 'subtext' && (
          <div className="p-6 max-w-[1800px] mx-auto animate-fadeIn">
            <SubtextDiscussionStudio 
              storyBible={bible} 
              onUpdateStoryBible={handleUpdateBible}
              onSwitchToHardcoreMode={() => setActiveTab('script')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
