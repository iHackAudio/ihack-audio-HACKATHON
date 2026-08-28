import { GoogleGenAI, Schema, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// ----------------------------------------------------------------------------
// Workspace Directory Constant
// Root workspace path: ./workspace files
// ----------------------------------------------------------------------------
export const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

export function loadSkillSystemDoc(): string {
  try {
    const skillPath = path.join(WORKSPACE_DIR, "STORY_PRODUCTION_SKILL_SYSTEM.md");
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, "utf-8");
    }
  } catch (err) {
    console.warn("Could not read STORY_PRODUCTION_SKILL_SYSTEM.md:", err);
  }
  return "";
}

// ----------------------------------------------------------------------------
// Google ADK Lightweight Framework Abstraction over @google/genai
// ----------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (input: any) => Promise<any>;
}

export class FunctionTool {
  name: string;
  description: string;
  parameters: any;
  execute: (input: any) => Promise<any>;

  constructor(options: {
    name: string;
    description: string;
    parameters: any;
    execute: (input: any) => Promise<any>;
  }) {
    this.name = options.name;
    this.description = options.description;
    this.parameters = options.parameters;
    this.execute = options.execute;
  }
}

export class Gemini {
  model: string;
  apiKey: string;
  private client: GoogleGenAI;

  constructor(options: { model: string; apiKey?: string }) {
    this.model = options.model;
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || "";
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generate(instruction: string, prompt: string, tools: FunctionTool[] = []) {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          systemInstruction: instruction
        }
      });
      return response.text || "";
    } catch (err: any) {
      console.error(`[ADK Gemini Error (${this.model})]:`, err);
      throw err;
    }
  }
}

export class Agent {
  name: string;
  description: string;
  model: Gemini;
  instruction: string;
  tools: FunctionTool[];

  constructor(options: {
    name: string;
    description: string;
    model: Gemini;
    instruction: string;
    tools?: FunctionTool[];
  }) {
    this.name = options.name;
    this.description = options.description;
    this.model = options.model;
    this.instruction = options.instruction;
    this.tools = options.tools || [];
  }

  async run(prompt: string): Promise<string> {
    return await this.model.generate(this.instruction, prompt, this.tools);
  }
}

export class SequentialAgent {
  name: string;
  description: string;
  subAgents: Agent[];

  constructor(options: {
    name: string;
    description: string;
    subAgents: Agent[];
  }) {
    this.name = options.name;
    this.description = options.description;
    this.subAgents = options.subAgents;
  }
}

export interface Event {
  type: string;
  agentName?: string;
  content?: {
    parts?: Array<{ text?: string }>;
  };
  timestamp?: number;
}

export class InMemorySessionService {
  private sessions: Map<string, any> = new Map();

  async createSession(options: { appName: string; userId: string; sessionId: string }) {
    const session = { ...options, history: [], createdAt: Date.now() };
    this.sessions.set(options.sessionId, session);
    return session;
  }

  async getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }
}

export class Runner {
  appName: string;
  agent: SequentialAgent | Agent;
  sessionService: InMemorySessionService;

  constructor(options: {
    appName: string;
    agent: SequentialAgent | Agent;
    sessionService: InMemorySessionService;
  }) {
    this.appName = options.appName;
    this.agent = options.agent;
    this.sessionService = options.sessionService;
  }

  async *runAsync(options: {
    userId: string;
    sessionId: string;
    newMessage: { role: string; parts: Array<{ text?: string }> };
  }): AsyncGenerator<Event> {
    const userPrompt = options.newMessage.parts[0]?.text || "";

    if (this.agent instanceof SequentialAgent) {
      let accumulatedContext = userPrompt;

      for (const subAgent of this.agent.subAgents) {
        yield {
          type: "agent_start",
          agentName: subAgent.name,
          timestamp: Date.now()
        };

        const resultText = await subAgent.run(accumulatedContext);

        accumulatedContext += `\n\n=== Output from ${subAgent.name} ===\n${resultText}`;

        yield {
          type: "agent_output",
          agentName: subAgent.name,
          content: {
            parts: [{ text: resultText }]
          },
          timestamp: Date.now()
        };
      }
    } else if (this.agent instanceof Agent) {
      const singleAgent = this.agent;
      yield {
        type: "agent_start",
        agentName: singleAgent.name,
        timestamp: Date.now()
      };

      const resultText = await singleAgent.run(userPrompt);

      yield {
        type: "agent_output",
        agentName: singleAgent.name,
        content: {
          parts: [{ text: resultText }]
        },
        timestamp: Date.now()
      };
    }
  }
}

// ----------------------------------------------------------------------------
// Helper ADK Tools for Audiobook & Story Production
// ----------------------------------------------------------------------------

export const countScriptTokensTool = new FunctionTool({
  name: "count_script_tokens",
  description: "Analyzes script text to count words, estimate tokens, and calculate projected audio duration (155 WPM).",
  parameters: {
    type: "OBJECT",
    properties: {
      scriptText: {
        type: "STRING",
        description: "The Markdown or plain text script content to analyze."
      }
    },
    required: ["scriptText"]
  },
  execute: async (input: unknown) => {
    const { scriptText = "" } = (input as { scriptText?: string }) || {};
    const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
    const tokenEstimate = Math.ceil(wordCount * 1.35);
    const minutes = wordCount / 155;
    const wholeMinutes = Math.floor(minutes);
    const seconds = Math.round((minutes - wholeMinutes) * 60);

    return {
      wordCount,
      tokenEstimate,
      estimatedMinutes: minutes.toFixed(2),
      formattedDuration: `${wholeMinutes}m ${seconds}s (approx. at 155 WPM standard narration pace)`,
      readingPace: "155 WPM (Cinematic Audiobook Target)"
    };
  }
});

export const verifyPronunciationTool = new FunctionTool({
  name: "verify_pronunciation_guide",
  description: "Creates phonetic guide (Respelling and IPA) for complex names and terms in audio production.",
  parameters: {
    type: "OBJECT",
    properties: {
      terms: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of character names, locations, or technical terms to generate phonetic pronunciations for."
      }
    },
    required: ["terms"]
  },
  execute: async (input: unknown) => {
    const { terms = [] } = (input as { terms?: string[] }) || {};
    const phoneticGuide = terms.map(term => ({
      term,
      phoneticRespelling: term.toUpperCase().split("").join("-"),
      audioActorNote: `Emphasize primary syllable clearly for ${term}.`
    }));

    return {
      status: "success",
      count: terms.length,
      guide: phoneticGuide
    };
  }
});

export const writeWorkspaceFileTool = new FunctionTool({
  name: "write_workspace_file",
  description: "Writes content directly to the shared local workspace files directory.",
  parameters: {
    type: "OBJECT",
    properties: {
      filename: {
        type: "STRING",
        description: "Filename (e.g., EPISODE_01_SCENE_01_SCRIPT.md or CHARACTER_BIBLE.md)"
      },
      content: {
        type: "STRING",
        description: "The complete UTF-8 content to write."
      }
    },
    required: ["filename", "content"]
  },
  execute: async (input: unknown) => {
    const { filename = "", content = "" } = (input as { filename?: string; content?: string }) || {};
    try {
      const sanitized = path.basename(filename);
      const targetPath = path.join(WORKSPACE_DIR, sanitized);
      fs.writeFileSync(targetPath, content, "utf-8");
      return { status: "success", filename: sanitized, path: targetPath, bytesWritten: Buffer.byteLength(content) };
    } catch (err: any) {
      return { status: "error", error: err.message || String(err) };
    }
  }
});

export const readWorkspaceFileTool = new FunctionTool({
  name: "read_workspace_file",
  description: "Reads a document or script from the shared local workspace files directory.",
  parameters: {
    type: "OBJECT",
    properties: {
      filename: {
        type: "STRING",
        description: "Relative filename inside workspace files (e.g., STORY_PRODUCTION_SKILL_SYSTEM.md)"
      }
    },
    required: ["filename"]
  },
  execute: async (input: unknown) => {
    const { filename = "" } = (input as { filename?: string }) || {};
    try {
      const targetPath = path.join(WORKSPACE_DIR, path.basename(filename));
      if (!fs.existsSync(targetPath)) {
        return { status: "not_found", filename };
      }
      const content = fs.readFileSync(targetPath, "utf-8");
      return { status: "success", filename, content };
    } catch (err: any) {
      return { status: "error", error: err.message || String(err) };
    }
  }
});

export const readGoogleDocTool = new FunctionTool({
  name: "read_google_doc",
  description: "Reads manuscript or notes directly from a Google Doc using an OAuth token.",
  parameters: {
    type: "OBJECT",
    properties: {
      documentId: {
        type: "STRING",
        description: "The Google Doc ID to read from."
      },
      accessToken: {
        type: "STRING",
        description: "Google OAuth access token."
      }
    },
    required: ["documentId"]
  },
  execute: async (input: unknown) => {
    const { documentId = "", accessToken = "" } = (input as { documentId?: string; accessToken?: string }) || {};
    try {
      const { readGoogleDoc } = await import("../workspaceTools");
      const token = accessToken || process.env.GOOGLE_ACCESS_TOKEN || "";
      if (!token) {
        return { status: "missing_token", message: "Google OAuth token required to read Google Docs directly." };
      }
      const text = await readGoogleDoc(token, documentId);
      return { status: "success", documentId, content: text };
    } catch (err: any) {
      return { status: "error", error: err.message || String(err) };
    }
  }
});

export const exportToGoogleDocTool = new FunctionTool({
  name: "export_to_google_doc",
  description: "Creates or appends a generated audio drama script to a new Google Doc.",
  parameters: {
    type: "OBJECT",
    properties: {
      title: {
        type: "STRING",
        description: "Title of the Google Doc to create."
      },
      content: {
        type: "STRING",
        description: "Script or character bible text."
      },
      accessToken: {
        type: "STRING",
        description: "Google OAuth access token."
      }
    },
    required: ["title", "content"]
  },
  execute: async (input: unknown) => {
    const { title = "Audio Drama Script", content = "", accessToken = "" } = (input as { title?: string; content?: string; accessToken?: string }) || {};
    try {
      const { createGoogleDoc, appendToGoogleDoc } = await import("../workspaceTools");
      const token = accessToken || process.env.GOOGLE_ACCESS_TOKEN || "";
      if (!token) {
        return { status: "missing_token", message: "Google OAuth token required to export to Google Docs." };
      }
      const doc = await createGoogleDoc(token, title);
      if (doc.documentId) {
        await appendToGoogleDoc(token, doc.documentId, content);
      }
      return { status: "success", title, documentId: doc.documentId };
    } catch (err: any) {
      return { status: "error", error: err.message || String(err) };
    }
  }
});

// ----------------------------------------------------------------------------
// Model & Key Resolver for Dedicated Multi-Agent Setup
// ----------------------------------------------------------------------------

export interface AgentKeysConfig {
  conceptKey?: string;
  characterKey?: string;
  sceneKey?: string;
  scriptKey?: string;
}

export interface AgentModelsConfig {
  conceptModel?: string;
  characterModel?: string;
  sceneModel?: string;
  scriptModel?: string;
}

export interface AgentInstructionsConfig {
  conceptInstruction?: string;
  characterInstruction?: string;
  sceneInstruction?: string;
  scriptInstruction?: string;
}

export const DEFAULT_MODEL = "gemini-3.6-flash";

export function createDedicatedAgentModels(
  defaultModel: string = DEFAULT_MODEL,
  agentKeys?: AgentKeysConfig,
  agentModels?: AgentModelsConfig
) {
  const fallbackKey = process.env.GEMINI_API_KEY || "";

  const conceptKey = agentKeys?.conceptKey || process.env.GEMINI_API_KEY_CONCEPT || process.env.GEMINI_API_KEY_3 || fallbackKey;
  const characterKey = agentKeys?.characterKey || process.env.GEMINI_API_KEY_CHARACTER || process.env.GEMINI_API_KEY_4 || fallbackKey;
  const sceneKey = agentKeys?.sceneKey || process.env.GEMINI_API_KEY_SCENE || process.env.GEMINI_API_KEY_5 || fallbackKey;
  const scriptKey = agentKeys?.scriptKey || process.env.GEMINI_API_KEY_SCRIPT || fallbackKey;

  const conceptModel = agentModels?.conceptModel || defaultModel;
  const characterModel = agentModels?.characterModel || defaultModel;
  const sceneModel = agentModels?.sceneModel || defaultModel;
  const scriptModel = agentModels?.scriptModel || defaultModel;

  const conceptLlm = new Gemini({ model: conceptModel, apiKey: conceptKey });
  const characterLlm = new Gemini({ model: characterModel, apiKey: characterKey });
  const sceneLlm = new Gemini({ model: sceneModel, apiKey: sceneKey });
  const scriptLlm = new Gemini({ model: scriptModel, apiKey: scriptKey });

  return {
    conceptLlm,
    characterLlm,
    sceneLlm,
    scriptLlm,
    modelsInUse: {
      concept: conceptModel,
      character: characterModel,
      scene: sceneModel,
      script: scriptModel
    },
    keysInUse: {
      concept: conceptKey ? `...${conceptKey.slice(-6)}` : "missing",
      character: characterKey ? `...${characterKey.slice(-6)}` : "missing",
      scene: sceneKey ? `...${sceneKey.slice(-6)}` : "missing",
      script: scriptKey ? `...${scriptKey.slice(-6)}` : "missing"
    }
  };
}

// ----------------------------------------------------------------------------
// Google ADK Pipeline Builder
// ----------------------------------------------------------------------------

export function buildStoryProductionPipeline(
  defaultModel: string = DEFAULT_MODEL,
  agentKeys?: AgentKeysConfig,
  agentModels?: AgentModelsConfig,
  customInstructions?: AgentInstructionsConfig
) {
  const models = createDedicatedAgentModels(defaultModel, agentKeys, agentModels);
  const skillDoc = loadSkillSystemDoc();

  const skillSystemBanner = skillDoc 
    ? `\n\n=== STORY PRODUCTION SKILL SYSTEM REFERENCE (root/workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md) ===\n${skillDoc.slice(0, 3000)}\n=== END SKILL REFERENCE ===\n`
    : "";

  const defaultConceptInstr = `You are the Google ADK Concept Development Agent (Skill 1: Concept Development) for Cinematic Audiobooks.
Analyze the user's premise, genre, and emotional ideas and produce a strictly structured CONCEPT SUMMARY formatted with Core Premise, Emotional Core, and Secret Underneath.`;

  const defaultCharacterInstr = `You are the Google ADK Character Bible Agent (Skill 2: Character Bible Creator).
For every character in the concept, define: ROLE, NATURE, FUNCTION, ARC, VOICE PROFILE, and SUB-PROFILES.`;

  const defaultSceneInstr = `You are the Google ADK Scene Breakdown Architect (Skill 3: Scene Breakdown Architect).
Structure the story into 4 tightly scoped scenes with setting, conflict beats, and cliffhangers.`;

  const defaultScriptInstr = `You are the Google ADK Script Writer & Audio Assembler Agent (Skill 4: Script Writer & Lead / Jarvis).
Write immersive, dialogue-rich narrative script using the Character Sub-Profiles and Scene Briefs.`;

  const conceptInstruction = (customInstructions?.conceptInstruction || defaultConceptInstr) + skillSystemBanner;
  const characterInstruction = (customInstructions?.characterInstruction || defaultCharacterInstr) + skillSystemBanner;
  const sceneInstruction = (customInstructions?.sceneInstruction || defaultSceneInstr) + skillSystemBanner;
  const scriptInstruction = (customInstructions?.scriptInstruction || defaultScriptInstr) + skillSystemBanner;

  const conceptAgent = new Agent({
    name: "ConceptDeveloper",
    description: "Skill 1 Agent: Extracts creator intent and generates a locked Concept Summary.",
    model: models.conceptLlm,
    instruction: conceptInstruction,
    tools: [readWorkspaceFileTool, writeWorkspaceFileTool]
  });

  const characterBibleAgent = new Agent({
    name: "CharacterBibleCreator",
    description: "Skill 2 Agent: Generates audio-production-ready character profiles with Voice Profiles and Sub-Profiles.",
    model: models.characterLlm,
    instruction: characterInstruction,
    tools: [verifyPronunciationTool, readWorkspaceFileTool, writeWorkspaceFileTool]
  });

  const sceneBreakdownAgent = new Agent({
    name: "SceneBreakdownArchitect",
    description: "Skill 3 Agent: Builds a 4-scene episode breakdown structure with emotional arcs, settings, and cliffhangers.",
    model: models.sceneLlm,
    instruction: sceneInstruction,
    tools: [readWorkspaceFileTool, writeWorkspaceFileTool]
  });

  const scriptWriterAgent = new Agent({
    name: "ScriptWriter",
    description: "Skill 4 Agent: Writes vivid cinematic audiobook script with injected Context Anchor per scene.",
    model: models.scriptLlm,
    instruction: scriptInstruction,
    tools: [countScriptTokensTool, readWorkspaceFileTool, writeWorkspaceFileTool]
  });

  const pipeline = new SequentialAgent({
    name: "StoryProductionADKPipeline",
    description: `Google ADK Multi-Agent Pipeline executing Concept -> Character -> Scene -> Script`,
    subAgents: [
      conceptAgent,
      characterBibleAgent,
      sceneBreakdownAgent,
      scriptWriterAgent
    ]
  });

  return {
    pipeline,
    conceptAgent,
    characterBibleAgent,
    sceneBreakdownAgent,
    scriptWriterAgent,
    modelsInUse: models.modelsInUse,
    keysInUse: models.keysInUse,
    defaultModel
  };
}

// ----------------------------------------------------------------------------
// ADK Execution Interface Function
// ----------------------------------------------------------------------------

export interface RunADKPipelineOptions {
  userPrompt: string;
  modelName?: string;
  agentKeys?: AgentKeysConfig;
  agentModels?: AgentModelsConfig;
  agentInstructions?: AgentInstructionsConfig;
  sessionService?: InMemorySessionService;
  sessionId?: string;
  userId?: string;
  appName?: string;
  onEvent?: (event: Event) => void;
}

export async function runADKStoryPipeline(options: RunADKPipelineOptions) {
  const modelName = options.modelName || DEFAULT_MODEL;
  const { pipeline, keysInUse, modelsInUse } = buildStoryProductionPipeline(
    modelName,
    options.agentKeys,
    options.agentModels,
    options.agentInstructions
  );

  const sessionService = options.sessionService || new InMemorySessionService();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const userId = options.userId || "jarvis_user";
  const appName = options.appName || "JarvisStoryADK";

  await sessionService.createSession({
    appName,
    userId,
    sessionId
  });

  const runner = new Runner({
    appName,
    agent: pipeline,
    sessionService
  });

  console.log(`[Google ADK Pipeline] Initializing ADK Runner for session: ${sessionId}`);
  console.log(`[Google ADK Pipeline] Models in use:`, modelsInUse);
  console.log(`[Google ADK Pipeline] Dedicated API Keys per agent:`, keysInUse);

  const eventStream = runner.runAsync({
    userId,
    sessionId,
    newMessage: {
      role: "user",
      parts: [{ text: options.userPrompt }]
    }
  });

  const outputEvents: Event[] = [];
  let finalResponseText = "";

  for await (const event of eventStream) {
    outputEvents.push(event);
    if (options.onEvent) {
      options.onEvent(event);
    }
    if (event.content && event.content.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          finalResponseText += part.text + "\n";
        }
      }
    }
  }

  return {
    sessionId,
    appName,
    modelUsed: modelName,
    modelsInUse,
    keysInUse,
    finalResponseText: finalResponseText.trim(),
    eventCount: outputEvents.length,
    events: outputEvents
  };
}
