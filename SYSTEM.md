# AI Audiobook Studio: Full System Architecture & Workflow Manual

## 1. Executive System Overview & Mission

The **J.A.R.V.I.S. AI Audiobook Studio** is an industrial-grade, multi-agent AI audio generation system designed to convert creative story concepts into production-ready, multi-speaker audiobooks with neural Edge-TTS voice synthesis.

The system operates as a unified agentic matrix led by **J.A.R.V.I.S. ("The Director's Ear")**, supported by a specialized production writer roster:
- **Phase 2 Bible Cartographer**: Compiles intake responses into locked Story Bibles using `STORY_PRODUCTION_SKILL_SYSTEM.md`.
- **Writer A ("The Wound Keeper")**: Emotional Arc & Vulnerability Specialist.
- **Writer B ("The Architect of Pressure")**: Dynamic Tension & Pacing Specialist.
- **Writer C ("The Excavator")**: Master Synthesizer extracting the master prose.
- **Slot A ("The Architect")**: Production Script Architect.
- **Slot B ("The Pulse")**: Vocal Cadence & Performer Direction Specialist.
- **Slot C ("The Final Eye")**: Script Polisher & Merger.
- **J.A.R.V.I.S. ("The Director's Ear")**: Chief Evaluator & Director generating the final production script (`jarvisFinal`).

---

## 2. Workspace Storage, Categorized Taxonomy & Story-Based Directory Protocol

### Clean Workspace Categorization Strategy
To prevent workspace clutter when managing dozens or hundreds of project files, all workspace files are organized into dedicated subdirectories within `/workspace files`:

```
/workspace files
├── skills/                           ◄ Dedicated Custom Skills Directory
│   ├── STORY_PRODUCTION_SKILL_SYSTEM.md ◄ Skill 1-4 Production Framework
│   ├── SCRIPTING_SKILL.md            ◄ Oscar-Level Cinematic Writing Skill
│   └── audio_atmosphere_skill.md     ◄ Edge-TTS & soundscape guidelines
├── stories/                          ◄ Automated Story Projects Hub
│   ├── The_Echoes_of_Aethelgard/     ◄ Auto-created folder per story title
│   │   ├── questionnaire.json        ◄ Step 1 intake state & answers
│   │   ├── story_bible.json          ◄ Structured story bible
26: │   │   ├── STORY_BIBLE.md            ◄ Rendered story bible markdown
│   │   ├── scene_1_brief.json        ◄ Detailed scene objective brief
│   │   ├── draft_A.txt               ◄ Writer A draft (The Wound Keeper)
│   │   ├── draft_B.txt               ◄ Writer B draft (The Architect of Pressure)
│   │   ├── draft_C.txt               ◄ Writer C merged master draft (The Excavator)
│   │   └── script_chapter_1.txt      ◄ Final edited script with voice tags
│   └── Shore_of_Echoes/              ◄ Isolated directory for story #2
├── exports/                          ◄ Final Rendered Audiobooks & Screenplays
│   └── echoes_chapter_1.mp3          ◄ Edge-TTS multi-speaker MP3s
└── references/                       ◄ Research, Uploaded Notes & Source Material
    └── worldbuilding_notes.docx
```

### Story Project Subfolder Auto-Creation
- **Automatic Directory Provisioning**: Whenever a user or agent initiates a new story project, a dedicated folder is created under `/workspace files/stories/<story_title>/`.
- **File Isolation**: All story-specific assets (questionnaire, story bible, scene briefs, drafts A/B/C, final script files) are stored exclusively in that story's dedicated subfolder.
- **Cross-Session Persistence**: Folder trees persist across browser reboots, re-logins, or dev container refreshes.

---

## 3. Skill System & Dynamic Context Anchor Ingestion Protocol

### Skill Injection Doctrine
- Skill markdown files live in `/skills/` (server-side system cache) and `/workspace files/skills/` (user-accessible workspace).
- `loadSkill(skillName)` loads skill files with in-memory caching and ENOENT safety guards.
- Every generation call is stateless: Skill file loads fresh from disk, Context Anchor is injected before every scene prompt, context discards after every call.

### Context Anchor Engine
Before any tournament or script generation call, `buildContextAnchor()` constructs a deterministic context block directly from Story Bible state:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT ANCHOR — [STORY TITLE] — [SCENE X: Title]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPT: Locked concept summary, genre, tone
ACTIVE CHARACTERS IN THIS SCENE: Profiles, vocal profile, speech quirks
PREVIOUSLY (story so far - emotional beat): Dominant emotional beat from prior scene (scenes[n-1].emotionalBeat)
THIS SCENE MUST: Scene objectives and mandatory turning points
COMING NEXT: Opening tone/teaser for subsequent scene
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 4. Agent Identity System & Production Writer Roster

| Phase & Agent | Identity & Role | Core Focus & Hard Boundary |
| --- | --- | --- |
| **Phase 2: Bible Cartographer** | Showrunner / Architect | Transforms questionnaire into complete 9-section Story Bible using `STORY_PRODUCTION_SKILL_SYSTEM.md`. |
| **Phase 3: Writer A** | "The Wound Keeper" | Raw emotional prose, visceral body sensory details, vulnerability. Scope: Draft A only. |
| **Phase 4: Writer B** | "The Architect of Pressure" | High tension, verbal chess, relentless pacing, subtext. Scope: Draft B only. |
| **Phase 3: Writer C** | "The Excavator" | Master synthesizer. Extracts peak moments of A & B into single master prose + extracts `emotionalBeat`. |
| **Phase 4: Slot A** | "The Architect" | Converts master prose to clean, production-formatted script bones with character states. |
| **Phase 4: Slot B** | "The Pulse" | Alternative script with vocal cadence and performer directions. |
| **Phase 4: Slot C** | "The Final Eye" | Merges Slot A & B into master production script within character limit constraints. |
| **Phase 4: J.A.R.V.I.S.** | "The Director's Ear" | Chief Evaluator & Director. Performs 2-Phase execution: Phase 1 Diagnosis + Phase 2 Final Corrected Script (`jarvisFinal`). |

---

## 5. Model Tier Routing & Provider Fallback Architecture

To ensure speed and high narrative reasoning quality, `TIER_MODEL_MAP` maps each phase to dedicated primary and fallback models:

```typescript
export const TIER_MODEL_MAP = {
  INTAKE: { primary: "gemini-3.1-flash-lite", fallback: "openai/gpt-oss-120b" },
  BIBLE: { primary: "gemini-3.6-flash", fallback: ["gemini-3.5-flash", "nvidia/nemotron-3-ultra-550b-a55b:free"] },
  TOURNAMENT_A_B: { primary: "gemini-3.1-flash-lite", fallback: "openai/gpt-oss-120b" },
  WRITER_C: { primary: "gemini-3.1-flash-lite", fallback: "openai/gpt-oss-120b" },
  SCRIPT_SLOTS: { primary: "gemini-3.1-flash-lite", fallback: "openai/gpt-oss-120b" },
  JARVIS_SCRIPT: { primary: "gemini-3.5-flash", fallback: ["gemini-3.5-flash-lite", "nvidia/nemotron-3-ultra-550b-a55b:free"] }
} as const;
```

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
      │  F3: OPENROUTER  │ ──► Nemotron 550B / Qwen 3 Coder
      └─────────┬────────┘
                │ (On Error / Timeout)
                ▼
      ┌──────────────────┐
      │     F4: GROQ     │ ──► Llama 3.3 70B / GPT-OSS 120B
      └──────────────────┘
```

---

## 6. End-to-End 4-Phase Pipeline Workflow

```
   ┌──────────────────────────┐
   │ PHASE 1: INTAKE & SCOPING │ ──► Step-by-Step Questionnaire with Step Validation
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │  PHASE 2: STORY BIBLE    │ ──► STORY_PRODUCTION_SKILL_SYSTEM.md + Gemini 3.6 Flash
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ PHASE 3: SCENE TOURNAMENT │ ──► Context Anchor + SCRIPTING_SKILL.md ──► Draft A & B ──► Draft C + Emotional Beat
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ PHASE 4: SCRIPT OPTIMIZE │ ──► Slot A & B ──► Slot C Merge ──► J.A.R.V.I.S. Diagnosis + jarvisFinal Script
   └────────────┬─────────────┘
                │
                ▼
   ┌──────────────────────────┐
   │ EDGE-TTS AUDIO STUDIO    │ ──► Multi-Speaker Neural MP3 Voice Generation & Export
   └──────────────────────────┘
```

### Phase 1: Intake & Scoping
1. **Interactive Questionnaire**: Guides user through title, genre, hook, core summary, active characters, speaker mode, and tone.
2. **Step Validation**: J.A.R.V.I.S. validates step inputs, providing critiques, suggestions, logical fixes, and refinement questions.

### Phase 2: Story Bible Engine
1. **Compilation**: `compileQuestionnaireToBible()` uses `STORY_PRODUCTION_SKILL_SYSTEM.md` to generate a 9-section Story Bible with initial scene breakdown, character profiles, vocal profiles, and Microsoft Edge-TTS voice mappings.
2. **Persistence**: Saved to `/workspace files/stories/<story_title>/story_bible.json` and `STORY_BIBLE.md`.

### Phase 3: Multi-Writer Scene Tournament
1. **Context Anchor**: Built from locked Story Bible data before generation.
2. **Parallel Generation**: Writer A ("The Wound Keeper") & Writer B ("The Architect of Pressure") generate contrasting drafts in parallel using `SCRIPTING_SKILL.md`.
3. **Synthesis**: Writer C ("The Excavator") synthesizes Drafts A & B into Master Prose and extracts the scene's `emotionalBeat` for subsequent Context Anchors.

### Phase 4: Script Optimization & J.A.R.V.I.S. Final Director Script
1. **Slot Generation**: Slot A ("The Architect") formats architecture; Slot B ("The Pulse") enhances vocal cadence; Slot C ("The Final Eye") merges them within character limits.
2. **J.A.R.V.I.S. 2-Phase Execution**:
   - **Phase 1 Diagnosis**: Evaluates score, character continuity, pacing, precision, structural integrity, retention, weakest/strongest moments, and fixes.
   - **Phase 2 Final Script**: Outputs `jarvisFinal` — the complete corrected final script which auto-loads into the Phase 4 Script Editor.
3. **Edge-TTS Audio Synthesis**: Converts `jarvisFinal` script into multi-speaker neural audio MP3 files.

---

## 7. Performance & Telemetry Observations (Pipeline E2E Test)

1. **J.A.R.V.I.S. Evaluation Rigor**: The J.A.R.V.I.S. phase 4 diagnostic successfully flags poor character continuity and flat dialogue pacing. It actively punishes scripts that rely on parenthetical stage directions for emotion instead of weaving it into the dialogue structure and cadence. 
2. **Context Anchor Adherence**: While writers follow the anchor, Writer C (Synthesis) struggles occasionally with preserving pure subtext if Draft A and B are overly explicit.
3. **Fallback Engine Activation**: The pipeline successfully transitions via the `generateContentWithFallback` engine across Tiers 1 to 5 if model quotas or endpoint issues arise, preserving story context state across retries.

---

## 8. Summary of Architectural Guarantees

1. **Stateless Skill Injection**: Skills load fresh from disk (`loadSkill`), preventing AI memory loss or tonal drift.
2. **Deterministic Context Anchors**: Built in code from locked Story Bible state prior to every generation call.
3. **Dedicated Agent Identities**: Scope-fenced writers and evaluators ensure high narrative standards.
4. **J.A.R.V.I.S. Director Final Script**: Evaluates and outputs the production-ready script directly (`jarvisFinal`).
5. **Multi-Model Resiliency**: 5-tier fallback matrix guarantees operational reliability.
6. **Categorized Workspace & Story Isolation**: All workspace files are neatly organized in dedicated folders (`/skills/`, `/stories/<story_title>/`, `/exports/`, `/references/`).
7. **Validation at Every Phase**: User vision is confirmed before advancing through Intake, Story Bible, Tournament, and Script Optimization.
8. **Full Manual & Agentic Control**: Users can manually edit scripts in Phase 4 or command AI agents in live chat to perform targeted scene revisions.
