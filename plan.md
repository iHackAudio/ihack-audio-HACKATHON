# Architectural Integration Plan: Skill Injection System

## 1. Data Flow & Function Modifications (`geminiService.ts`)
**Functions Modified:** 
- `compileQuestionnaireToBible()` (Phase 2)
- `runSceneTournament()` (Phase 3)
- `runScriptOptimization()` (Phase 4)

**Exact Data Flow:**
1. A new lightweight utility `loadSkill(skillName: string): string` will be added to read `.md` files directly from the `/skills` directory using `fs.readFileSync` (with basic in-memory caching to reduce disk I/O).
2. Inside the target functions, the relevant skill file text is fetched.
3. The prompt assembly is restructured to strictly follow:
   `[Full Skill MD] + [Story Context / Context Anchor] + [Task]`
4. This combined string is passed as the `prompt` argument (the user message) to `generateContentWithFallback()`. The system prompt remains managed by `agentConfigManager.ts`.

## 2. Context Anchor Assembly
**Where & When:**
The Context Anchor is assembled directly inside `runSceneTournament` and `runScriptOptimization` in `geminiService.ts`, triggered right before constructing the final prompt string.

**Data Pulled from Story Bible:**
It deterministically pulls:
- **CONCEPT:** `bible.concept.summary`, `genre`, and `tone`.
- **ACTIVE CHARACTERS:** Filters `bible.characterProfiles` matching the current scene's characters, extracting their `vocalProfile` and `speechQuirks`.
- **PREVIOUSLY / COMING NEXT:** Iterates over `bible.scenes`. By identifying the current scene's index, it extracts the `summary` of `index - 1` (PREVIOUSLY) and `index + 1` (COMING NEXT).
- **THIS SCENE MUST:** Uses the current scene's `brief` or `summary`.

## 3. Model Upgrades for Bible Compilation
**The Mechanism:**
The `generateContentWithFallback()` function signature remains unchanged. It already accepts a `model` parameter. 
Currently, `compileQuestionnaireToBible` uses `configs.jarvis?.model || "gemini-3.1-flash-lite"`.
To implement the hardcoded function-level tiering while respecting the settings panel overrides:
1. We establish a `TIER_MODEL_MAP` constant (e.g., `INTAKE: flash-lite`, `BIBLE: pro`).
2. `compileQuestionnaireToBible` will look for a specific UI override for the Bible phase, and if none exists, it defaults to the highest tier model (e.g., `gemini-3.1-pro-preview`) rather than the baseline Jarvis config.

## 4. "Do Not" Scope Fences in System Prompts
The `agent_config.json` file will be modified to replace the current system instructions with strict, boundary-defining fences:
- **Writer A:** "You are Writer A (Emotional Arc). You generate Draft A. DO NOT synthesize drafts. DO NOT write production audio scripts or apply audio tags. You stop at raw prose."
- **Writer B:** "You are Writer B (Tension/Pacing). You generate Draft B. DO NOT synthesize drafts. DO NOT write production audio scripts."
- **Writer C:** "You are Writer C (Master Synthesizer). You synthesize Draft A and B into final prose. DO NOT write the final audiobook script. DO NOT invent new plot points outside the provided drafts."

## 5. Separating Script Writing and Optimization
Since Phase 4 currently writes *and* optimizes in one pass, and optimization is being pushed to a "separate phase built later", we modify `runScriptOptimization()` as follows:
- We strip all references to "optimization", "audio tags", "silence taxonomy", and "Edge-TTS suitability" from the `promptSlotA`, `promptSlotB`, and `promptSlotC` task definitions.
- The task becomes purely: "Format this prose into a clean audiobook script with standard dialogue tags." 
- We retain the existing UI flow by returning `slotA`, `slotB`, and `slotC` as clean scripts. 
- Jarvis's evaluation prompt is downgraded to only score character continuity and dialogue pacing, removing the "Audio Readiness" criteria until the future Optimization skill is built.

## 6. Minimal Set of Changes Needed
- **`server/geminiService.ts`**: Add the `loadSkill()` helper. Refactor the string interpolation in the three target functions to inject the skill string and the Context Anchor. Remove optimization criteria from Phase 4 prompts.
- **`server/agent_config.json`**: Rewrite `systemInstruction` for `writerA`, `writerB`, and `writerC` to implement the "do not" scope fences.
- **`/skills/` Directory**: Ensure `STORY_PRODUCTION_SKILL_SYSTEM.md` and `SCRIPTING_SKILL.md` are physically present on disk so the file reads don't throw `ENOENT`.

## 7. Risks & Ordering Dependencies
- **Missing Files Exception (ENOENT):** The `/skills/` directory and the specific `.md` files MUST be deployed before or alongside these code changes. If the code tries to read them and they don't exist, the backend will crash on generation.
- **Token Limits:** Injecting a full multi-stage skill file on every call heavily increases the input token count. We must ensure the provider has a sufficient context window and that we aren't hitting rate limits due to payload size.
- **Anchor Context Gaps:** If Phase 2 (Bible Generation) fails to generate a fully populated `scenes` array, the deterministic Context Anchor builder in Phase 3/4 will throw errors when trying to find `index + 1`. We need optional chaining and fallback empty strings (`"Not available"`) when building the Context Anchor.
