import React, { useState } from 'react';
import { Users, Sparkles, Plus, Edit, Trash2, Save, X, ArrowRight, Volume2, Upload, FileAudio, Cpu, Zap, AlertCircle, Check } from 'lucide-react';
import { CharacterPersona, StoryFlixBible, BiometricScanData } from '../types/storyFlix';
import { extractPersonas, uploadForgeScan } from '../services/storyFlixApi';

interface PersonaExtractorProps {
  bible: StoryFlixBible;
  onUpdatePersonas: (personas: CharacterPersona[], actionDetails: string) => Promise<void>;
  onProceedToSceneMatrix: () => void;
}

export const PersonaExtractor: React.FC<PersonaExtractorProps> = ({
  bible,
  onUpdatePersonas,
  onProceedToSceneMatrix
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'forge'>('list');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<CharacterPersona | null>(null);

  // Forge audio scan state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedSpeakers, setScannedSpeakers] = useState<any[]>([]);

  const [newChar, setNewChar] = useState<Partial<CharacterPersona>>({
    role: 'protagonist',
    voiceId: 'Kore',
    vocalProfile: 'Resonant & Clear (en-US)'
  });

  const handleAutoExtract = async () => {
    setIsExtracting(true);
    try {
      const extracted = await extractPersonas({
        charactersOverview: bible.concept.thematicMotifs?.join(', ') || bible.concept.title,
        storylineOverview: bible.concept.summary || 'Deep space audio drama with high stakes',
        genreVibe: bible.concept.genre || 'Sci-Fi'
      });

      if (extracted.length > 0) {
        await onUpdatePersonas(
          extracted,
          `Auto-extracted ${extracted.length} personas and synchronized with Story Bible & CPSD.`
        );
      }
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScanError(null);
    if (!file) return;

    if (file.size > 9 * 1024 * 1024) {
      setScanError('File exceeds the 9MB limit. Please upload an audio or video file under 9MB.');
      return;
    }
    setUploadedFile(file);
  };

  const handleExecuteBiometricScan = async () => {
    if (!uploadedFile) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const data = await uploadForgeScan(uploadedFile);
      if (data.speakers && Array.isArray(data.speakers) && data.speakers.length > 0) {
        setScannedSpeakers(data.speakers);
      } else {
        throw new Error('No distinct speaker signatures identified in the audio track.');
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
      setScanError(err.message || 'Audio scan encountered an issue. Using synthesized vocal fallback.');
      setScannedSpeakers([
        {
          name: 'Detected Character 1',
          gender: 'Female',
          accent: 'Standard Neutral',
          tone: 'Low, Resonant, Controlled Urgency',
          audioProfile: 'Clear acoustic profile with crisp diction',
          styleDescription: 'Speaks with technical precision and deliberate pauses before key reveals.',
          suggestedBaseVoice: 'Kore'
        }
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddScannedSpeaker = async (speaker: any) => {
    const persona: CharacterPersona = {
      id: `char_scan_${Date.now()}`,
      name: speaker.name || 'Scanned Persona',
      role: 'protagonist',
      age: '30s',
      vocalProfile: `${speaker.tone || 'Resonant'} (${speaker.accent || 'Neutral'})`,
      voiceId: speaker.suggestedBaseVoice || 'Kore',
      background: speaker.audioProfile || 'Extracted from audio scan.',
      speechQuirks: speaker.styleDescription || '',
      motivations: speaker.context || 'Determined to uncover the truth.',
      biometricScan: {
        gender: speaker.gender,
        accent: speaker.accent,
        tone: speaker.tone,
        audioProfile: speaker.audioProfile,
        styleDescription: speaker.styleDescription,
        suggestedBaseVoice: speaker.suggestedBaseVoice
      },
      isLocked: true
    };

    const updated = [...bible.characterProfiles, persona];
    await onUpdatePersonas(
      updated,
      `Added scanned persona '${persona.name}' to Story Bible & CPSD.`
    );
    setScannedSpeakers(prev => prev.filter(s => s !== speaker));
  };

  const handleSaveNewCharacter = async () => {
    if (!newChar.name?.trim()) return;
    const persona: CharacterPersona = {
      id: `char_${Date.now()}`,
      name: newChar.name.trim(),
      role: newChar.role || 'supporting',
      age: newChar.age || '30s',
      vocalProfile: newChar.vocalProfile || 'Clear and natural',
      voiceId: newChar.voiceId || 'Kore',
      background: newChar.background || '',
      speechQuirks: newChar.speechQuirks || '',
      motivations: newChar.motivations || '',
      isLocked: true
    };

    const updated = [...bible.characterProfiles, persona];
    await onUpdatePersonas(
      updated,
      `Created character persona '${persona.name}' and appended to CPSD.`
    );
    setIsAddingNew(false);
    setNewChar({ role: 'supporting', voiceId: 'Kore' });
  };

  const handleSaveEdit = async () => {
    if (!editingData || !editingId) return;
    const updated = bible.characterProfiles.map(c => c.id === editingId ? editingData : c);
    await onUpdatePersonas(
      updated,
      `Updated character persona '${editingData.name}'.`
    );
    setEditingId(null);
    setEditingData(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const updated = bible.characterProfiles.filter(c => c.id !== id);
    await onUpdatePersonas(
      updated,
      `Removed character persona '${name}' from Story Bible.`
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0e1322] border border-sky-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/15 px-2.5 py-1 rounded border border-sky-500/30">
              StoryFlix • Step 2
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Character Persona Extractor & Voice Matrix</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Extract character personas directly from your premise, assign neural Gemini TTS voices, or scan audio/video files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'list' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Personas ({bible.characterProfiles.length})
              </button>
              <button
                onClick={() => setActiveTab('forge')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'forge' ? 'bg-purple-500 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileAudio className="w-3 h-3" />
                <span>Audio Scan</span>
              </button>
            </div>

            <button
              onClick={handleAutoExtract}
              disabled={isExtracting}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
              <span>{isExtracting ? 'Extracting...' : '✨ Auto-Extract'}</span>
            </button>

            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>➕ Add Persona</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab 1: Persona List & Editor */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Add Character Modal Form */}
            {isAddingNew && (
              <div className="bg-[#080c14] p-5 rounded-xl border border-purple-500/40 space-y-4 animate-fadeIn shadow-xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black uppercase text-purple-300 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Character Persona</span>
                  </h4>
                  <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Character Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Silas Vance"
                      className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                      value={newChar.name || ''}
                      onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dramatic Role</label>
                    <select
                      className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-sky-300 font-bold outline-none focus:border-purple-400"
                      value={newChar.role || 'protagonist'}
                      onChange={(e) => setNewChar({ ...newChar, role: e.target.value as any })}
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option>
                      <option value="narrator">Narrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini / TTS Voice Profile</label>
                    <select
                      className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-purple-300 font-bold outline-none focus:border-purple-400 font-mono"
                      value={newChar.voiceId || 'Kore'}
                      onChange={(e) => setNewChar({ ...newChar, voiceId: e.target.value })}
                    >
                      <option value="Kore">Kore (Resonant Female)</option>
                      <option value="Puck">Puck (Energetic Male)</option>
                      <option value="Charon">Charon (Deep & Authoritative Male)</option>
                      <option value="Fenrir">Fenrir (Gravelly Intense Male)</option>
                      <option value="Zephyr">Zephyr (Smooth & Calm Female)</option>
                      <option value="Aoede">Aoede (Expressive Dramatic Female)</option>
                      <option value="Orpheus">Orpheus (Rich Narrative Male)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vocal Profile & Delivery Tone</label>
                    <input
                      type="text"
                      placeholder="e.g. Low, raspy, deliberate cadence with cautious pauses"
                      className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400"
                      value={newChar.vocalProfile || ''}
                      onChange={(e) => setNewChar({ ...newChar, vocalProfile: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Backstory & Secrets</label>
                    <input
                      type="text"
                      placeholder="e.g. Station keeper harboring guilt over an abandoned rescue mission"
                      className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400"
                      value={newChar.background || ''}
                      onChange={(e) => setNewChar({ ...newChar, background: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewCharacter}
                    className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Persona</span>
                  </button>
                </div>
              </div>
            )}

            {/* Persona Cards Grid */}
            {bible.characterProfiles.length === 0 ? (
              <div className="p-8 text-center bg-[#080c14] rounded-xl border border-white/10 space-y-3">
                <Users className="w-8 h-8 text-sky-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  No character personas created yet. Click <strong>"✨ Auto-Extract"</strong> or use <strong>"Audio Scan"</strong> to build your cast!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bible.characterProfiles.map((c) => {
                  const isEditing = editingId === c.id;

                  if (isEditing && editingData) {
                    return (
                      <div key={c.id} className="bg-[#080c14] p-4 rounded-xl border border-sky-500/50 space-y-3 col-span-1 md:col-span-2 shadow-lg">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <h4 className="font-bold text-sky-300 text-xs uppercase tracking-wide">
                            Edit Persona: {c.name}
                          </h4>
                          <button onClick={() => { setEditingId(null); setEditingData(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                            <input
                              type="text"
                              className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-sky-400"
                              value={editingData.name}
                              onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                            <select
                              className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-bold outline-none focus:border-sky-400"
                              value={editingData.role}
                              onChange={(e) => setEditingData({ ...editingData, role: e.target.value as any })}
                            >
                              <option value="protagonist">Protagonist</option>
                              <option value="antagonist">Antagonist</option>
                              <option value="supporting">Supporting</option>
                              <option value="narrator">Narrator</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini TTS Voice</label>
                            <select
                              className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-bold outline-none focus:border-sky-400 font-mono"
                              value={editingData.voiceId}
                              onChange={(e) => setEditingData({ ...editingData, voiceId: e.target.value })}
                            >
                              <option value="Kore">Kore (Resonant Female)</option>
                              <option value="Puck">Puck (Energetic Male)</option>
                              <option value="Charon">Charon (Deep / Authoritative Male)</option>
                              <option value="Fenrir">Fenrir (Gravelly Male)</option>
                              <option value="Zephyr">Zephyr (Smooth Female)</option>
                              <option value="Aoede">Aoede (Dramatic Female)</option>
                              <option value="Orpheus">Orpheus (Narrative Male)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vocal Profile</label>
                          <input
                            type="text"
                            className="w-full bg-[#0d1322] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-400"
                            value={editingData.vocalProfile}
                            onChange={(e) => setEditingData({ ...editingData, vocalProfile: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => { setEditingId(null); setEditingData(null); }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const roleColors = {
                    protagonist: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                    antagonist: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                    supporting: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                    narrator: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  };

                  return (
                    <div key={c.id} className="bg-[#080c14] p-4 rounded-xl border border-white/10 space-y-3 hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{c.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleColors[c.role] || roleColors.supporting}`}>
                              {c.role}
                            </span>
                          </div>
                          {c.background && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.background}</p>
                          )}
                        </div>

                        <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 text-[10px] font-mono font-bold uppercase border border-purple-500/30 shrink-0">
                          Voice: {c.voiceId}
                        </span>
                      </div>

                      {c.vocalProfile && (
                        <div className="bg-[#0d1322] p-2 rounded-lg border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{c.vocalProfile}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[11px] text-slate-500 font-mono">ID: {c.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingId(c.id); setEditingData({ ...c }); }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/10"
                          >
                            <Edit className="w-3 h-3 text-sky-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer border border-rose-500/20"
                            title="Delete Persona"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: Audio/Video File Biometric Scan */}
        {activeTab === 'forge' && (
          <div className="bg-[#080c14] p-5 rounded-xl border border-white/10 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-sky-400 uppercase tracking-widest text-[10px]">
                  Input Audio / Video File for AI Diarization
                </span>
                <span className="text-slate-400 font-mono text-[10px]">MP3, WAV, MP4, WEBM (MAX 9MB)</span>
              </div>

              <div className="relative border-2 border-dashed border-sky-500/30 hover:border-sky-400 rounded-xl p-6 text-center bg-[#0d1322] transition-all cursor-pointer">
                <input
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.mp4,.webm"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {uploadedFile ? uploadedFile.name : 'Click or Drag Audio/Video File to Upload'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Files up to 9MB supported for AI vocal profile extraction'}
                    </p>
                  </div>
                </div>
              </div>

              {scanError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <button
                onClick={handleExecuteBiometricScan}
                disabled={!uploadedFile || isScanning}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-white font-black uppercase text-xs tracking-wider cursor-pointer border border-purple-300 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
              >
                {isScanning ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin text-white" />
                    <span>Executing Neural Biometric Scan...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Execute Vocal Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Scanned Speakers Output */}
            {scannedSpeakers.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Detected Vocal Signature ({scannedSpeakers.length})
                </span>
                {scannedSpeakers.map((s, idx) => (
                  <div key={idx} className="bg-[#0d1322] p-4 rounded-xl border border-emerald-500/30 space-y-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-white text-sm">{s.name}</h5>
                      <p className="text-xs text-slate-300">{s.tone} • {s.accent}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{s.styleDescription}</p>
                    </div>
                    <button
                      onClick={() => handleAddScannedSpeaker(s)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase cursor-pointer shrink-0 shadow-md flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Story Personas</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progression to Step 3 */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={onProceedToSceneMatrix}
            disabled={bible.characterProfiles.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.4)] cursor-pointer"
          >
            <span>Proceed to 3x3 Scene Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
