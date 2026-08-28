# Jarvis Multi-Agent Pipeline Architecture Map

## 1. File Structure

*   **`server/Instructions/protocol6.ts`**: Core pipeline definitions, rules, agent prompts (`JARVIS_PARSER`, `AGENT_A`, `AGENT_B`, `AGENT_C`, `JARVIS_FINAL_CHECK`), and the orchestrator `runPipeline` function.
*   **`server/llmUtils.ts`**: LLM interaction utilities, model fallback mappings, token tracking, and retry (`withFeedback`) mechanisms.
*   **`server/agent_config.json`**: Global configuration dictionary linking logical agent roles to specific LLM models (e.g. Gemini versions) and toggle flags.
*   **`server/agentConfigManager.js`**: Loader for the agent configurations.
*   **`server/agents/jarvis.ts`**: (Not shown in snippet, but expected) Main API routes or webhook handlers integrating the pipeline to the rest of the OS.

## 2. Core Functions

*   **`runPipeline` (Line 698)**
    *   **Input**: `userInput: string`, `sendToUI: (msg: any) => void`, `sessionId: string`
    *   **Output**: `Promise<void>`
    *   **Dependencies**: `callWithFallback`, `validateNumberedScript`, `parseJarvis`, `parseDelta`, `validateStage`
    *   **Purpose**: Orchestrates the multi-agent delta pipeline, executing phases sequentially and in parallel, and handling retries.

*   **`parseJarvis` (Line 647)**
    *   **Input**: `output: string` (Raw LLM output from Jarvis Parser)
    *   **Output**: `{ brief: string, script: string, distribution: string }`
    *   **Purpose**: Extracts the sections A, B, and C from the strict output format required by the preprocessing phase.

*   **`parseDelta` (Line 628)**
    *   **Input**: `output: string`
    *   **Output**: `string`
    *   **Purpose**: Strips `<thinking>` blocks and extracts the content between `=== DELTA START ===` and `=== DELTA END ===`.

*   **`withFeedback` (Line 634)**
    *   **Input**: `basePrompt: string`, `feedback: string`, `agentLabel: string`
    *   **Output**: `string`
    *   **Purpose**: Injects priority override feedback into an agent's prompt to guide them on a retry.

*   **`validateNumberedScript` (Line 658)**
    *   **Input**: `brief: string`, `script: string`
    *   **Output**: `{ pass: boolean, failures: string[] }`
    *   **Purpose**: Checks the parsed manuscript for structural invariants (line numbers, headers, lack of quotation marks).

*   **`parseJarvisFinalCheck` (Line 878)**
    *   **Input**: `output: string`
    *   **Output**: `{ pass: boolean, report: string, failures: string[] }`
    *   **Purpose**: Extracts the 0-10 score and failure list from the Guardian's final audit report.

## 3. Agent Protocols

*   **JARVIS_PARSER (The Preprocessor)**
    *   **Role**: Normalizes the raw text into line-numbered format, injects phonetic spelling rules, maps speakers, and generates a structural brief for the downstream agents.
    *   **Methods**: Evaluated by `validateNumberedScript`; output parsed by `parseJarvis`.

*   **AGENT_A (The Creative Engine / Composer)**
    *   **Role**: Generates non-destructive creative deltas, proposing scene introductions, emotional bridges, and descriptive elements mapped to specific line numbers.
    *   **Methods**: Produces delta blocks parsed by `parseDelta`.

*   **AGENT_B (The Tag Engine / Director)**
    *   **Role**: Analyzes the normalized script to inject vocal performance tags (e.g. `[breath]`, `[sigh]`), controlling pacing and tone according to strict density limits.
    *   **Methods**: Produces delta blocks parsed by `parseDelta`.

*   **AGENT_C (The Assembler / Editor)**
    *   **Role**: Merges the normalized script with the deltas from Agent A and Agent B, resolving conflicts and compiling the final master script, then self-scores its work.
    *   **Methods**: Parsed via regex for `=== FINAL MASTER SCRIPT ===`. Evaluated by `JARVIS_FINAL_CHECK`.

*   **JARVIS_FINAL_CHECK (The Validator / Guardian)**
    *   **Role**: Performs a strict diff against the original script to verify zero-deletion "verbalism" rules, structural integrity, and phonetic application. Assigns a score (out of 10).
    *   **Methods**: Output parsed by `parseJarvisFinalCheck`; if score < 8, loops back to Agent C with feedback.

## 4. Settings & Configuration

*   **Fallback Chains (`MODEL_MAP`)**: Maps logical agent IDs (e.g. `jarvis`, `agentC`) to a priority list of models (e.g., `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemma-*`).
*   **Dictionaries**: Rules inject strict phonetic replacements (e.g., `{lap uh ros kuh peez} laparoscopies` before every occurrence).
*   **Locks (`sessionLocks`)**: A `Set` tracking active `sessionId` instances to prevent concurrent, overlapping pipeline runs on the same document.

## 5. Data Flow

1.  **Intake**: Raw text -> **Phase 0** (JARVIS_PARSER).
2.  **Normalization**: Outputs Sections A, B (Normalized Script), and C (Distribution Brief).
3.  **Parallel Engines**: Normalized Script + Brief are sent concurrently to **Phase 1** (AGENT_A and AGENT_B).
4.  **Deltas**: Agents output precise insertion commands (deltas).
5.  **Assembly**: Normalized Script + Deltas -> **Phase 2** (AGENT_C).
6.  **Master Script**: Agent C outputs the compiled Master Script.
7.  **Audit**: Original Script + Master Script + Phase Report -> **Phase 3** (JARVIS_FINAL_CHECK).
8.  **Output**: Approved script shipped to TTS, or routed back to Agent C if validation fails.

## 6. Error Handling & Retry Logic

*   **Preprocessing Retry**: If `validateNumberedScript` fails, `runPipeline` immediately loops back to `JARVIS_PARSER`, invoking `withFeedback` to pass the `failures` directly back to the model.
*   **Guardian Intervention**: If `JARVIS_FINAL_CHECK` fails (score < 8), it compiles the `failures` list and triggers `agentCRetry` using `withFeedback(AGENT_C)`.
*   **Global Catch**: `try/catch` block wrapping `runPipeline` catches any catastrophic LLM network errors, unlocking the session and notifying the UI.

## 7. External API Calls

*   **Gemini Endpoints**: Executed via `@google/genai` in `callWithFallback`.
*   **Key Rotation**: The pipeline maps specific keys to specific agents (`GEMINI_API_KEY_3` for Agent A, etc.) to distribute rate limits.
*   **Token Tracking**: Every call increments `totalTokens` and character counts in the session-scoped `TokenTracker`, ultimately saved via `writeTokenReport`.
