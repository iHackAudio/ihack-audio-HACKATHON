import React, { useState } from 'react';
import { Sparkles, Zap, Cpu, Check, Copy, ArrowRight, CheckCircle2, Wand2, Edit3 } from 'lucide-react';
import { ConceptData, StoryFlixBible } from '../types/storyFlix';
import { analyzeCoreIdea } from '../services/storyFlixApi';

interface CoreIdeaStudioProps {
  bible: StoryFlixBible;
  onUpdateConcept: (concept: ConceptData, actionDetails: string) => Promise<void>;
  onProceedToPersonas: () => void;
}

export const CoreIdeaStudio: React.FC<CoreIdeaStudioProps> = ({
  bible,
  onUpdateConcept,
  onProceedToPersonas
}) => {
  const [theme, setTheme] = useState(
    bible.concept.thematicMotifs?.join(', ') || 'Isolated Survival, Memory Erasure, Cosmic Deception'
  );
  const [charactersOverview, setCharactersOverview] = useState(
    bible.characterProfiles.length > 0
      ? bible.characterProfiles.map(c => `${c.name} (${c.role})`).join(', ')
      : 'Commander Silas Vance (Beacon Keeper), Dr. Mara Aris (Theoretical Physicist), V.A.N.C.E. (Station AI)'
  );
  const [storylineOverview, setStorylineOverview] = useState(
    bible.concept.summary ||
    'A deep-space research lighthouse experiences an anomaly where the stars outside vanish. As the crew attempts to re-calibrate communications, they discover the station is caught in an echo-chamber that mimics their deepest secrets.'
  );
  const [format, setFormat] = useState(bible.concept.format || 'Full-Cast Audio Drama');
  const [genreVibe, setGenreVibe] = useState(bible.concept.genre || 'Sci-Fi Psychological Thriller');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    concept: ConceptData;
    suggestions: string[];
  } | null>(bible.concept.title ? { concept: bible.concept, suggestions: [] } : null);

  const [checkedSuggestions, setCheckedSuggestions] = useState<string[]>([]);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const handlePreFillSample = () => {
    setTheme('Subterranean Resonance, Bio-Acoustic Tuning, Cognitive Muting');
    setCharactersOverview('Kaelen (Frequency Tuner, outlaw), Dr. Aris (Lead Bio-Engineer, covert rebel), Director Vance (Core Enforcer)');
    setStorylineOverview('In a subterranean mega-city powered by bio-acoustic resonance, an outlaw frequency tuner uncovers a conspiracy to erase human emotions before midnight.');
    setFormat('Full-Cast Audio Drama');
    setGenreVibe('Cyberpunk Audio Thriller');
  };

  const handleAnalyze = async (customStorylineOverride?: string) => {
    setIsAnalyzing(true);
    try {
      const data = await analyzeCoreIdea({
        theme,
        charactersOverview,
        storylineOverview: customStorylineOverride || storylineOverview,
        format,
        genreVibe
      });
      setAnalysisResult(data);
      if (data.concept) {
        await onUpdateConcept(
          data.concept,
          `Synthesized core concept "${data.concept.title || 'Untitled'}" and updated Story Bible & CPSD.`
        );
      }
    } catch (err) {
      console.error('Failed to analyze core idea:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewriteLogline = () => {
    const punchySynopsis = `${storylineOverview} Tensions escalate as an unexpected betrayal shatters their only escape route.`;
    setStorylineOverview(punchySynopsis);
    handleAnalyze(punchySynopsis);
  };

  const handleToggleSuggestion = (s: string) => {
    if (checkedSuggestions.includes(s)) {
      setCheckedSuggestions(checkedSuggestions.filter(item => item !== s));
    } else {
      setCheckedSuggestions([...checkedSuggestions, s]);
    }
  };

  const handleApplySuggestionsAndConfirm = async () => {
    if (!analysisResult) return;
    const updated: ConceptData = {
      ...analysisResult.concept,
      thematicMotifs: theme.split(',').map(s => s.trim()).filter(Boolean),
      format,
      genre: genreVibe
    };
    await onUpdateConcept(
      updated,
      `Confirmed core story idea "${updated.title}" and locked into CPSD.`
    );
    onProceedToPersonas();
  };

  const handleCopyConcept = () => {
    if (!analysisResult?.concept) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult.concept, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header Card */}
      <div className="bg-[#0e1322] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30">
              StoryFlix • Step 1
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Core Story Idea & World Premise</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Draft your central premise, theme, format, and world rules. Everything updates the Character-Plot-Setting Dossier (CPSD) in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreFillSample}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Pre-fill with rich sci-fi cyberpunk sample"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Sample Preset</span>
            </button>

            {bible.concept.title && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active: "{bible.concept.title}"</span>
              </div>
            )}
          </div>
        </div>

        {/* 5 Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
              1. Theme & Thematic Motifs
            </label>
            <input
              type="text"
              className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Forbidden Knowledge, Memory Erasure, Cosmic Isolation"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
              2. Key Characters Overview (Seed)
            </label>
            <input
              type="text"
              className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
              value={charactersOverview}
              onChange={(e) => setCharactersOverview(e.target.value)}
              placeholder="e.g. Silas Vance (Station Keeper), Dr. Mara Aris (Scientist), V.A.N.C.E. (AI)"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold uppercase text-slate-300">
                3. Storyline Synopsis & Central Conflict
              </label>
              <button
                onClick={handleRewriteLogline}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Enhance Stakes</span>
              </button>
            </div>
            <textarea
              className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none h-24 placeholder-slate-600"
              value={storylineOverview}
              onChange={(e) => setStorylineOverview(e.target.value)}
              placeholder="Describe the inciting incident, escalating danger, and core dilemma..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
                4. Target Format
              </label>
              <input
                type="text"
                className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
                5. Genre & Atmosphere Vibe
              </label>
              <input
                type="text"
                className="w-full bg-[#080c14] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                value={genreVibe}
                onChange={(e) => setGenreVibe(e.target.value)}
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:scale-[1.005] transition-all cursor-pointer border border-amber-300 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                <span>AI Synthesizing Core Idea & World Rules...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Synthesize Core Story Idea & Update Bible</span>
              </>
            )}
          </button>
        </div>

        {/* Synthesized Output Display */}
        {analysisResult?.concept && (
          <div className="pt-6 border-t border-white/10 space-y-5 animate-fadeIn">
            <div className="bg-[#080c14] p-5 rounded-xl border border-amber-500/30 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  Synthesized Story Blueprint
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">{analysisResult.concept.genre}</span>
                  <button
                    onClick={handleCopyConcept}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-white/10 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{analysisResult.concept.title}</h3>
                <p className="text-xs text-amber-200/90 italic font-medium mt-1">"{analysisResult.concept.hook}"</p>
              </div>

              <div className="bg-[#0b101d] p-3.5 rounded-lg border border-white/10">
                <p className="text-xs text-slate-200 leading-relaxed font-normal">{analysisResult.concept.summary}</p>
              </div>

              {/* Core World Pillars & Conflicts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {analysisResult.concept.corePremiseAndWorld && analysisResult.concept.corePremiseAndWorld.length > 0 && (
                  <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                      🌍 Core Premise & World Rules
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                      {analysisResult.concept.corePremiseAndWorld.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.concept.keyConflictPillars && analysisResult.concept.keyConflictPillars.length > 0 && (
                  <div className="bg-[#0d1322] p-3 rounded-lg border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">
                      ⚡ Key Conflict Pillars
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                      {analysisResult.concept.keyConflictPillars.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Strategic Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    AI Strategic Suggestions:
                  </span>
                  <div className="space-y-1.5">
                    {analysisResult.suggestions.map((s, idx) => (
                      <label
                        key={idx}
                        onClick={() => handleToggleSuggestion(s)}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                          checkedSuggestions.includes(s)
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                            : 'bg-[#080c14] border-white/10 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedSuggestions.includes(s)}
                          onChange={() => {}}
                          className="accent-amber-500"
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation & Next Step */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400 italic">
                Step 1 saves automatically to the Story Bible and updates your CPSD master document.
              </span>

              <button
                onClick={handleApplySuggestionsAndConfirm}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
              >
                <span>Confirm & Proceed to Extract Personas</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
