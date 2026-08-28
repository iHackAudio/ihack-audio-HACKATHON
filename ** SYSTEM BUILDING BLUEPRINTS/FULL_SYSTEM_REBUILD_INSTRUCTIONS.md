# JARVIS OS: AUTOGEN V0.4 REBUILD INSTRUCTIONS
**Target:** Google AI Studio / Agentic AI Assistants
**Architecture:** Full-Stack (React/Vite + Express/Node.js) + Asynchronous Actor Model (AutoGen v0.4)

## 1. System Overview
You are tasked with building "Jarvis OS," a highly advanced, multi-agent AI system centered around collaborative **Story Writing** and dynamic conversational group chats. 
The system must be built as a full-stack application. The backend must utilize a custom, event-driven Asynchronous Actor Model inspired by Microsoft AutoGen v0.4.

## 2. Core Architecture (Backend)
The backend must run on Express (Node.js) and use Server-Sent Events (SSE) to stream live execution logs and actor status changes to the frontend.

### 2.1 The AutoGen v0.4 Actor Engine
Do not use linear, blocking `await` loops to pass data between agents. Instead, build a reactive Pub/Sub system.
- **EventBroker**: A global event bus (`EventEmitter`) that manages subscription topics.
- **BaseActor**: An abstract class representing an isolated agent. Each actor MUST have:
  - An isolated Inbox Queue (an array of pending messages).
  - A processing loop that processes one message at a time safely, ensuring no race conditions.
  - A status state (`idle`, `thinking`, `working`) that publishes to the EventBroker whenever modified.
- **ActorHost**: A centralized registry that spawns `JarvisActor`, `Agent A`, `Agent B`, and `Agent C`, and wires up their subscriptions.

### 2.2 Execution Modes & Focus
The primary focus of this system is **Story Writing** through collaborative group chat. 
- **Conversational Story Group Chat**: All requests initially route into a cascading group chat where Agent A, Agent B, and Agent C converse and write together, coordinated by Jarvis.
- **Agent Roles**: While previously focused on script optimization, roles are now fluid and driven by dynamic system instructions and skill files. Treat the conversation as a round-robin or reactive cascade where their instructions guide their behavior. Do not hardcode rigid behaviors into the backend code.

### 2.3 System Tools & Tool Calling
All agents MUST have full tool-calling capabilities to interact with the file system.
- **Rules of Engagement**: Agents only read, write, or access tools **when explicitly commanded by the user**. 
- **Core Tools Available to All Agents**:
  - `read_workspace_file(path)`
  - `write_workspace_file(path, content)`
  - `list_workspace_files(dir)`
  - `create_workspace_directory(dir)`
  - `delete_workspace_path(path)`

### 2.4 Skill Files (MD) & The "skills" Folder
The system heavily emphasizes `.md` skill files to augment agent capabilities.
- **Dedicated Directory**: There MUST be a dedicated folder at the root of the workspace named `skills`.
- **Hardcoded Path**: All agents must be hardcoded to know the path to the `skills` folder.
- **Structure**: The `skills` folder will contain files and subfolders for specific skills, which agents can read using their tool-calling capabilities to learn how to perform specialized tasks.

## 3. Dynamic System Instructions
System instructions are no longer just static text fields; they are dynamically maintained by the agents themselves.

### 3.1 Self-Updating Agents
- Agents have the ability to write and update their own system instructions.
- **Settings UI Flow**: When the user clicks the settings button, a pop-up panel appears for each agent. The user types a command (e.g., "Change your personality to be more dramatic and focus on world-building"), and the agent processes this command to rewrite its own system instructions.

### 3.2 Jarvis Supervisor Override
- **Jarvis Override**: Jarvis has the permission to update the system instructions of other agents (Agent A, B, C) to better orchestrate the story writing process.
- **User Approval Flow**: Before Jarvis can apply an update to another agent's instructions, the proposed changes **must be presented to the user for approval** via the UI.

## 4. Frontend & UI (React + Tailwind CSS)
The UI must feel like an elite, hyper-modern AI operating system (Cyber-glass / Dark mode).

### 4.1 Visual Components
- **Live Terminal / Console**: A central window displaying live SSE logs from the backend with a typing effect. Prefix logs with the active agent's name.
- **Actor Status Sidebar**: A visual dashboard showing the real-time status of all 4 agents. UI cards should pulse/glow on state changes.
- **Settings Pop-Up Panels**: A dedicated, pop-up configuration menu for each agent where:
  - Users can type commands for the agent to self-update its instructions.
  - Jarvis's proposed instruction overrides for other agents await user approval.
  - Agent toggles and model selection (e.g., `gemini-2.5-flash`, `gemini-2.5-pro`) are available.

### 4.2 State Management & SSE
- Connect to `/api/stream` and listen to event types (`pipeline.log`, `actor.status.update`).
- The UI must remain purely reactive without polling loops.

## 5. LLM Integration & Memory
- Use the official `@google/genai` SDK.
- Implement an `AgentHub` maintaining separate conversation memories for each agent.
- Ensure API keys are stored and passed securely. Handle rate limits gracefully (catch 429s).

## 6. Awesome Agent Skills Reference
For expanding the agents' capabilities (especially within the `skills` folder), refer to the [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills#skills-by-voltagent) repository. 

**Highly Recommended Skills for Google AI Studio Coding Agents:**
- **Gemini API Integrations**: Skills outlining usage of the `@google/genai` SDK, Interactions API, Multimodal inputs, and Function Calling.
- **File System Operations**: Standardized patterns for reading/writing multiple files or large codebases without breaking context.
- **Project Bootstrapping**: Skills for scaffolding React/Vite/Express applications and managing `package.json` dependencies.
- **Git/Version Control**: Capabilities to track changes or revert broken code iteratively.
- **Code Linting & Execution**: Skills teaching agents how to self-verify code by running local linters or test scripts before presenting the final result.

## 7. Sequence of Implementation
1. **Scaffold the Backend**: Setup Express, Vite middleware, and the AutoGen Engine (`EventBroker`, `BaseActor`, `ActorHost`).
2. **Implement Tools**: Create the workspace file manipulation utilities and ensure the `skills` folder is hardcoded and accessible.
3. **Build the Prompts & Logic**: Implement the Group Chat Story mode and the dynamic instruction-updating logic (including Jarvis's approval flow).
4. **Build the Frontend**: Craft the dark-themed UI, SSE listeners, Actor Status sidebars, and the new Settings Pop-Up panels for agent commands.
5. **Connect & Polish**: Ensure end-to-end event flowing and verify that agents can successfully call tools and rewrite their own instructions on command.

## 8. Frontend Framework & Workspace UI Recommendations

### 8.1 Best Framework for AI Studio Integration
**React + Vite** is the most robust and natively supported framework for the AI Studio environment.
- **Why:** AI Studio's build systems are highly optimized for Vite. It allows you to easily drop in plain HTML, CSS, and JS, while providing a component-based structure to manage complex UI states (like multiple agent pop-ups and real-time SSE streams). 
- **Styling:** Use **Tailwind CSS** alongside it for rapid, cyber-glass/dark-mode styling without needing massive external stylesheets.

### 8.2 Full Project Management Workspace & Text Editor
To build a full "IDE-like" project management workspace within the browser:
- **Text Editor Panel:** Use **Monaco Editor** (`@monaco-editor/react`). This is the exact engine that powers VS Code. It provides out-of-the-box syntax highlighting for Markdown and code, mini-maps, diff viewing (perfect for seeing how agents modify a story or skill file), and split-pane editing.
- **File Explorer / Tree View:** Use **React Arborist** (`react-arborist`). It provides a highly customizable, drag-and-drop file tree component that can visually represent the workspace, including the dedicated `skills` folder.
- **Layout Management:** Use a library like **Allotment** (`allotment`) or **react-resizable-panels** to create resizable IDE panels (e.g., Sidebar for files, Main panel for Monaco Editor, Bottom panel for the Live Terminal/Agent Chat).