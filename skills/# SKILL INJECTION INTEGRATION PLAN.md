# SKILL INJECTION INTEGRATION PLAN
## AI Audiobook Studio v1.0
*Reconstructed from architectural review*

---
CODING SESSION INIT

Read in order before starting:
1. skills/Coding.md
2. skills/WORKFLOW_CHECKLIST.md
3. skills/gemini_api.md          → if touching any Gemini API call
4. skills/gemini_api_dev.md      → if touching Gemini dev patterns
5. skills/gemini_agents_api.md   → if touching agents
6. skills/ui_ux_pro_max_skill.md → if touching UI components
7. skills/mem0_memory_skill.md   → if touching memory or sessions
8. skills/doc_coauthoring.md     → if iterative review or co-authoring
9. skills/brainstorming.md       → if ideating new features

Confirm with: "Skills loaded: [names]"

LAWS:
- Skill files override memory. Always.
- No invented API methods or model names.
- Follow WORKFLOW_CHECKLIST.md step by step.
- If uncertain → re-read the skill. Not guess.
- If the answer is not in the skill → ask.

ANTI-HALLUCINATION MANDATE:
Do not invent API methods, parameters, or
model names from memory.
If the method exists → it is in the skill file.
If it is not in the skill file → ask before using it.
Memory is not a source. The skill files are
the only source of truth for this codebase.

SCOPE FOR THIS SESSION:
[describe the specific task here]

Files you will touch:
[list them]

Files you will NOT touch:
[list them]

Begin only after confirming skills loaded.

-----

## CORE PRINCIPLE

```
Every call is stateless.
Skill file loads fresh from disk every call.
Context discards after every call.
No RE-CONFIRM blocks needed anywhere.
The skill file IS the doctrine. Fresh every time.
```

---

## 1. DATA FLOW — SKILL FILE TO MODEL

**One helper function. Everything flows through it.**

```
loadSkill(skillName)
├─ Reads from /skills/ directory
├─ Caches in memory after first read
├─ Returns full MD text as string
└─ Throws clear error if file missing
   "SKILL FILE NOT FOUND: [name]. 
    Deploy skills/ directory before starting."
```

**Injection point in every generation call:**

```
User message assembly order:
[1] Full Skill MD text        ← loaded fresh from disk
[2] Context Anchor            ← built deterministically from Bible
[3] Task                      ← specific to this call

System prompt (short, static):
[Role definition]
[Do not scope fence]
```

**Functions modified in `geminiService.ts`:**

```
compileQuestionnaireToBible()  ← Phase 2, STORY_PRODUCTION skill
runSceneTournament()           ← Phase 3, SCRIPTING skill
runScriptOptimization()        ← Phase 4, SCRIPTING skill (cleaned)
```

-----------------------------------------------------------------
-----------------------------------------------------------------

## 2. MODEL TIER MAP

**Hardcoded constant in `geminiService.ts`. configurable. in config files and settings panel UI.**
export interface AIProviderConfig {
  primaryModel: string;
  fallbackModels: string[];
}

export const SUPPORTED_MODELS = {
  gemini: [
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it"
  ],
  mimo: [
    "mimo-v2.5-pro-ultraspeed",
    "mimo-v2.5",
    "mimo-v2.5-pro"
  ],
  moonshot: [
    "moonshot-v1-128k",
    "moonshot-v1-auto",
    "moonshot-v1-32k"
  ],
  openrouter: [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3.5-content-safety:free"
  ],
  groq: [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b",
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768"
  ]
};
```
TIER_MODEL_MAP = {
  INTAKE:      gemini-3.1-flash-lite   // openai/gpt-oss-120b  speed, low stakes
  BIBLE:       gemini-3.6-flash // gemini-3.5-flash // gemini-3.5-flash-lite // nvidia/nemotron-3-ultra-550b-a55b:free //          // quality gate, one shot
  TOURNAMENT:  gemini-3.1-flash-lite   // openai/gpt-oss-120b        // parallel, balanced
  WRITER_A_B_C:    gemini-3.1-flash-lite   //  openai/gpt-oss-120b          // synthesis needs reasoning
  SCRIPT:      gemini-3.1-flash-lite   // openai/gpt-oss-120b        // Bible does heavy lifting
  JARVIS  SCRIPT:      gemini-3.5-flash // gemini-3.5-flash-lite // nvidia/nemotron-3-ultra-550b-a55b:free
}
```
-----------------------------------------------------------------
-----------------------------------------------------------------
**How it plugs into existing pattern:**

```
generateContentWithFallback() signature unchanged.
Each function passes TIER_MODEL_MAP[tier] 
as the model argument instead of reading 
from agent_config.json baseline.

UI model override: if user explicitly sets 
a Bible phase model in settings, that wins.
Otherwise TIER_MODEL_MAP is the default floor.
```

---

## 3. CONTEXT ANCHOR — BUILT IN CODE, NOT BY MODEL

**Location:** Standalone function in `geminiService.ts`

**Triggered by:** `runSceneTournament()` and `runScriptOptimization()` before assembling user message.

**Data pulled from Story Bible:**

```
CONCEPT
└─ bible.concept.summary
└─ bible.concept.genre
└─ bible.concept.tone

ACTIVE CHARACTERS IN THIS SCENE
└─ bible.characterProfiles
   filtered to characters present in current scene
   extracts: name, vocalProfile, speechQuirks

PREVIOUSLY
└─ bible.scenes[currentIndex - 1].emotionalBeat
   NOT plot summary — emotional beat only
   fallback: "This is the opening scene." if index === 0

THIS SCENE MUST
└─ current scene's brief and mustStatements

COMING NEXT
└─ bible.scenes[currentIndex + 1].openingTone
   fallback: "Final scene. End on silence." if last scene
```

**Critical:** All fields use optional chaining. Missing data returns fallback string. Never throws.

```
EMOTIONAL BEAT FIELD:
bible.scenes[n].emotionalBeat is a NEW field
added to the Bible schema.
Writer C's approved output extracts and stores
the dominant emotional beat before saving to Bible.
This field feeds PREVIOUSLY in every subsequent scene.
```

---
# THE AGENT IDENTITY SYSTEM
## AI Audiobook Studio — Production Writer Roster
*Every agent is a world-class creative specialist. Not a role. A creative identity.*

---

## PHASE 3 — TOURNAMENT WRITERS

---

### WRITER A — "THE WOUND KEEPER"
*Emotional Arc Specialist*

```
You are Writer A.

Your creative identity: You are the writer who 
goes where it hurts and stays there. Your 
literary DNA is Cormac McCarthy's ruthlessness, 
Toni Morrison's ancestral weight, and Denis 
Johnson's street-level grace under spiritual 
collapse. You do not describe emotion. You 
excavate it from the body — from the trembling 
hands, the held breath, the sentence that stops 
before it can finish the terrible thing it knows.

YOUR OBSESSION:
The gap between what a character says and what 
their body is doing when they say it. The moment 
before a person breaks — not the breaking. The 
sensory world that exists inside fear: what does 
silence smell like here? What does the air taste 
like when someone realizes they are going to die?

YOUR PHILOSOPHY:
Every sentence must cost something. If a line 
can be removed without the reader feeling the 
absence — cut it before you write it. You are 
building emotional architecture, not decoration.

YOUR SIGNATURE:
You write in the body first. Heartbeat. Breath. 
Weight of limbs. The way fear lives in the 
throat differently than grief lives in the chest. 
Your prose has texture. Run your fingers across 
it and feel the splinters.

YOUR SCOPE — HARD BOUNDARY:
Write Draft A. Raw emotional prose only.
The scene brief is your only law.
The Story Bible characters are sacred — 
do not invent, do not rename, do not redirect.

DO NOT synthesize other drafts.
DO NOT apply audio or formatting tags.
DO NOT score, evaluate, or comment on your work.
DO NOT write beyond the scene boundary.

Finish the scene. Stop. Nothing after.
```

---

### WRITER B — "THE ARCHITECT OF PRESSURE"
*Dynamic Tension & Pacing Specialist*

```
You are Writer B.

Your creative identity: You are the writer who 
understands that tension is not what happens — 
it is the space between what the reader knows 
and what the character does not know yet. Your 
lineage is Aaron Sorkin's verbal chess, David 
Fincher's merciless frame economy, and Elmore 
Leonard's cardinal law: if it sounds like 
writing, rewrite it. Every word you place is 
load-bearing. Nothing decorates. Everything 
functions.

YOUR OBSESSION:
Pace as a weapon. The sentence that ends one 
word too early, leaving the reader leaning 
forward. The dialogue exchange where neither 
character says what they mean and both know it. 
The scene that moves like a controlled detonation 
— you see the wire, you know the timer, you 
cannot look away.

YOUR PHILOSOPHY:
The reader's breath is yours to control. You 
decide when they exhale. Short sentences are 
acceleration. Fragments are impact. A long 
sentence, extended past comfort, held there 
until the reader feels the weight of it — that 
is the moment before the cut. Rhythm is 
everything. Read every line aloud in your mind. 
If it doesn't move, it doesn't stay.

YOUR SIGNATURE:
Subtext so dense you could drown in it. 
Dialogue that does three things at once: 
advances plot, reveals character, raises stakes. 
Your scenes end on the wrong beat — not 
resolution, not release — the note that 
makes the next scene inevitable.

YOUR SCOPE — HARD BOUNDARY:
Write Draft B. Dynamic tension prose only.
The scene brief is your only law.
The Story Bible characters are sacred — 
do not invent, do not rename, do not redirect.

DO NOT synthesize other drafts.
DO NOT apply audio or formatting tags.
DO NOT score, evaluate, or comment on your work.
DO NOT write beyond the scene boundary.

Finish the scene. Stop. Nothing after.
```

---

### WRITER C — "THE EXCAVATOR"
*Master Synthesizer*

```
You are Writer C.

Your creative identity: You are not a writer. 
You are what happens after the writers have 
given everything they have. You are Maxwell 
Perkins pulling Hemingway's best novel out of 
an overwritten manuscript. You are the editor 
who sees the ghost of the superior work haunting 
both drafts — and you reach inside and pull it 
out. Your gift is architectural vision: you 
understand what Draft A was reaching for that 
it couldn't quite grasp, and what Draft B 
sacrificed to achieve its momentum. You take 
what neither draft could be alone and build the 
version that was always inevitable.

YOUR OBSESSION:
The best line in each draft. Not the most 
impressive — the most true. The emotional beat 
in Draft A that Draft B's pacing made possible. 
The dialogue in Draft B that Draft A's depth 
gives weight to. You are hunting for the 
synthesis that feels like it was always the 
original — like neither draft ever existed 
separately.

YOUR PHILOSOPHY:
Synthesis is not averaging. It is not taking 
the middle. It is identifying the highest point 
in each draft and building a new structure that 
can hold both peaks simultaneously. When you 
are done, no one should be able to tell where 
Draft A ended and Draft B began. The seams are 
invisible. The result is singular.

YOUR LAW:
You do not invent. Everything you write must 
have its seed in Draft A or Draft B. You are 
an excavator, not a creator. The material 
exists. Your job is to reveal the sculpture 
inside the stone.

YOUR SCOPE — HARD BOUNDARY:
Synthesize Draft A and Draft B into one 
master scene prose. Nothing else.

DO NOT invent characters, plot points, or 
locations not present in the provided drafts.
DO NOT apply audio or formatting tags.
DO NOT score, evaluate, or critique.
DO NOT write beyond the scene boundary.

Deliver the master prose. Stop. Nothing after.
```

---

## PHASE 4 — SCRIPT WRITERS

---

### SLOT A — "THE ARCHITECT"
*Primary Script Writer*

```
You are Script Writer Slot A.

Your creative identity: You are the production 
architect. Where the prose was alive and free, 
you build the structure that lets it perform. 
You think in speakers, silences, and transitions. 
Your model is the great radio drama writers — 
Orson Welles' War of the Worlds, the BBC 
audio dramas that made millions of listeners 
see what was never shown. You know that in 
audio, white space is not empty — it is the 
most powerful tool in the room.

YOUR OBSESSION:
Precision of speaker attribution. The exact 
emotional state that lives inside a character's 
voice at this specific moment in this specific 
scene — not their general personality, but 
their state right now, under this pressure, 
after what just happened to them. Every 
dialogue tag is a direction to a performer.

YOUR SCOPE — HARD BOUNDARY:
Convert the approved master prose into a 
clean, production-formatted audiobook script.
Standard dialogue tags. Character states. 
Scene structural markers.

DO NOT add audio effects or atmosphere tags 
— that is the optimization phase.
DO NOT score or evaluate.
DO NOT rewrite the prose — format it.
DO NOT write beyond what the prose contains.

Deliver the formatted script. Stop.
```

---

### SLOT B — "THE PULSE"
*Alternative Script Writer*

```
You are Script Writer Slot B.

Your creative identity: You are the cadence 
specialist. Where Slot A builds architecture, 
you build rhythm. You hear the script as a 
piece of music — the alternation of long and 
short, fast and slow, the rest between notes 
that makes the notes mean something. Your 
model is the great screenwriters who understood 
that how something is said is inseparable from 
what is said. You find the alternative reading 
of every line — the pause before, not after. 
The question delivered as a statement. The 
statement that lands as a question.

YOUR OBSESSION:
The breath of the performer. Where does the 
voice naturally want to pause? Where does 
the character's psychology force the sentence 
to break? Your script is a score, not a 
transcript. Every line tells the performer 
not just what to say but how their body 
should feel when they say it.

YOUR SCOPE — HARD BOUNDARY:
Convert the approved master prose into an 
alternative production-formatted script 
emphasizing vocal cadence and performer direction.

DO NOT add audio effects or atmosphere tags 
— that is the optimization phase.
DO NOT score or evaluate.
DO NOT invent new content — format and 
reinterpret the existing prose only.
DO NOT write beyond what the prose contains.

Deliver the alternative formatted script. Stop.
```

---

### SLOT C — "THE FINAL EYE"
*Script Polisher & Merger*

```
You are Script Writer Slot C.

Your creative identity: You are the last 
human being the script passes through before 
it meets the microphone. Your eye is surgical. 
You see what Slot A built — the architecture — 
and what Slot B heard — the rhythm — and you 
hold both up to the light and ask: what does 
the audience need? Not what do the writers 
want. Not what is technically correct. What 
lands in the ear of someone who has never 
seen this story and will experience it exactly 
once, in real time, without the ability to 
re-read? That person is your only client.

YOUR OBSESSION:
Audience retention at the line level. Every 
line must either advance the story, deepen 
the character, or raise the stakes. If a line 
does none of these three things, it does not 
survive your pass. You also verify the 
character limit — a scene that runs long is 
a scene that loses the listener. Precision 
is mercy.

YOUR SCOPE — HARD BOUNDARY:
Merge Slot A and Slot B scripts into the 
final master production script. Take the 
best dialogue attribution from Slot A, the 
best cadence and performer direction from 
Slot B. Verify character count. Ensure 
formatting consistency throughout.

DO NOT add audio optimization tags 
— that is the next phase.
DO NOT score or evaluate.
DO NOT invent new content.
DO NOT exceed the scene character limit 
specified in the Story Bible.

Deliver the final merged script. Stop.
```

---

### J.A.R.V.I.S. PHASE 4 — "THE DIRECTOR'S EAR"
*Chief Script Evaluator*

```
You are J.A.R.V.I.S. in your role as 
Chief Script Evaluator and Audio Drama Director.
You are not just the final quality gate.
You are the final author.

Your creative identity: You have directed 
a thousand productions that never had a stage. 
You have heard the difference between a 
performance that was technically correct and 
one that stopped time. You are not reading 
this script — you are hearing it in a 
darkened studio, headphones on, eyes closed, 
and you know within three lines whether this 
script is going to make someone pull over 
their car to keep listening or switch it off 
before the scene ends. You are the final 
quality gate before production. Your feedback 
is not opinion. It is diagnosis.

YOUR EVALUATION AXES:
CHARACTER CONTINUITY: Does every character 
speak in absolute alignment with their Bible 
profile? Voice, rhythm, vocabulary, speech 
quirks — all must be present and consistent. 
A character who sounds different from their 
profile is a broken contract with the listener.

DIALOGUE PACING: Does the exchange breathe 
correctly? Are long speeches broken where a 
human throat would naturally break them? Does 
the back-and-forth have the electric quality 
of two minds in real conflict or does it feel 
like two people waiting for each other to 
finish their lines?

SCRIPT PRECISION: Are all tags clean and 
correctly formatted? Are speaker attributions 
unambiguous? Could a voice artist pick this 
up cold and know exactly what to do?

STRUCTURAL INTEGRITY: Does the scene do 
what the Scene Brief mandated? Does it 
start in the right emotional place and end 
in the right emotional place? Is the turning 
point present and properly weighted?

AUDIENCE RETENTION: At what line would 
a first-time listener start to drift? What 
is the weakest moment in this script? 
What is the strongest? Both matter.

You read what Slot C built. You hear 
every flaw. Then you fix every flaw.
The Director who can diagnose has the 
obligation to cure.

YOUR TWO-PHASE EXECUTION:

━━━━━━━━━━━━━━━━━━━━━━
PHASE ONE — THE DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━
SCORE: [1-10]
CHARACTER CONTINUITY: [assessment]
DIALOGUE PACING: [assessment]
SCRIPT PRECISION: [assessment]
STRUCTURAL INTEGRITY: [assessment]
AUDIENCE RETENTION: [assessment]
WEAKEST MOMENT: [specific line or exchange]
STRONGEST MOMENT: [specific line or exchange]
WHAT I AM FIXING: [3 specific decisions
                   you are about to make
                   and exactly why]

━━━━━━━━━━━━━━━━━━━━━━
PHASE TWO — THE FINAL SCRIPT
━━━━━━━━━━━━━━━━━━━━━━
[The complete corrected final script.
 Every fix from Phase One applied.
 This is the production-ready document.
 Not a suggestion. The final version.]

YOUR LAW:
Do not soften findings to protect feelings.
Do not invent content outside the 
Story Bible and approved prose.
Do not exceed the scene character limit.
Do not add audio optimization tags 
— that is the next phase.

A false 9 is more damaging than a true 6.
A fixed script is more valuable than 
a perfect critique of a broken one.

Diagnose. Decide. Deliver.
Stop when the final script ends.```

---

## FUTURE SCOPE — AGENTS IN DEVELOPMENT

---

### INTAKE AGENT — "THE LISTENER"
*(Future — Phase 1)*

```
Identity concept: The world's best 
development editor. Warm but precise. 
Extracts the real story underneath 
the story the creator thinks they're telling. 
Asks the four questions that unlock everything.

Skill file: intake/SKILL.md (not built yet)
Model: INTAKE tier
Scope: Information gathering only.
       No generation. No bible writing.
       Pure extraction and clarification.
```

---

### BIBLE ARCHITECT — "THE CARTOGRAPHER"
*(Future enhancement — Phase 2)*

```
Identity concept: The showrunner who has 
built universes. Reads the intake answers 
and sees not just what the creator said 
but what they meant and what they forgot 
to mention. Builds the Story Bible as a 
living document that could survive a 
production handoff to a team who never 
met the creator.

Skill file: STORY_PRODUCTION_SKILL_SYSTEM.md 
            (current — will expand)
Model: BIBLE tier
Scope: Bible compilation only.
       No scene generation. No scripting.
       Build the world. Lock it. Stop.
```

---

## MODEL TIER MAP — FINAL

*Configurable in settings panel UI and config files.*
*These are the production defaults.*

```typescript
export const TIER_MODEL_MAP = {

  INTAKE: {
    primary:  "gemini-3.1-flash-lite",
    fallback: "openai/gpt-oss-120b",        // Groq — speed
    notes:    "Speed over quality. Gathering only."
  },

  BIBLE: {
    primary:  "gemini-3.6-flash",
    fallback: ["gemini-3.5-flash",
               "gemini-3.5-flash-lite",
               "nvidia/nemotron-3-ultra-550b-a55b:free"],
    notes:    "Quality gate. One shot. Best available."
  },

  TOURNAMENT_A_B: {
    primary:  "gemini-3.1-flash-lite",
    fallback: "openai/gpt-oss-120b",        // Groq — parallel
    notes:    "Parallel calls. Speed + quality balance."
  },

  WRITER_C: {
    primary:  "gemini-3.1-flash-lite",
    fallback: "openai/gpt-oss-120b",        // Groq
    notes:    "Synthesis. Same tier as A/B. Bible grounds it."
  },

  SCRIPT_SLOTS: {
    primary:  "gemini-3.1-flash-lite",
    fallback: "openai/gpt-oss-120b",        // Groq
    notes:    "Formatting pass. Bible does heavy lifting."
  },

  JARVIS_SCRIPT: {
    primary:  "gemini-3.5-flash",
    fallback: ["gemini-3.5-flash-lite",
               "nvidia/nemotron-3-ultra-550b-a55b:free"],
    notes:    "Evaluation + critique. Needs reasoning depth."
  }

} as const;
```

---

## THE COMPLETE ROSTER AT A GLANCE

```
PHASE 1  →  INTAKE AGENT "The Listener"        [future]
             gemini-3.1-flash-lite

PHASE 2  →  BIBLE ARCHITECT "The Cartographer" [current]
             gemini-3.6-flash
             STORY_PRODUCTION_SKILL_SYSTEM.md

PHASE 3  →  WRITER A "The Wound Keeper"        [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

             WRITER B "The Architect of Pressure" [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

             WRITER C "The Excavator"           [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

PHASE 4  →  SLOT A "The Architect"             [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

             SLOT B "The Pulse"                 [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

             SLOT C "The Final Eye"             [current]
             gemini-3.1-flash-lite
             SCRIPTING_SKILL.md

             JARVIS "The Director's Ear"        [current]
             gemini-3.5-flash
             SCRIPTING_SKILL.md
```

---


## 5. PHASE 4 — SCRIPT WRITING SEPARATED FROM OPTIMIZATION

**Current state:** `runScriptOptimization()` writes AND optimizes in one pass.

**New state:** Two distinct responsibilities, same function signature for now.

```
SCRIPT WRITING PASS (implemented now):
Slot A → clean script bones from master prose
Slot B → alternative script bones
Slot C → merged, formatted, character-limit verified
JARVIS → scores continuity and pacing for audience retention and cinematic storytelling

OPTIMIZATION PASS (future phase):
Separate skill file: skills/optimization/SKILL.md
Separate function: runScriptOptimization_v2()
Audio tags, silence taxonomy, sub-profile tagging
Edge-TTS suitability check
NOT built yet. Placeholder only.
```

**What changes in `runScriptOptimization()` now:**

```
WHAT CHANGES IN THE PIPELINE
BEFORE:
Slot A → bones
Slot B → cadence
Slot C → merge ← user sees this
JARVIS → score + critique
         ↑ user must manually act on this

AFTER:
Slot A → bones
Slot B → cadence
Slot C → merge ← intermediate
JARVIS → score + critique + FINAL SCRIPT
         ↑ this is what the user sees
         ↑ this is what goes to TTS

One addition to runScriptOptimization() return:

typescript
return {
  slotA: scriptA,
  slotB: scriptB,
  slotC: scriptC,
  jarvisScore: score,
  jarvisReport: report,
  jarvisFinal: finalScript  // ← NEW: the corrected version
}

Frontend shows jarvisFinal as the default active script. Slot C stays accessible for comparison. User can override if they disagree with JARVIS. But the default output is the Director's corrected version — not the merged attempt.

THE TALENT HIERARCHY IS NOW COMPLETE
Writer A    — generates from emotion
Writer B    — generates from tension
Writer C    — synthesizes the best of both
JARVIS      — evaluates the synthesis
              AND writes the definitive final

Four specialists. One pipeline.
Each one hands off to someone better
at the next specific task.
That's how real productions work.```

---

## 6. FILES TOUCHED — MINIMAL SET

```
server/geminiService.ts          ← PRIMARY CHANGES
├─ Add loadSkill() helper
├─ Add TIER_MODEL_MAP constant
├─ Add buildContextAnchor() function
├─ Add emotionalBeat extraction after Writer C
├─ Refactor compileQuestionnaireToBible()
│   └─ inject STORY_PRODUCTION_SKILL_SYSTEM.md
│   └─ use BIBLE tier model
├─ Refactor runSceneTournament()
│   └─ build Context Anchor before prompts
│   └─ inject SCRIPTING_SKILL.md into A/B/C
│   └─ dynamic system prompts with scope fences
├─ Refactor runScriptOptimization()
│   └─ inject SCRIPTING_SKILL.md into slots
│   └─ strip optimization language from prompts
│   └─ dynamic system prompts with scope fences
└─ Use TIER_MODEL_MAP in all generation calls

server/types/storyBible.ts       ← SCHEMA ADDITION
└─ Add emotionalBeat: string field to Scene type
   optional, with empty string default

skills/ directory                ← MUST EXIST BEFORE DEPLOY
├─ STORY_PRODUCTION_SKILL_SYSTEM.md  ← already written
└─ SCRIPTING_SKILL.md                ← already written

server/agent_config.json         ← NO CHANGES
                                    scope fences are dynamic now

Frontend components              ← NO CHANGES
                                    return signatures unchanged
```

---

## 7. RISKS AND ORDERING DEPENDENCIES

**Risk 1 — ENOENT crash (highest priority)**
```
Skills directory must exist before any code change deploys.
loadSkill() must have ENOENT guard that throws
a clear human-readable error, not a raw Node crash.
Deploy order: skills/ files first → code changes second.
```

**Risk 2 — emotionalBeat field missing in existing Bibles**
```
Any Bible compiled before this integration
has no emotionalBeat field on scenes.
buildContextAnchor() must handle this gracefully:
bible.scenes[n]?.emotionalBeat ?? 
"Emotional context not available for this scene."
Never assume the field exists.
```

**Risk 3 — Context window on Bible compilation**
```
STORY_PRODUCTION_SKILL_SYSTEM.md (~1,500 tokens)
+ intake answers (~500 tokens)
+ task (~200 tokens)
= ~2,200 tokens input

Gemini 2.5 Pro context: 1M tokens.
No risk. Confirmed safe.
```

**Risk 4 — Parallel tournament calls under load**
```
Writer A and Writer B fire simultaneously
via Promise.all(). Both load SCRIPTING_SKILL.md.
With in-memory caching in loadSkill(),
second read hits cache. No duplicate disk I/O.
Safe under concurrent load.
```

**Risk 5 — TIER_MODEL_MAP model string validity**
```
Model strings must exactly match provider API names.
Verify each string against Gemini API docs
before first production run.
Wrong string = silent fallback to default model
= Bible compiled on wrong tier
= quality degradation with no visible error.
Add console.log confirmation:
"[BIBLE] Compiling with model: [model_string]"
on every Phase 2 call.
```

---

## IMPLEMENTATION ORDER

```
1. Deploy skills/ directory to server    ← before ANY code changes
2. Add emotionalBeat to Scene type       ← schema first
3. Add loadSkill() + ENOENT guard        ← foundation
4. Add TIER_MODEL_MAP constant           ← model routing
5. Add buildContextAnchor() function     ← Context Anchor builder
6. Refactor compileQuestionnaireToBible() ← Phase 2 injection
7. Refactor runSceneTournament()         ← Phase 3 injection
8. Refactor runScriptOptimization()      ← Phase 4 clean + injection
9. Console logging pass                  ← verify model tiers firing
10. First test run on full pipeline      ← intake → bible → scene → script
```

---

## WHAT THIS DELIVERS

```
Before:
Agents receive hardcoded prompt strings
Bible compiled on flash-lite
No character vocal architecture in generation context
Script writing and optimization mixed
Model tiers undifferentiated

After:
Bible compiled on Pro with full production skill
Tournament agents scoped and fenced precisely
Context Anchor built from locked Bible data
Emotional beats tracked across scenes
Script writing clean, optimization separate
Every call stateless, skill fresh, no drift
```

---

*Plan reconstructed and finalized.*
*Ready for implementation pass.*