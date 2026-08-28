# 📖 JARVIS OS - BIBLE ARCHITECTURE & SYSTEM SPECIFICATION
> **Unified Architecture Blueprint & Micro-Detail System Reference**
> **Version**: 3.1.0 | **Engine**: Dual Node.js/Express + Vite ESM Stack | **Primary Model**: `@google/genai` Unified SDK

---

## 📑 TABLE OF CONTENTS
1. [System Overview & Macro Architecture](#1-system-overview--macro-architecture)
2. [Skill Files & Parsing Engine](#2-skill-files--parsing-engine)
3. [Protocol Pipeline & Orchestration Engine](#3-protocol-pipeline--orchestration-engine)
4. [Multi-Agent Roster & Neural Routing](#4-multi-agent-roster--neural-routing)
5. [Workspace Filesystem & Core Shield Protection](#5-workspace-filesystem--core-shield-protection)
6. [Development Time Tracker & Persistence](#6-development-time-tracker--persistence)
7. [WebSocket & Real-Time Event Bus](#7-websocket--real-time-event-bus)
8. [Micro-Detail Execution Flowchart](#8-micro-detail-execution-flowchart)

---

## 1. 🏗️ SYSTEM OVERVIEW & MACRO ARCHITECTURE

JARVIS OS is an autonomous, multi-agent AI environment specialized for audiobook processing, manuscript parsing, narrative scripting, and multi-agent debate/execution pipelines. 

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   BROWSER CLIENT                                │
│    ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐    │
│    │  Glassmorphism UI │     │ Analysis Terminal │     │ Skill/Bible Modal │    │
│    └─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘    │
└──────────────│─────────────────────────│─────────────────────────│──────────────┘
               │ HTTP / SSE              │ WS / JSON RPC           │ REST / JSON
               ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SERVER ENGINE (Node.js / Express)                     │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐ │
│  │   agentHub.ts Router   │  │  protocolLoader.ts     │  │ skillBibleUtils.ts │ │
│  └───────────┬────────────┘  └───────────┬────────────┘  └─────────┬──────────┘ │
│              │                           │                         │            │
│              ▼                           ▼                         ▼            │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            @google/genai SDK                              │ │
│  │                Models: gemini-2.5-flash / gemini-2.5-pro                 │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧠 SKILL FILES & PARSING ENGINE

Skill files provide modular, domain-specific instruction bundles that dynamically inject rules into multi-agent system prompts.

### 2.1 File Location & Discovery
- **Primary Directory**: `workspace files/SKILLS/*.md`
- **Fallback Directory**: `workspace files/*.md`
- **Discovery Logic** (`server/skillBibleUtils.ts`):
  `discoverSkillFile()` scans designated directories for Markdown files containing `# SKILL <N>` headers while filtering out `README` artifacts.

### 2.2 Skill Document Format
A skill document uses structured Markdown headings to isolate agent roles:

```markdown
# SKILL 1 — Cinematic Narrative Structuring

## ALL AGENTS
```
Universal rules applicable to Jarvis, Agent A, Agent B, and Agent C.
```

## AGENT: AGENT A
```
Instructions specific to Agent A (Script Parser & Intake Specialist).
```

## AGENT: AGENT B
```
Instructions specific to Agent B (Director & Pronunciation Checker).
```

## AGENT: AGENT C
```
Instructions specific to Agent C (Final Teleprompter & Formatter).
```

## AGENT: JARVIS
```
Instructions for Jarvis Orchestrator.
```

## GLOBAL RULES and OUTPUT FORMAT
```
Formatting constraints, JSON schemas, and prohibited token patterns.
```
```

### 2.3 Parsing Engine Mechanics (`parseSkillSections`)
`parseSkillSections(skillContent: string)` extracts regex-bounded blocks:
1. `allAgents`: `## ALL AGENTS ... ```(...)``` `
2. `agentA`: `## AGENT: AGENT A ... ```(...)``` `
3. `agentB`: `## AGENT: AGENT B ... ```(...)``` `
4. `agentC`: `## AGENT: AGENT C ... ```(...)``` `
5. `jarvis`: `## AGENT: JARVIS ... ```(...)``` `
6. `globalRules`: `## GLOBAL RULES and OUTPUT FORMAT ... ```(...)``` `

### 2.4 Context Injection
When an agent prompt is prepared in `agentHub.ts` or a protocol runner, the parser retrieves the active skill sections and prepends them directly into the Gemini model call instructions:
$$\text{Final Prompt} = \text{Base System Instructions} + \text{Skill}_{\text{ALL}} + \text{Skill}_{\text{AgentX}} + \text{User Input}$$

---

## 3. ⚙️ PROTOCOL PIPELINE & ORCHESTRATION ENGINE

Protocols define stateful multi-agent execution graphs.

### 3.1 Registry & Active Protocol Switcher
- **State Persistence**: `server/protocols/activeProtocol.json`
- **Protocol Loader**: `server/protocols/protocolLoader.ts` dynamically exposes active protocol instructions.

### 3.2 Supported Protocols

| Protocol ID | Protocol Name | Description / Workflow |
| :--- | :--- | :--- |
| `autogen` | AutoGen Multi-Agent Debate | Autonomous multi-agent discussion loop (Jarvis + Agent A + Agent B + Agent C). |
| `protocol1` | Standard Audiobook Pipeline | 5-step structured pipeline (Intake $\rightarrow$ PDF Parse $\rightarrow$ Story Bible $\rightarrow$ Script $\rightarrow$ Teleprompter). |
| `protocol5` | Advanced Quality Gate Protocol | 5-stage pipeline with strict verification gates and phonetic dictionary checks. |
| `cinematic_3agent` | Cinematic Story Pipeline | Storytelling engine focused on Cinematic Prose Scene Documents (CPSD). |
| `cinematic_simple` | Streamlined Storytelling | Fast 2-agent narrative generator. |
| `adk_story` | ADK Multi-Agent Flow | Built on Google Agent Development Kit (ADK) pattern. |

### 3.3 Protocol Execution Structure (`server/Instructions/protocol1.ts`)
Protocols implement a universal export interface:
```typescript
export interface ProtocolModule {
  PROTOCOL_META: {
    id: string;
    name: string;
    version: string;
    description: string;
  };
  getSystemPromptForAgent: (agentId: string, context?: any) => string;
  executePipelineStage?: (stageId: string, input: any) => Promise<any>;
}
```

---

## 4. 🤖 MULTI-AGENT ROSTER & NEURAL ROUTING

| Agent ID | Name | Primary Role | Default Neural Model |
| :--- | :--- | :--- | :--- |
| `jarvis` | JARVIS Main | Master Systems Architect & System Dispatcher | `gemini-2.5-flash` |
| `agentA` | Agent A | Script Parser, PDF Intake & Token Counter | `gemini-2.5-flash` |
| `agentB` | Agent B | Director, Pronunciation & Wikidata Verifier | `gemini-2.5-flash` / `gemini-2.5-pro` |
| `agentC` | Agent C | Teleprompter Assembler & HTML Generator | `gemini-2.5-flash` |

### Key Failover & Fallback Mechanism
If a Gemini model returns HTTP `429` (Rate Limit) or an API key error, `llmUtils.ts` automatically rotates through key pools and model aliases seamlessly without throwing fatal crashes to the user UI.

---

## 5. 🛡️ WORKSPACE FILESYSTEM & CORE SHIELD PROTECTION

The workspace is hosted under `workspace files/` with strict security bounds managed by `filesystem.ts`.

### Protected Paths (Core Shield Integrity)
To prevent accidental corruption of system source code, the following paths are **strictly read-only** for agent tool calls:
- System Root Files: `server.ts`, `filesystem.ts`, `package.json`, `tsconfig.json`, `vite.config.ts`
- Source Folders: `server/`, `src/`

### File Operations Tool Suite
1. `read_workspace_file`: Reads text content (with automatic fuzzy path matching).
2. `write_workspace_file`: Saves text/JSON files to `workspace files/`.
3. `list_workspace_files`: Returns hierarchical file tree.
4. `delete_workspace_path`: Deletes files/directories (subject to Shield check).
5. `count_script_tokens`: Calculates word count, Gemini token estimates, and 155 WPM audio duration.
6. `parse_pdf_manuscript`: Uses multimodal Gemini 2.5 to parse uploaded PDF manuscripts into Markdown.

---

## 6. ⏱️ DEVELOPMENT TIME TRACKER & PERSISTENCE

`DevTimeTracker` (`server/devTimeTracker.ts`) monitors live active development time and persists logs across page reloads or server restarts.

### Key Metrics
- **Baseline Prelogged Hours**: `30 Hours` (108,000 seconds) pre-seeded for architecture and foundational build time.
- **Heartbeat Sync**: Client pings `/api/dev-time/heartbeat` every 5 seconds.
- **Inactivity Timeout**: If no heartbeat is received for 20 seconds, the active session is automatically closed with an interrupt log.
- **Beacon Unload**: `beforeunload` fires `navigator.sendBeacon('/api/dev-time/session-end')` to record exit events instantly.
- **Log File**: Saved to `dev_time_log.json` at root.

---

## 7. 🔌 WEBSOCKET & REAL-TIME EVENT BUS

Real-time terminal streaming and logs are broadcast over WebSockets managed in `server.ts`:
- **Path**: `ws://<host>:3000/ws`
- **Events**:
  - `agent_thought`: Live streaming thought traces from agents.
  - `agent_status`: State transitions (`idle`, `thinking`, `working`, `error`).
  - `terminal_log`: System execution output sent to Analysis Terminal.
  - `pipeline_event`: Protocol stage advances.

---

## 8. 🔄 MICRO-DETAIL EXECUTION FLOWCHART

```
[ User Input / PDF Upload ]
           │
           ▼
[ Analysis Terminal / Chat Input ]
           │
           ▼
[ agentHub.ts Router ]
           │
   ┌───────┴─────────────────────────────┐
   ▼                                     ▼
[ Skill Parser ]               [ Protocol Loader ]
Reads workspace files/SKILLS/*.md      Loads activeProtocol.json
Injects agent-specific rules           Sets stage execution graph
   │                                     │
   └─────────────────┬───────────────────┘
                     │
                     ▼
           [ @google/genai Call ]
         Model: gemini-2.5-flash
                     │
                     ▼
        [ Tool Call Execution ]
  (e.g., verify_pronunciation,
   count_script_tokens, write_file)
                     │
                     ▼
       [ UI State & WS Broadcast ]
 (AnalysisTerminal, Teleprompter, Chat)
```

---
*Created and validated for JARVIS OS v3.1.*
