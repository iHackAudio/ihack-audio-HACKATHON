# PROTOCOL IMPLEMENTATION GUIDELINE & UPDATES

This document serves as both a historical summary of critical core updates to the J.A.R.V.I.S. multi-agent pipeline and the **authoritative step-by-step guideline for adding any new protocol perfectly**.

---

## 🚀 How to Add a New Protocol (The Perfect Guide)

To add a new protocol (e.g., `GURU`, `protocol7`) and ensure it hooks into the UI, settings, model fallback chain, and execution environment flawlessly, follow these exact steps:

### Step 1: Create the Protocol File
Create your new protocol script in `server/Instructions/` (e.g., `GURU.ts`).
**Requirements:**
- It MUST export the `runPipeline` function: 
  `export async function runPipeline(userInput: string, sendToUI: (msg: any) => void, sessionId: string = "default"): Promise<void>`
- It MUST export system instruction strings for the active agents, for example:
  - `export const JARVIS_SYSTEM_INSTRUCTION = "..."`
  - `export const AGENT_A_SYSTEM_INSTRUCTION = "..."`
  - `export const AGENT_B_SYSTEM_INSTRUCTION = "..."`
  - `export const AGENT_C_SYSTEM_INSTRUCTION = "..."`

### Step 2: Register in `activeProtocol.json`
Edit `server/protocols/activeProtocol.json`. Add the new protocol ID to the `protocols` object:
```json
"GURU": {
  "name": "GURU Protocol",
  "description": "GURU Protocol implementation",
  "version": "1.0"
}
```
*(Optional)* You can set `"activeProtocol": "GURU"` to make it default.

### Step 3: Register in `protocolLoader.ts`
Edit `server/protocols/protocolLoader.ts`:
1. Import the new module at the top:
   `import * as guru from "../Instructions/GURU";`
2. Add it to the routing logic inside `getProtocolInstructions()`:
   ```typescript
   } else if (active === "GURU") {
     return guru;
   }
   ```

### Step 4: Whitelist the Protocol in Backend Routes
Both `server.ts` and `server/agents/jarvis.ts` have hardcoded validation checks for allowed protocols. You MUST add your new protocol name to these `if` statements.

**In `server.ts` (around line ~330):**
```typescript
if (activeProtocol === "protocol1" || ... || activeProtocol === "protocol6" || activeProtocol === "GURU") {
  const pModule = await import(`./server/Instructions/${activeProtocol}.js`);
```

**In `server/agents/jarvis.ts` (around line ~1137):**
```typescript
if (activeProtocol === "protocol1" || ... || activeProtocol === "protocol6" || activeProtocol === "GURU") {
  const p = await import(`../Instructions/${activeProtocol}.js`);
```

### Step 5: Assign Default Models in `agent_config.json` (Optional but Recommended)
Edit `server/agent_config.json`. You can provide custom default models for the new protocol so the UI populates them correctly:
```json
"GURU": {
  "agentA": { "enabled": true, "systemInstruction": "AGENT_A_SYSTEM_INSTRUCTION", "model": "gemini-3.1-flash-lite" },
  "agentB": { "enabled": true, "systemInstruction": "AGENT_B_SYSTEM_INSTRUCTION", "model": "gemini-3.1-flash-lite" },
  "agentC": { "enabled": true, "systemInstruction": "AGENT_C_SYSTEM_INSTRUCTION", "model": "gemini-3.5-flash" },
  "jarvis": { "voiceModel": "gemini-3.1-flash-live-preview", "textModel": "gemini-3.5-flash", "systemInstruction": "JARVIS_SYSTEM_INSTRUCTION" }
}
```

### Step 6: UI Configuration (Optional)
If your new protocol requires special UI handling, check `src/App.tsx`. 
For instance, the function `getProtocolColors()` determines the visual theme/glow based on the protocol ID. You can add a `case 'GURU':` to define its specific colors. 
*Note: The `SettingsPanel.tsx` has already been made dynamic to handle any newly registered protocol automatically, displaying its name from `activeProtocol.json`.*

---

## 🛠️ Historical System Updates

### 1. Workspace File Resolution (The "test.txt" Fix)
A significant issue was identified where the pipeline would process the user's *command* as the script itself, rather than reading the actual content of the referenced file.
**Fix Applied:**
- Implemented `resolveWorkspaceFiles` in `server/llmUtils.ts`.
- Scans the workspace for files and prepends their content to the original command, clearly demarcated.

### 2. Standardized Agent Roles & Instructions
To ensure consistent behavior across all protocols, agent roles and system instructions have been standardized.
**Updates:**
- Exported constant roles for all protocols (`JARVIS_SYSTEM_INSTRUCTION`, etc).
- This ensures that the system loads the correct personas regardless of the active protocol.

### 3. Pipeline State & Locking
Addressed issues related to pipeline state management to prevent double-execution and ensure a clean restart.
**Fix Applied:**
- Enhanced session-based locking and state management in `runPipeline`.
- Integrated `validateStage` to catch empty or insufficient agent outputs early in the funnel.

### 4. Multi-Agent Pipeline Visibility
Improved UI feedback during the transition between agents.
**Fix Applied:**
- Added explicit UI messages for file scanning: `🔍 Scanning workspace for referenced files...`
- Maintained `glassBoxEvent` and `postBillboard` integration for real-time progress tracking.

### 5. Dynamic Models & Settings Fixes
- Introduced a dynamic `modelMap` loaded via `/api/models` to display available base/fallback models dynamically per-agent in the settings pane.
- Settings panel is now robust to dynamically map new protocol keys without hard-coding specific string names like "protocol1".
