# Rebuild & Consolidation Workflow Checklist (Modular Architecture)

## Phase 1: Directory Setup & Structural Mapping
- [x] Create module directory trees:
  - `/src/modules/storyflix/` (Verified & active)
  - `/src/modules/jarvis-scripting/` (`components/`, `services/`, `types/`)
  - `/src/modules/ihack-audio-tts/` (`components/`, `services/`, `types/`)
  - `/src/modules/audio-analyzer/` (`components/`, `services/`, `types/`)

## Phase 2: iHack Audio TTS Module (`/src/modules/ihack-audio-tts`)
- [ ] Create `types/ihackAudioTypes.ts` with all TTS, voice, preset, and mastering types.
- [ ] Migrate & create services:
  - `services/geminiTtsService.ts` (speech synthesis, multi-speaker, chunking, buffer concat)
  - `services/iHackPodcastService.ts` (Echo/Noise banter generation, system instructions)
  - `services/auphonicService.ts`
  - `services/masteringService.ts`
  - `services/audioUtils.ts`
  - `services/keyRegistry.ts`
- [ ] Migrate & create components:
  - `components/NeuralStudioSynthesis.tsx` (Manual Synthesis Editor, Duo/Solo mode, preset templates)
  - `components/SonicForgePanel.tsx` (Auphonic Cloud + Live Lab)
  - `components/MedicalScriptLab.tsx`
  - `components/EdgeTtsStudioModal.tsx`
  - `components/TTSSettingsModal.tsx`
  - `components/VoiceModal.tsx`
  - `components/CollaborativeWorkspace.tsx`
  - `components/VoiceAssistantWidget.tsx`
  - `components/ResizableTextarea.tsx`
- [ ] Create `IHackAudioTtsApp.tsx` & `index.ts`.

## Phase 3: Audio Analyzer Module (`/src/modules/audio-analyzer`)
- [ ] Create `types/audioAnalyzerTypes.ts` with forensic acoustic, loudness, and audit types.
- [ ] Migrate & create services:
  - `services/audioAnalysisService.ts` (EBU R128 integrated loudness, True Peak, noise floor, spectral centroid)
  - `services/useRealtimeMastering.ts`
- [ ] Migrate & create components:
  - `components/ForensicDossierView.tsx`
  - `components/ConsolidatedDossierReport.tsx`
  - `components/ClientDeliveryReport.tsx`
  - `components/RealtimeMasteringPanel.tsx`
  - `components/AnalysisTerminal.tsx`
- [ ] Create `AudioAnalyzerApp.tsx` & `index.ts`.

## Phase 4: Jarvis Scripting Module (`/src/modules/jarvis-scripting`)
- [ ] Create `types/jarvisTypes.ts` with chat, agent logs, thinking state, and JOJO settings types.
- [ ] Migrate & create services:
  - `services/jarvisService.ts`
  - `services/geminiScriptService.ts`
  - `services/apiLoggerService.ts`
  - `services/backupService.ts`
- [ ] Migrate & enhance components:
  - `components/JarvisAuraApp.tsx`
  - `components/JarvisConsole.tsx`
  - `components/JojoSettingsPanel.tsx`
  - `components/ChatPanel.tsx`
  - `components/AgentLogsPanel.tsx`
  - `components/AgentThinkingCharacter.tsx`
  - `components/LiveLogPanel.tsx`
  - `components/SubtextDiscussionStudio.tsx`
  - `components/Phase5CinematicScriptPanel.tsx`
  - `components/SceneTournamentPanel.tsx`
  - `components/ScriptOptimizationPanel.tsx`
  - `components/CognitivePipelineVisualizer.tsx`
  - `components/SimplifiedPipelineDemo.tsx`
- [ ] Update `JarvisScriptingApp.tsx` & `index.ts`.

## Phase 5: Root Router & Entry Integration
- [ ] Update `src/App.tsx` to seamlessly host all 4 modules with a Stage Switcher and an Overview Hub.
- [ ] Update `index.tsx` and `App.tsx` so Vite bundles cleanly from `src/App.tsx`.
- [ ] Verify TypeScript types, relative imports, and build correctness.

