import { GoogleGenAI } from "@google/genai";

import { AGENT_A_SYSTEM_INSTRUCTION, AGENT_B_SYSTEM_INSTRUCTION, AGENT_C_SYSTEM_INSTRUCTION, AGENT_C_FIRST_PASS, AGENT_C_FINAL_AUDIT } from "./instruction";
import { loadAgentConfigs, saveAgentConfigs } from "./agentConfigManager";

import * as fs from "fs";
import * as path from "path";

export const NEURAL_NODES = [
  "AIzaSyBqtio3nymw7gkRXa0sUC0nCB9GEyxRHtc",
  "AIzaSyAmTIhQLjiG2UGUIKuIJ8lEuy-33M6EsXg"
];
export let activeNodeIndex = 0;
export let isPipelineStopped = false;

export function setPipelineStopped(val: boolean) {
  isPipelineStopped = val;
  console.log(`[Pipeline Control] isPipelineStopped set to: ${val}`);
}

export function rotateNeuralNode() {
  activeNodeIndex = (activeNodeIndex + 1) % NEURAL_NODES.length;
  console.log(`[Neural Pool] Rotated active node to index: ${activeNodeIndex}`);
}

const MEMORY_FILE = path.join(process.cwd(), "server", "agent_memory.json");

function loadMemory(): Record<string, any> {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load agent memory:", err);
  }
  return { agentA: [], agentB: [], jarvis_sessions: {} };
}

function saveMemory(mem: Record<string, any>) {
  try {
    const parentDir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save agent memory:", err);
  }
}

// Simple history per agent ID to maintain conversation context across reboots.
export const systemMemory = loadMemory();

export function clearSubAgent(sessionId?: string) {
  if (sessionId && systemMemory.jarvis_sessions && systemMemory.jarvis_sessions[sessionId]) {
    systemMemory.jarvis_sessions[sessionId] = [];
  }
  systemMemory.agentA = [];
  systemMemory.agentB = [];
  systemMemory.agentC = [];
  saveMemory(systemMemory);
}

export function saveSystemMemory() {
  saveMemory(systemMemory);
}

export async function processSessionEndLogAndSave(sessionId: string) {
  // Disabled as per user request to revoke session MD file creation.
  return;
}

export async function chatWithSubAgent(targetAgentId: string, message: string, apiKey: string, onChunk?: (text: string) => void): Promise<string> {
  const configs = loadAgentConfigs();
  const agentKey = targetAgentId as "agentA" | "agentB" | "agentC";
  const agentConfig = configs[agentKey];

  if (!agentConfig) {
    throw new Error(`Agent ${targetAgentId} is not registered in the system.`);
  }

  if (!agentConfig.enabled) {
    throw new Error(`Agent [${targetAgentId}] is currently powered down (disabled). Please execute tool update_agent_configuration to enable them if you desire services.`);
  }

  const modelToUse = agentConfig.model || "gemini-3.1-flash-lite";

  // Initialize context if it was cleared
  if (!systemMemory[targetAgentId]) {
    systemMemory[targetAgentId] = [];
  }

  // Record incoming message from Jarvis
  systemMemory[targetAgentId].push({ 
    role: "user", 
    parts: [{ text: `[Message from Jarvis]: ${message}` }] 
  });
  saveMemory(systemMemory);

  const { listFiles, readFile, writeFile } = await import("./../filesystem.ts");
  const { Type } = await import("@google/genai");

  let loopLimit = 3;
  let reply = "No response";

  while (loopLimit > 0) {
    if (isPipelineStopped) {
      console.log(`[chatWithSubAgent] Pipeline stop active at loop start.`);
      return `[SYSTEM ALERT] Execution of background processor ${targetAgentId} was terminated by user request.`;
    }
    loopLimit--;
    let responseStream: any = null;
    
    // NEURAL NODE FAILOVER LOOP
    let poolAttempts = 0;
    while (!responseStream && poolAttempts < NEURAL_NODES.length + 1) {
      let currentKey = process.env.GEMINI_API_KEY || apiKey;
      if (!currentKey) {
        currentKey = NEURAL_NODES[activeNodeIndex];
      }
      const localAi = new GoogleGenAI({ apiKey: currentKey });
      
      let resolvedInstruction = agentConfig.systemInstruction;
      if (resolvedInstruction === "AGENT_A_SYSTEM_INSTRUCTION") resolvedInstruction = AGENT_A_SYSTEM_INSTRUCTION;
      else if (resolvedInstruction === "AGENT_B_SYSTEM_INSTRUCTION") resolvedInstruction = AGENT_B_SYSTEM_INSTRUCTION;
      else if (resolvedInstruction === "AGENT_C_SYSTEM_INSTRUCTION") resolvedInstruction = AGENT_C_SYSTEM_INSTRUCTION;
      else if (resolvedInstruction === "AGENT_C_FIRST_PASS") resolvedInstruction = AGENT_C_FIRST_PASS;
      else if (resolvedInstruction === "AGENT_C_FINAL_AUDIT") resolvedInstruction = AGENT_C_FINAL_AUDIT;

      try {
        responseStream = await localAi.models.generateContentStream({
          model: modelToUse, 
          contents: systemMemory[targetAgentId],
          config: {
            systemInstruction: resolvedInstruction + "\n\nBefore outputting the final script, you MUST outline your logic inside <thinking> tags. Explain why you are choosing certain tags or pauses.\n\nWORKSPACE ACCESS MODULE ON:\nYou have direct access to list, read, and write files in the local workspace via tools. When commanded to write or save files, execute them in parallel and confirm the status to Jarvis.",
            tools: [{
              functionDeclarations: [{
                name: "list_workspace_files",
                description: "List all files present in the local workspace directory.",
                parameters: { type: Type.OBJECT, properties: {} }
              }, {
                name: "read_workspace_file",
                description: "Read the content of a specific file in the workspace.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    filename: { type: Type.STRING, description: "The name of the file to read" }
                  },
                  required: ["filename"]
                }
              }, {
                name: "write_workspace_file",
                description: "Create or write content to a file in the workspace.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    filename: { type: Type.STRING, description: "The name of the file to write" },
                    content: { type: Type.STRING, description: "The content to write to the file" }
                  },
                  required: ["filename", "content"]
                }
              }]
            }]
          }
        });
      } catch (err: any) {
        const errMsg = err?.message || "";
        if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.includes("quota")) {
           console.warn(`[Neural Node Index ${activeNodeIndex}] Exhausted. Rotating keys...`);
           activeNodeIndex = (activeNodeIndex + 1) % NEURAL_NODES.length;
           poolAttempts++;
           
           // Clear API_KEY overrides to strictly use the pool
           delete process.env.GEMINI_API_KEY; 
           apiKey = ""; 
           continue;
        } else {
           throw err; // Stop on Non-429 errors
        }
      }
    }
    
    if (!responseStream) {
      return "429 Error: All limits exhausted for Neural Nodes.";
    }

    let fullText = "";
    let functionCalls: any[] = [];
    let modelTurnContent: any = null;

    for await (const chunk of responseStream) {
       if (isPipelineStopped) {
         console.log(`[chatWithSubAgent] Stream cancelled mid-chunk for agent ${targetAgentId}.`);
         return `[SYSTEM ALERT] Execution of background processor ${targetAgentId} was terminated by user request.`;
       }
       if (chunk.text) {
         fullText += chunk.text;
         if (onChunk) onChunk(chunk.text);
       }
       if (chunk.functionCalls) {
         functionCalls.push(...chunk.functionCalls);
       }
       if (chunk.candidates?.[0]?.content) {
         // Accumulate parts if needed or just use the whole thing at the end
         modelTurnContent = chunk.candidates[0].content;
       }
    }

    if (fullText) {
      systemMemory[targetAgentId].push({ role: "model", parts: [{ text: fullText }] });
    } else if (functionCalls.length > 0 && modelTurnContent) {
      systemMemory[targetAgentId].push(modelTurnContent);
    }

    if (isPipelineStopped) {
      console.log(`[chatWithSubAgent] Pipeline stop active before function calls execution.`);
      return `[SYSTEM ALERT] Execution of background processor ${targetAgentId} was terminated by user request.`;
    }

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses: any[] = [];
      for (const call of functionCalls) {
        if (call.name === "write_workspace_file") {
          const { filename, content } = call.args as any;
          console.log(`[Sub-Agent ${targetAgentId} ToolCall] write_workspace_file: ${filename}`);
          try {
            await writeFile(filename, content);
            functionResponses.push({
              name: "write_workspace_file",
              response: { status: "success" }
            });
          } catch (err: any) {
            functionResponses.push({
              name: "write_workspace_file",
              response: { error: err.message }
            });
          }
        } else if (call.name === "list_workspace_files") {
          console.log(`[Sub-Agent ${targetAgentId} ToolCall] list_workspace_files`);
          try {
            const files = await listFiles(".");
            functionResponses.push({
              name: "list_workspace_files",
              response: { files: files.map(f => f.name) }
            });
          } catch (err: any) {
            functionResponses.push({
              name: "list_workspace_files",
              response: { error: err.message }
            });
          }
        } else if (call.name === "read_workspace_file") {
          const { filename } = call.args as any;
          console.log(`[Sub-Agent ${targetAgentId} ToolCall] read_workspace_file: ${filename}`);
          try {
            const fileContent = await readFile(filename);
            functionResponses.push({
              name: "read_workspace_file",
              response: { content: fileContent }
            });
          } catch (err: any) {
            functionResponses.push({
              name: "read_workspace_file",
              response: { error: err.message }
            });
          }
        }
      }

      systemMemory[targetAgentId].push({
        role: "user",
        parts: functionResponses.map((resp, idx) => ({
          functionResponse: {
            name: resp.name,
            id: functionCalls[idx].id,
            response: resp.response
          }
        }))
      });
      saveMemory(systemMemory);
    } else {
      reply = fullText || "No response";
      break;
    }
  }

  saveMemory(systemMemory);
  return reply;
}
