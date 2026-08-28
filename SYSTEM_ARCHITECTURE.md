# J.A.R.V.I.S. AI Audiobook Studio — System Architecture & Workflow Map

## 1. Executive System Overview

The **J.A.R.V.I.S. AI Audiobook Studio** is an industrial-grade, multi-agent AI audio generation system designed for converting creative story concepts into production-ready, multi-speaker audiobooks with neural Edge-TTS voice synthesis.

---

## 2. Multi-Model Provider Fallback Architecture

To ensure 99.9% uptime and zero generation failures, the studio implements a 5-tier intelligent fallback engine (`/server/aiProviderService.ts`):

```
       [USER / API REQUEST]
                │
                ▼
      ┌──────────────────┐
      │  P1: GEMINI 3.1  │ ──► Primary Engine (Jarvis, Writer A/B/C)
      └─────────┬────────┘
                │ (On Error / Rate-Limit)
                ▼
      ┌──────────────────┐
      │   F1: MIMO v2.5  │ ──► Ultraspeed Fallback
      └─────────┬────────┘
                │ (On Error / Timeout)
                ▼
      ┌──────────────────┐
      │  F2: MOONSHOT v1 │ ──► Long-Context Fallback (128k)
      └─────────┬────────┘
                │ (On Error / Timeout)
                ▼
      ┌──────────────────┐
      │  F3: OPENROUTER  │ ──► Nemotron 550B Free Cluster
      └─────────┬────────┘
                │ (On Error / Timeout)
                ▼
      ┌──────────────────┐
      │     F4: GROQ     │ ──► Open-Source GPT 120B
      └──────────────────┘
```

### API Key Allocation Matrix
- **Jarvis (Brain)**: `GEMINI_KEY_JARVIS` | `JARVIS_GROQ_KEY` | `GROQ_KEY`
- **Writer Agent A**: `GEMINI_KEY_A`
- **Writer Agent B**: `GEMINI_KEY_B`
- **Writer Agent C**: `GEMINI_KEY_C`
- **Mimo Backup**: `MIMO_KEY_1`, `MIMO_KEY_2`
- **Moonshot Backup**: `MOONSHOT_API_KEY`
- **OpenRouter Backup**: `OPENROUTER_KEY`

---

## 3. End-to-End 4-Phase Pipeline Workflow

```
   ┌──────────────────────────┐
   │ PHASE 1: INTAKE & SCOPING │ ──► Guided Questionnaire / Narrative Prompt
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │  PHASE 2: STORY BIBLE    │ ──► Concept, World, Characters, Voice Allocations
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ PHASE 3: SCENE TOURNAMENT │ ──► Writer A & B Parallel Drafts ──► Writer C Synthesis
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ PHASE 4: SCRIPT OPTIMIZE │ ──► Script Formatting + JARVIS Critic Evaluation
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ EDGE-TTS AUDIO STUDIO    │ ──► Neural MP3 Voice Generation & Master Export
   └──────────────────────────┘
```

---

## 4. Component & Data Flow Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                          │
├───────────────────┬───────────────────┬──────────────────┬─────────────┤
│ IntakePanel.tsx   │ StoryBiblePanel   │ TournamentPanel  │ ScriptPanel │
└─────────┬─────────┴─────────┬─────────┴────────┬─────────┴──────┬──────┘
          │                   │                  │                │
          └───────────────────┼──────────────────┴────────────────┘
                              ▼
                        REST API Routes
  ┌────────────────────────────────────────────────────────┐
  │ /api/questionnaire/compile                             │
  │ /api/story-bible                                       │
  │ /api/tournament/generate                               │
  │ /api/script/optimize & /api/script/rewrite-line        │
  │ /api/tts/synthesize                                    │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
                Backend Services (/server)
  ┌───────────────────────────┴────────────────────────────┐
  │ aiProviderService.ts (P1-F4 Multi-Model Fallback)      │
  │ geminiService.ts (Compilation & Tournament Logic)      │
  │ ttsService.ts (Edge-TTS Neural Audio Synthesizer)      │
  │ storyBibleManager.ts (JSON & Markdown Storage)         │
  └────────────────────────────────────────────────────────┘
```

---

## 5. Live Test Results & Observed Friction Points

### Test Verification Summary:
1. **Phase 1 -> Phase 2 Compilation**: Tested via `/api/questionnaire/compile`. Successfully transformed raw inputs into a complete 9-section Story Bible.
2. **Phase 3 Scene Tournament**: Tested via `/api/tournament/generate`. Writer A and Writer B generated independent drafts in parallel; Writer C synthesized the final cinematic prose draft.
3. **Phase 4 Script Optimization**: Verified script formatting, voice tag injection, and JARVIS score critic evaluation.
4. **Edge-TTS Neural Audio Synthesis**: Verified via `/api/tts/synthesize`. Generated crisp `.mp3` audio files served cleanly over HTTP 200 with proper content headers.

### User Friction Points & UX Fixes Applied:
- **Array Safety in Story Bible**: Fixed non-array edge cases in LLM outputs (`timeline.map`, `characterProfiles.map`) by adding `Array.isArray(...)` guards in `storyBible.ts`.
- **Backend Route Mapping**: Corrected tournament endpoint route mapping from `/api/tournament/run` to `/api/tournament/generate`.
- **Multi-Model Resiliency**: Connected fallback providers (Mimo, Moonshot, OpenRouter, Groq) to prevent API key quota exhaustion.
