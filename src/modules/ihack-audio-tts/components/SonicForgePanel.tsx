import React, { useState } from 'react';
import { 
  Sliders, Cloud, Play, Download, Sparkles, Upload, 
  CheckCircle2, AlertCircle, Loader2, RefreshCw, Volume2, 
  Wand2, Shield, Activity
} from 'lucide-react';
import { Button } from './Button';
import { AuphonicService } from '../services/auphonicService';
import { MasteringService, DEFAULT_MASTERING_SETTINGS } from '../services/masteringService';
import { MasteringSettings } from '../types/ihackAudioTypes';
import { audioBufferToWav } from '../services/audioUtils';

export const SonicForgePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AUPHONIC' | 'LOCAL'>('LOCAL');
  
  // Auphonic Cloud state
  const [auphonicKey, setAuphonicKey] = useState<string>(() => localStorage.getItem('auphonic_api_key') || '');
  const [auphonicPreset, setAuphonicPreset] = useState<string>(() => localStorage.getItem('auphonic_preset_uuid') || '');
  const [cloudFile, setCloudFile] = useState<File | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string>('');
  const [cloudProgress, setCloudProgress] = useState<number>(0);
  const [cloudLoading, setCloudLoading] = useState<boolean>(false);
  const [cloudResultUrl, setCloudResultUrl] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Local Mastering Engine state
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [masteringSettings, setMasteringSettings] = useState<MasteringSettings>({
    ...DEFAULT_MASTERING_SETTINGS,
    loudnessTarget: -16,
    noiseReductionDb: 12,
    filteringMethod: 'voice_auto_eq',
    adaptiveLeveler: true
  });
  const [isProcessingLocal, setIsProcessingLocal] = useState<boolean>(false);
  const [localProgress, setLocalProgress] = useState<string>('');
  const [localResultUrl, setLocalResultUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAuphonicProcess = async () => {
    if (!cloudFile) {
      setCloudError('Please select an audio file to master.');
      return;
    }
    if (!auphonicKey.trim() || !auphonicPreset.trim()) {
      setCloudError('Auphonic API Key and Preset UUID are required.');
      return;
    }

    setCloudLoading(true);
    setCloudError(null);
    localStorage.setItem('auphonic_api_key', auphonicKey);
    localStorage.setItem('auphonic_preset_uuid', auphonicPreset);

    try {
      const service = new AuphonicService();
      const resultBlob = await service.processAudio(
        cloudFile,
        { apiKey: auphonicKey, presetUuid: auphonicPreset },
        (status, progress) => {
          setCloudStatus(status);
          setCloudProgress(progress);
        }
      );
      const url = URL.createObjectURL(resultBlob);
      setCloudResultUrl(url);
      setCloudStatus('Mastering Complete!');
    } catch (err: any) {
      setCloudError(err.message || 'Auphonic cloud processing failed.');
    } finally {
      setCloudLoading(false);
    }
  };

  const handleLocalMastering = async () => {
    if (!localFile) {
      setLocalError('Please upload an audio file to master.');
      return;
    }

    setIsProcessingLocal(true);
    setLocalError(null);
    setLocalProgress('Reading audio file...');

    try {
      const arrayBuffer = await localFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setLocalProgress('Decoding waveform...');
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);

      setLocalProgress('Applying adaptive leveler & spectral sculpting...');
      const masteringService = new MasteringService();
      const masteredBuffer = await masteringService.masterAudio(
        decoded,
        masteringSettings,
        (step) => setLocalProgress(step)
      );

      setLocalProgress('Rendering 48kHz WAV master...');
      const wavBlob = audioBufferToWav(masteredBuffer);
      const url = URL.createObjectURL(wavBlob);
      setLocalResultUrl(url);
      setLocalProgress('Mastering complete!');
    } catch (err: any) {
      console.error('Local mastering error:', err);
      setLocalError(err.message || 'Failed to process audio.');
    } finally {
      setIsProcessingLocal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 font-mono">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-sm font-bold">3B</span>
            Sonic Forge: Mastering Suite
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Dual-Engine Mastering: Offline DSP Neural Graph & Auphonic Cloud Integration</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('LOCAL')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'LOCAL' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:text-white'}`}
          >
            Local DSP Engine
          </button>
          <button
            onClick={() => setActiveTab('AUPHONIC')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'AUPHONIC' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:text-white'}`}
          >
            Auphonic Cloud
          </button>
        </div>
      </div>

      {activeTab === 'LOCAL' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Acoustic Sculpting Parameters
              </h3>

              <div className="space-y-4 font-mono text-xs">
                {/* File Drop / Select */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5">Source Audio File</label>
                  <label className="border border-dashed border-white/20 hover:border-purple-400/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 group">
                    <Upload className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mb-2 transition-all" />
                    <span className="text-slate-300 font-bold">
                      {localFile ? localFile.name : 'Click or drop audio file here'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">WAV, MP3, M4A, FLAC</span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLocalFile(e.target.files[0]);
                          setLocalResultUrl(null);
                        }
                      }} 
                    />
                  </label>
                </div>

                {/* Target Loudness */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Target Loudness:</span>
                    <span className="text-purple-400 font-bold">{masteringSettings.loudnessTarget} LUFS</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="-12"
                    step="1"
                    value={masteringSettings.loudnessTarget}
                    onChange={(e) => setMasteringSettings({ ...masteringSettings, loudnessTarget: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>-24 (Broadcast)</span>
                    <span>-16 (Apple/Podcast)</span>
                    <span>-14 (Spotify/Web)</span>
                  </div>
                </div>

                {/* Equalization Filter */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Filter Profile</label>
                  <select
                    value={masteringSettings.filteringMethod}
                    onChange={(e) => setMasteringSettings({ ...masteringSettings, filteringMethod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-slate-200 outline-none focus:border-purple-500"
                  >
                    <option value="voice_auto_eq">Voice Auto-EQ (Sub-bass Cut + Mid Presence)</option>
                    <option value="highpass">High-Pass Filter (80Hz Roll-off)</option>
                    <option value="bandwidth_extension">Harmonic Bandwidth Extension</option>
                    <option value="none">Flat (Bypass Filter)</option>
                  </select>
                </div>

                {/* Noise Reduction */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Noise Suppression:</span>
                    <span className="text-purple-400 font-bold">{masteringSettings.noiseReductionDb} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="1"
                    value={masteringSettings.noiseReductionDb}
                    onChange={(e) => setMasteringSettings({ ...masteringSettings, noiseReductionDb: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Adaptive Leveler */}
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <div>
                    <div className="text-slate-200 font-bold">Adaptive Multiband Leveler</div>
                    <div className="text-[10px] text-slate-400">Smooths dynamic volume swings automatically</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={masteringSettings.adaptiveLeveler}
                    onChange={(e) => setMasteringSettings({ ...masteringSettings, adaptiveLeveler: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                </div>

                {localError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{localError}</span>
                  </div>
                )}

                <Button
                  onClick={handleLocalMastering}
                  disabled={!localFile || isProcessingLocal}
                  isLoading={isProcessingLocal}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-lg shadow-purple-950/50 mt-4"
                  icon={<Wand2 className="w-4 h-4" />}
                >
                  Render Master Audio
                </Button>
              </div>
            </div>
          </div>

          {/* Results & Waveform */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[420px]">
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Mastering Output & Telemetry
                </h3>

                {isProcessingLocal && (
                  <div className="p-8 flex flex-col items-center justify-center gap-4 text-center my-12">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                    <div className="text-sm font-mono text-purple-300 font-bold">{localProgress}</div>
                    <div className="text-xs text-slate-500 font-mono">Running Offline Web Audio DSP Graph...</div>
                  </div>
                )}

                {!isProcessingLocal && localResultUrl && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 font-mono text-xs">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span>Audio mastered successfully with {masteringSettings.loudnessTarget} LUFS target curve.</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Mastered Waveform Playback</div>
                      <audio controls src={localResultUrl} className="w-full h-10 outline-none rounded-lg" />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase font-mono tracking-wider shadow-lg"
                        icon={<Download className="w-4 h-4" />}
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = localResultUrl;
                          a.download = `mastered_${localFile?.name || 'audio'}.wav`;
                          a.click();
                        }}
                      >
                        Download 48kHz Master
                      </Button>
                    </div>
                  </div>
                )}

                {!isProcessingLocal && !localResultUrl && (
                  <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-slate-500 font-mono text-xs my-8 flex flex-col items-center justify-center gap-3">
                    <Volume2 className="w-8 h-8 opacity-40 text-slate-400" />
                    <span>Upload a file and click "Render Master Audio" to generate broadcast-ready output.</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/80 border border-white/5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Bit Depth: 16-bit PCM Linear</span>
                <span>Sample Rate: 48,000 Hz Standard</span>
                <span>Channels: Stereo Resampled</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Auphonic Cloud View */
        <div className="max-w-2xl mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-base font-mono font-bold text-white uppercase">Auphonic Cloud Production Engine</h3>
              <p className="text-xs text-slate-400 font-mono">Automated Cloud Loudness & Noise Reduction via API</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Auphonic API Key</label>
              <input
                type="password"
                placeholder="Enter Auphonic user API key..."
                value={auphonicKey}
                onChange={(e) => setAuphonicKey(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Preset UUID</label>
              <input
                type="text"
                placeholder="e.g. bG29Qh7zP..."
                value={auphonicPreset}
                onChange={(e) => setAuphonicPreset(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-200 outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5">Source Audio File</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCloudFile(e.target.files[0]);
                    setCloudResultUrl(null);
                  }
                }}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-200 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
              />
            </div>

            {cloudError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cloudError}</span>
              </div>
            )}

            {cloudLoading && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex justify-between text-purple-300 font-bold">
                  <span>{cloudStatus}</span>
                  <span>{cloudProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${cloudProgress}%` }} />
                </div>
              </div>
            )}

            {cloudResultUrl && (
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3 animate-fadeIn">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Cloud Mastering Succeeded
                </div>
                <audio controls src={cloudResultUrl} className="w-full h-10 outline-none" />
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = cloudResultUrl;
                    a.download = `auphonic_master_${Date.now()}.mp3`;
                    a.click();
                  }}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Cloud Master
                </Button>
              </div>
            )}

            <Button
              onClick={handleAuphonicProcess}
              disabled={!cloudFile || cloudLoading}
              isLoading={cloudLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl uppercase text-xs tracking-wider shadow-lg shadow-purple-950/50 mt-2"
              icon={<Cloud className="w-4 h-4" />}
            >
              Start Auphonic Cloud Production
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
