# Jarvis OS — Interactive Multi-Agent Delta Pipelines & Approval Controls

This document details the architectural enhancements, solved issues, and interactive state-machine controls built for the system's two core performance scripting pipelines:
1. **`protocol6.ts`** (Delta Pipeline Core)
2. **`Adenomyosis_2.ts`** (Adenomyosis-specific Multi-Agent Pipeline)

---

## 🛠️ Summary of Objectives & Solved Issues

Both multi-agent pipelines previously suffered from severe runtime and structural limitations. We refactored them to become **fully interactive, resilient to token truncation, and directly controllable from the Chat Panel UI**.

### 1. Solved Issues
* ❌ **Loss of State on Asynchronous Turns**: Since LLM generation is stateless and runs asynchronously over multiple system-to-UI socket exchanges, running a 4-phase pipeline in a single monolithic function call was impossible without discarding intermediate outputs or crashing.
  * **Solution**: Integrated with `pipelineStateManager.ts` to persist, load, and clear pipeline state (`PipelineState`) on a per-session basis (`sessionId`).
* ❌ **Module Resolution / Compile Errors**: Importing `pipelineStateManager.js` using `./` relative paths failed to compile under `esbuild` because of different relative directory hierarchies.
  * **Solution**: Refactored both files to correctly reference `../protocols/pipelineStateManager.js`.
* ❌ **Silent Model Truncation & Content Deletion**: Large inputs often caused Agents A, B, or C to output incomplete delta files, silently dropping entire scenes or pages.
  * **Solution**: Created a robust `detectTruncation` and `normalizeForCount` word-ratio comparison utility. It enforces that the assembled script is longer than the raw source.
* ❌ **Missing Imports in Compile Phase**: `Adenomyosis_2.ts` attempted to write files using Node's `path` library but lacked the top-level ES module import.
  * **Solution**: Added `import * as path from "path"` and successfully resolved the TypeScript linter block.
* ❌ **Lack of User Review & Direct Action Hooks**: The user had no visual controls to inspect, accept, or reject specific pipeline phase outputs.
  * **Solution**: Added regex pattern matching in `ChatPanel.tsx` to display real-time holographic **ACCEPT** and **RETRY** controls directly on the message bubbles.

---

## 🔄 The Refactored Interactive Pipeline Flow (Phases 0 - 3)

Instead of running all phases sequentially in one request, the pipeline now halts at every phase, saves state, and requests user approval.

```
 [Raw Manuscript] ──► PHASE 0: Jarvis Parser & Normalizer
                            │
                            ▼
                    [VALIDATION GATE] ◄── Truncation / Structure Checks
                            │
                    (Requires User Approval) ◄── [UI ACCEPT / RETRY BUTTONS]
                            │
                            ▼
                     PHASE 1: Agent A (Creative) & Agent B (Tag) in Parallel
                            │
                    (Requires User Approval) ◄── [UI ACCEPT / RETRY BUTTONS]
                            │
                            ▼
                     PHASE 2: Agent C Master Assembler
                            │
                            ├──► (Emergency Auto-Retry if output is truncated)
                            │
                    (Requires User Approval) ◄── [UI ACCEPT / RETRY BUTTONS]
                            │
                            ▼
                     PHASE 3: Jarvis Integrity Auditor
                            │
                    (Requires User Approval) ◄── [UI ACCEPT / RETRY BUTTONS]
                            │
                            ▼
                     [SAVE WORKSPACE & METRICS]
```

### Phase Details

| Phase | Agent Role | Logic & Protections | Saved State Variables |
| :--- | :--- | :--- | :--- |
| **Phase 0** | `Jarvis (Parser)` | Normalizes script, numbers lines, structures scenes. Checks ratio of input words vs normalized output. | `script`, `normalizedScript`, `brief`, `distribution` |
| **Phase 1** | `Agent A & Agent B` | Runs parallel prompt generations for performance tags and soundscapes. | `deltaA` (Creative Delta), `deltaB` (Tag Delta) |
| **Phase 2** | `Agent C` | Merges source script and deltas into a final master script. If final is shorter than normalized, triggers **Emergency Self-Correction Run**. | `finalScript` |
| **Phase 3** | `Jarvis (Auditor)` | Evaluates script completeness and tags. Assigns numeric quality score. | `finalCheckReport` |

---

## 🎨 Interactive Visual UI Controls

To support easy commands, the React Client UI (`src/components/ChatPanel.tsx`) scans model responses for the pipeline marker `=== AWAITING APPROVAL: Phase (N) ===`.

### How It Works:
1. **Holographic Control Panel**: Renders a custom styled UI block with an animated amber warning beacon.
2. **Accept Command**: Pressing the button immediately triggers a chat action:
   ```bash
   @accept Phase <N>
   ```
   This loads the session state, resumes the pipeline execution, and fires the next agent step.
3. **Retry Command**: Pressing "Retry" slides open a responsive `textarea` input for optional feedback. Submitting it sends:
   ```bash
   @retry Phase <N>: <user_feedback>
   ```
   The active agent is then re-instantiated with the custom feedback concatenated to its system instructions, forcing surgical corrections.

---

### Verification and Compliance
* ✅ **Linter Status**: Checked with `tsc --noEmit` — **0 Errors**.
* ✅ **Build Status**: Verified with `npm run build` — **Bundle Completed Successfully**.
* ✅ **Dev Server**: Refreshed and fully online.
