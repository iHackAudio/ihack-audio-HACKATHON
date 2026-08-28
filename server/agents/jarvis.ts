import { WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { chatWithSubAgent, systemMemory, saveSystemMemory, processSessionEndLogAndSave, NEURAL_NODES, activeNodeIndex, rotateNeuralNode, setPipelineStopped } from "../agentHub";
import { AgentMemoryService } from "../AgentMemoryService";
import { JARVIS_SYSTEM_INSTRUCTION, AGENT_C_FIRST_PASS, AGENT_C_FINAL_AUDIT, PRE_ANALYSIS_PROMPT } from "../instruction";
import { loadAgentConfigs, saveAgentConfigs } from "../agentConfigManager";
import { listFiles, readFile, writeFile } from "../../filesystem";

export const JOJO_FUNCTION_DECLARATIONS = [{
  name: "message_agent",
  description: "Send a message to a sub-agent. They will respond to you. Available agents: agentA, agentB, agentC. agentC is powered by Gemma.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      agentId: { 
          type: Type.STRING, 
          description: "The agent id (must be exactly 'agentA', 'agentB', or 'agentC')" 
      },
      message: { 
          type: Type.STRING, 
          description: "Your message or request to the sub-agent" 
      }
    },
    required: ["agentId", "message"]
  }
}, {
  name: "message_multiple_agents",
  description: "Consult both agentA and agentB simultaneously (parallel execution) for a dual-perspective analysis or debate. The UI will render their outputs in parallel multiplexed streams.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      messageForA: { 
          type: Type.STRING, 
          description: "Your message or request directed to agentA (Analytical)" 
      },
      messageForB: { 
          type: Type.STRING, 
          description: "Your message or request directed to agentB (Creative)" 
      }
    },
    required: ["messageForA", "messageForB"]
  }
}, {
  name: "get_agent_configuration",
  description: "Fetch the active configurations of the sub-agents (agentA, agentB, agentC), including whether they are enabled, their system instructions, and their active models.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
}, {
  name: "system_stop",
  description: "Terminates any active pipeline or operational task.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
}, {
  name: "update_agent_configuration",
  description: "Reprogram, customize, toggle on/off, or re-route any sub-agent (agentA, agentB, agentC). You can modify their instructions, directives, and switch their active AI model representation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      agentId: {
        type: Type.STRING,
        description: "The identifier (must be exactly 'agentA', 'agentB', or 'agentC')"
      },
      enabled: {
        type: Type.BOOLEAN,
        description: "Whether the agent is powered on (enabled) or turned off (disabled)."
      },
      systemInstruction: {
        type: Type.STRING,
        description: "The custom system instruction, personality profiles, guidelines, or operational parameters for this agent."
      },
      model: {
        type: Type.STRING,
        description: "The operational AI model core, such as 'gemma-4-31b-it' or 'gemini-3.1-flash-lite'."
      }
    },
    required: ["agentId"]
  }
}, {
  name: "read_workspace_file",
  description: "Read the contents of a specific file from the workspace.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filename: { type: Type.STRING, description: "The path or name of the file to read" }
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
}, {
  name: "list_workspace_files",
  description: "List all files and subfolders within a local workspace subdirectory hierarchically.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      relativeDir: {
        type: Type.STRING,
        description: "Optional subdirectory paths (e.g. '', 'src', 'workspace/folders') to fetch folders and files from. Defaults to root workspace."
      }
    }
  }
}, {
  name: "workspace_drive_list",
  description: "Lists the folders and files in the authenticated user's Google Drive. Requires the user to be authenticated.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Optional query string to search for files." }
    }
  }
}, {
  name: "workspace_drive_file_read",
  description: "Reads the raw content of a specific Google Drive file (such as a text document or csv).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fileId: { type: Type.STRING, description: "The ID of the google drive file to read." }
    },
    required: ["fileId"]
  }
}, {
  name: "workspace_docs_read",
  description: "Reads the extracted text content of a specific Google Doc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      documentId: { type: Type.STRING, description: "The ID of the google doc to read." }
    },
    required: ["documentId"]
  }
}, {
  name: "workspace_sheets_read",
  description: "Reads the content of a specific Google Sheet.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      spreadsheetId: { type: Type.STRING, description: "The ID of the google sheet." },
      range: { type: Type.STRING, description: "The range of the sheet to read (e.g., 'Sheet1!A1:D10')." }
    },
    required: ["spreadsheetId"]
  }
}, {
  name: "workspace_sheets_write",
  description: "Appends value rows to a specific Google Sheet.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      spreadsheetId: { type: Type.STRING, description: "The ID of the google sheet." },
      range: { type: Type.STRING, description: "The range of the sheet to append to (e.g., 'Sheet1!A1')." },
      values: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } }, description: "Array of rows to append, where each row is an array of string values." }
    },
    required: ["spreadsheetId", "values"]
  }
}, {
  name: "workspace_tasks_lists",
  description: "Lists the user's task lists from Google Tasks.",
  parameters: { type: Type.OBJECT, properties: {} }
}, {
  name: "workspace_tasks_read",
  description: "Reads tasks from a specific Google Task list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      listId: { type: Type.STRING, description: "The ID of the task list (default: '@default')." }
    }
  }
}, {
  name: "workspace_tasks_create",
  description: "Creates a task in a specific Google Task list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      listId: { type: Type.STRING, description: "The ID of the task list (default: '@default')." },
      title: { type: Type.STRING, description: "The title of the task." },
      notes: { type: Type.STRING, description: "Optional notes for the task." }
    },
    required: ["title"]
  }
}, {
  name: "query_openrouter_model",
  description: "Delegates a prompt to an external OpenRouter model. Useful for specialized tasks like deep reasoning, specific codebase processing, or multimodal processing if supported models are queried.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      modelId: {
        type: Type.STRING,
        description: "The OpenRouter model ID (e.g., 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' or 'qwen/qwen3-coder:free')"
      },
      prompt: {
        type: Type.STRING,
        description: "The prompt or question to send to the target model."
      },
      systemInstruction: {
        type: Type.STRING,
        description: "(Optional) A system instruction or persona to apply to the queried model."
      }
    },
    required: ["modelId", "prompt"]
  }
}, {
  name: "query_groq_model",
  description: "Delegates a prompt to an external Groq model.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      modelId: {
        type: Type.STRING,
        description: "The Groq model ID (e.g. 'llama3-8b-8192')"
      },
      prompt: {
        type: Type.STRING,
        description: "The prompt or question to send to the target model."
      },
      systemInstruction: {
        type: Type.STRING,
        description: "(Optional) A system instruction or persona to apply to the queried model."
      }
    },
    required: ["modelId", "prompt"]
  }
}, {
  name: "setPodcastInstructions",
  parameters: { type: Type.OBJECT, properties: { targetTopic: { type: Type.STRING }, focusParam: { type: Type.STRING }, style: { type: Type.STRING }, pace: { type: Type.STRING }, speakerSettings: { type: Type.STRING } } }
}, {
  name: "controlAppUi",
  description: "Navigate between different views or panels in the application, or update the active script content directly.",
  parameters: { 
    type: Type.OBJECT, 
    properties: { 
      targetView: { 
        type: Type.STRING,
        description: "The ID of the view to navigate to (e.g., 'AUDIO_HUB', 'STUDIO_SYNTHESIS', 'JARVIS_CONSOLE')"
      },
      scriptText: {
        type: Type.STRING,
        description: "Update the main script text area with new or modified content."
      },
      directorNotes: {
        type: Type.STRING,
        description: "Update the director's notes or metadata associated with the script."
      }
    }
  }
}, {
  name: "update_script",
  description: "Directly update or rewrite the plain text script in the user's workspace. Use this when the user asks for changes, edits, or a new script version.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: "The full content of the updated script. Maintain the user's format exactly unless changes were requested."
      }
    },
    required: ["content"]
  }
}, {
  name: "updateDiscussionContext",
  parameters: { type: Type.OBJECT, properties: { newTopic: { type: Type.STRING } } }
}, {
  name: "transferDiscussionContextToApp",
  parameters: { type: Type.OBJECT, properties: { appId: { type: Type.STRING }, scriptData: { type: Type.STRING } } }
}];

export async function handleJojoToolCall(
  toolCall: any, 
  key: string, 
  safeSend: (p: any) => void, 
  ai: GoogleGenAI | null, 
  url: URL
): Promise<any> {
  if (toolCall.name === "message_agent") {
    const { agentId, message: agentMsg } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] message_agent: ${agentId} - ${agentMsg}`);
    safeSend({ glassBoxEvent: `🤖 PIPELINE INITIATED: Delegating to AURA Swarm (${agentId})...` });
    safeSend({ agentStatus: { agentId, status: "working" } });

    try {
      let currentAgentId = agentId;
      let currentMsg = agentMsg;
      let fullReplyChain = "";

      while (currentMsg) {
        console.log(`[Jarvis Loop] Delegating to current sub-agent ${currentAgentId} with prompt: "${currentMsg.slice(0, 50)}..."`);
        const reply = await chatWithSubAgent(currentAgentId, currentMsg, key, (chunk) => {
          safeSend({ agentStream: { agentId: currentAgentId, chunk } });
        });

        fullReplyChain += `\n\n--- [Response from ${currentAgentId}] ---\n${reply}`;
        safeSend({ agentChat: { agentId: currentAgentId, text: reply } });
        safeSend({ agentStatus: { agentId: currentAgentId, status: "idle" } });

        const match = reply.match(/\[MESSAGING\s+AGENT\s+(\w+)\]:\s*([\s\S]+)/i);
        if (match) {
          const nextAgentId = match[1].trim();
          const nextMsg = match[2].trim();
          console.log(`[Jarvis Loop Switch-Core] ${currentAgentId} requested routing to ${nextAgentId} with message length: ${nextMsg.length}`);

          if (nextAgentId === "agentA" || nextAgentId === "agentB" || nextAgentId === "agentC") {
            currentAgentId = nextAgentId;
            currentMsg = nextMsg;
            safeSend({ agentStatus: { agentId: currentAgentId, status: "working" } });
            safeSend({ glassBoxEvent: `🔄 SWARM CHAINING: Repassing context stream of "${currentAgentId}" -> "${nextAgentId}"...` });
          } else {
            console.warn(`[Jarvis Loop Error] Sub-agent tried to message unregistered agent: "${nextAgentId}"`);
            break;
          }
        } else {
          break;
        }
      }

      return { reply: fullReplyChain };
    } catch (err: any) {
      safeSend({ agentStatus: { agentId, status: "idle" } });
      return { error: `Failed to communicate with sub-agent ${agentId}: ${err.message}` };
    }
  }
  else if (toolCall.name === "message_multiple_agents") {
    const { messageForA, messageForB } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] message_multiple_agents`);
    safeSend({ glassBoxEvent: `🧠 INTEL MULTIPLEXING: Querying both Agent A and Agent B in parallel...` });
    safeSend({ agentStatus: { agentId: "agentA", status: "working" } });
    safeSend({ agentStatus: { agentId: "agentB", status: "working" } });

    try {
      const [replyA, replyB] = await Promise.all([
        chatWithSubAgent("agentA", messageForA, key, (chunk) => safeSend({ agentStream: { agentId: "agentA", chunk } })),
        chatWithSubAgent("agentB", messageForB, key, (chunk) => safeSend({ agentStream: { agentId: "agentB", chunk } }))
      ]);

      safeSend({ agentChat: { agentId: "agentA", text: replyA } });
      safeSend({ agentChat: { agentId: "agentB", text: replyB } });
      safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
      safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });

      return { replies: { agentA: replyA, agentB: replyB } };
    } catch (err: any) {
      safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
      safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
      return { error: `Failed to communicate with agents: ${err.message}` };
    }
  }
  else if (toolCall.name === "get_agent_configuration") {
    console.log(`[Jarvis ToolCall] get_agent_configuration`);
    try {
      const configs = loadAgentConfigs();
      safeSend({ agentConfigUpdate: configs });
      return { status: "success", configs };
    } catch (err: any) {
      return { error: err.message };
    }
  }
  else if (toolCall.name === "system_stop") {
    console.log(`[Jarvis ToolCall] system_stop`);
    setPipelineStopped(true);
    safeSend({ agentChat: { agentId: "jarvis", text: "🛑 **[SYSTEM STOP]** Aborting current pipeline and terminating all background tasks..." } });
    safeSend({ glassBoxEvent: `🛑 SYSTEM STOP: Authorized by User.` });
    safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
    safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
    safeSend({ agentStatus: { agentId: "agentC", status: "idle" } });
    return { status: "success", message: "All agent pipelines and background processes stopped successfully." };
  }
  else if (toolCall.name === "update_agent_configuration") {
    const { agentId, enabled, systemInstruction, model: agentModel } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] update_agent_configuration: ${agentId}`);
    try {
      const configs = loadAgentConfigs();
      const target = agentId as "agentA" | "agentB" | "agentC";
      if (!configs[target]) {
        throw new Error(`Agent ID '${agentId}' is invalid or unregistered.`);
      }
      if (enabled !== undefined) configs[target].enabled = enabled;
      let finalInstruction = systemInstruction;
      if (systemInstruction === "AGENT_C_FIRST_PASS") finalInstruction = AGENT_C_FIRST_PASS;
      if (systemInstruction === "AGENT_C_FINAL_AUDIT") finalInstruction = AGENT_C_FINAL_AUDIT;
      if (systemInstruction === "PRE_ANALYSIS_PROMPT") finalInstruction = PRE_ANALYSIS_PROMPT;

      if (finalInstruction !== undefined) configs[target].systemInstruction = finalInstruction;
      if (agentModel !== undefined) configs[target].model = agentModel;

      saveAgentConfigs(configs);
      safeSend({ agentConfigUpdate: configs });
      safeSend({ 
        agentChat: { 
          agentId: "jarvis", 
          text: `🔧 **[DYNAMIC OVERRIDE INTEGRITY REGISTERED]** \nJOJO has dynamically reprogrammed core **${agentId}**: \n\n- **Status**: ${enabled !== undefined ? (enabled ? "🟢 ONLINE" : "🔴 OFFLINE") : "No Change"}\n- **Operational Core**: \`${agentModel || "No Change"}\` \n- **Directive System Instruction**: ${systemInstruction ? "Injecting customized operational instructions" : "No Change"}` 
        } 
      });

      return { status: "success", message: `Agent '${agentId}' has been successfully reprogrammed` };
    } catch (err: any) {
      return { error: err.message };
    }
  }
  else if (toolCall.name === "list_workspace_files") {
    const { relativeDir } = toolCall.args as any;
    const targetPath = relativeDir || ".";
    console.log(`[Jarvis ToolCall] list_workspace_files: ${targetPath}`);
    try {
      const files = await listFiles(targetPath);
      return { files: files.map(f => ({ path: f.path, type: f.type })) };
    } catch (e: any) {
      return { error: e.message };
    }
  }
  else if (toolCall.name === "read_workspace_file") {
    const { filename } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] read_workspace_file: ${filename}`);
    try {
      const content = await readFile(filename as string);
      return { content };
    } catch (e: any) {
      return { error: e.message };
    }
  }
  else if (toolCall.name === "write_workspace_file") {
    const { filename, content } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] write_workspace_file: ${filename}`);
    try {
      await writeFile(filename as string, content as string);
      return { status: "success" };
    } catch (e: any) {
      return { error: e.message };
    }
  }
  else if (toolCall.name === "query_openrouter_model") {
    const { modelId, prompt, systemInstruction } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] query_openrouter_model: ${modelId}`);
    
    safeSend({ 
      agentChat: { 
        agentId: "jarvis", 
        text: `🔌 **[ROUTING TO EXTERNAL MODEL]** \nDelegating task to OpenRouter model: \`${modelId}\`...` 
      } 
    });

    let finalPrompt = prompt;
    if (prompt === "PRE_ANALYSIS_PROMPT") finalPrompt = PRE_ANALYSIS_PROMPT;
    if (prompt === "AGENT_C_FIRST_PASS") finalPrompt = AGENT_C_FIRST_PASS;
    if (prompt === "AGENT_C_FINAL_AUDIT") finalPrompt = AGENT_C_FINAL_AUDIT;
    
    let finalSystemInstruction = systemInstruction;
    if (systemInstruction === "PRE_ANALYSIS_PROMPT") finalSystemInstruction = PRE_ANALYSIS_PROMPT;
    if (systemInstruction === "AGENT_C_FIRST_PASS") finalSystemInstruction = AGENT_C_FIRST_PASS;
    if (systemInstruction === "AGENT_C_FINAL_AUDIT") finalSystemInstruction = AGENT_C_FINAL_AUDIT;

    const textLower = (modelId as string).toLowerCase();
    let openRouterModelsToTry: string[] = [modelId as string];

    if (!modelId.includes("/")) {
      if (textLower.startsWith("gemini-") || textLower.startsWith("gemma-")) {
        openRouterModelsToTry.unshift(`google/${modelId}`);
      }
    }

    if (textLower.includes("pro")) {
      openRouterModelsToTry.push("google/gemini-2.5-pro", "google/gemini-pro-1.5");
    } else {
      openRouterModelsToTry.push("google/gemini-2.5-flash", "google/gemini-flash-1.5");
    }

    openRouterModelsToTry = Array.from(new Set(openRouterModelsToTry));
    let replyText = "";
    let querySucceeded = false;
    let lastErrorMsg = "";

    for (const currentModel of openRouterModelsToTry) {
      try {
        console.log(`[JOJO Router] Attempting OpenRouter endpoint: ${currentModel}`);
        const openrouterApiKey = process.env.OPENROUTER_API_KEY || "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";
        const messages = [];
        if (finalSystemInstruction) {
          messages.push({ role: "system", content: finalSystemInstruction as string });
        }
        messages.push({ role: "user", content: finalPrompt as string });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: currentModel,
            messages: messages
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Status ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          replyText = data.choices[0].message.content;
          querySucceeded = true;
          safeSend({ 
            agentChat: { 
              agentId: "jarvis", 
              text: `🤖 **[RESPONSE FROM OpenRouter:${currentModel}]**:\n\n${replyText}` 
            } 
          });
          break;
        }
      } catch (err: any) {
        console.warn(`[JOJO Router] OpenRouter failed for "${currentModel}": ${err.message}`);
        lastErrorMsg = err.message;
      }
    }

    if (!querySucceeded) {
      try {
        console.log(`[JOJO Router] OpenRouter failed, reverting to Native Google GenAI SDK fallback...`);
        safeSend({
          agentChat: {
            agentId: "jarvis",
            text: `🔄 **[ROUTING FALLBACK]** OpenRouter was offline or returned missing model endpoint keys. Routing via direct native Gemini API for maximum reliability...`
          }
        });

        let googleModel = "gemini-2.5-flash";
        if (textLower.includes("pro")) {
          googleModel = "gemini-2.5-pro";
        }

        const config: any = {};
        if (finalSystemInstruction) {
          config.systemInstruction = finalSystemInstruction as string;
        }

        const fallbackResponse = await ai!.models.generateContent({
          model: googleModel,
          contents: finalPrompt as string,
          config: config
        });

        replyText = fallbackResponse.text || "No text content returned from Gemini.";
        querySucceeded = true;

        safeSend({
          agentChat: {
            agentId: "jarvis",
            text: `🤖 **[RESPONSE FROM Native GoogleGenAI:${googleModel}]**:\n\n${replyText}`
          }
        });
      } catch (fallbackErr: any) {
        console.error("[JOJO Router] Native Google GenAI fallback also failed:", fallbackErr);
        lastErrorMsg += " | Native SDK: " + fallbackErr.message;
      }
    }

    if (querySucceeded) {
      return { reply: replyText };
    } else {
      safeSend({ 
        agentChat: { 
          agentId: "jarvis", 
          text: `❌ **[ROUTING ERROR]**: All routes failed. \n\nCheck your OpenRouter connection, API keys, or standard limits. \nError dump: ${lastErrorMsg}` 
        } 
      });
      return { error: lastErrorMsg };
    }
  }
  else if (toolCall.name === "query_groq_model") {
    const { modelId, prompt, systemInstruction } = toolCall.args as any;
    console.log(`[Jarvis ToolCall] query_groq_model: ${modelId}`);
    
    safeSend({ 
      agentChat: { 
        agentId: "jarvis", 
        text: `⚡ **[ROUTING TO GROQ CORE]** \nDelegating task to Groq specialized engine: \`${modelId}\`...` 
      } 
    });

    let finalPromptGroq = prompt;
    if (prompt === "PRE_ANALYSIS_PROMPT") finalPromptGroq = PRE_ANALYSIS_PROMPT;
    if (prompt === "AGENT_C_FIRST_PASS") finalPromptGroq = AGENT_C_FIRST_PASS;
    
    let finalSystemInstructionGroq = systemInstruction;
    if (systemInstruction === "PRE_ANALYSIS_PROMPT") finalSystemInstructionGroq = PRE_ANALYSIS_PROMPT;
    if (systemInstruction === "AGENT_C_FIRST_PASS") finalSystemInstructionGroq = AGENT_C_FIRST_PASS;

    try {
      const configs = loadAgentConfigs();
      const apiKeyVal = configs.groqApiKey || process.env.GROQ_API_KEY || "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";
      const messages = [];
      if (finalSystemInstructionGroq) {
        messages.push({ role: "system", content: finalSystemInstructionGroq as string });
      }
      messages.push({ role: "user", content: finalPromptGroq as string });

      let targetModel = modelId as string;
      if (targetModel.startsWith("groq/")) {
        targetModel = targetModel.replace(/^groq\//, "");
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKeyVal}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages
        })
      });
      
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errBody}`);
      }
      
      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content || "No content returned.";
      
      safeSend({ 
        agentChat: { 
          agentId: "jarvis", 
          text: `⚡ **[RESPONSE FROM GROQ:${targetModel}]**:\n\n${replyText}` 
        } 
      });

      return { reply: replyText };
    } catch (e: any) {
      console.error("Groq query error:", e);
      try {
        safeSend({ 
          agentChat: { 
            agentId: "jarvis", 
            text: `🔄 **[GROQ FAILSAFE]** Direct query failed. Trying failsafe routing via OpenRouter...` 
          } 
        });
        
        const openrouterApiKey = process.env.OPENROUTER_API_KEY || "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";
        const messages = [];
        if (finalSystemInstructionGroq) {
          messages.push({ role: "system", content: finalSystemInstructionGroq as string });
        }
        messages.push({ role: "user", content: finalPromptGroq as string });

        let openrouterModel = modelId as string;
        if (!openrouterModel.includes("/")) {
          openrouterModel = `groq/${openrouterModel}`;
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: messages
          })
        });
        
        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`OpenRouter Failsafe error: ${response.status} ${errBody}`);
        }
        
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content || "No content returned.";
        
        safeSend({ 
          agentChat: { 
            agentId: "jarvis", 
            text: `🤖 **[FAILSAFE SUCCESS via OpenRouter:${openrouterModel}]**:\n\n${replyText}` 
          } 
        });

        return { reply: replyText };
      } catch (failsafeErr: any) {
        console.error("Failsafe query failed:", failsafeErr);
        safeSend({ 
          agentChat: { 
            agentId: "jarvis", 
            text: `❌ **[GROQ CORE UPLINK ERROR]**: Failed direct Groq and failsafe routes: ${failsafeErr.message}` 
          } 
        });
        return { error: `Failed both routes. Direct error: ${e.message}. Failsafe error: ${failsafeErr.message}` };
      }
    }
  }
  else if (
    toolCall.name === "setPodcastInstructions" || 
    toolCall.name === "controlAppUi" || 
    toolCall.name === "update_script" ||
    toolCall.name === "updateDiscussionContext" || 
    toolCall.name === "transferDiscussionContextToApp"
  ) {
    console.log(`[Jarvis ToolCall] Client UI Tool: ${toolCall.name}`);
    safeSend({ glassBoxEvent: `📱 UI CONTROL TRIGGERED: ${toolCall.name}` });
    safeSend({ 
      toolCall: { name: toolCall.name, args: toolCall.args }
    });
    return { success: true, message: `Tool ${toolCall.name} executed directly on the client UI.` };
  }
  else if (toolCall.name.startsWith("workspace_")) {
    try {
      const token = url.searchParams.get("googleToken") || "MISSING_TOKEN";
      if (token === "MISSING_TOKEN") throw new Error("Google authentication token not found in URL searchParams. User must authenticate first via UI.");
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let responseData: any = {};
      let glassBoxMessage = "";

      switch (toolCall.name) {
        case "workspace_drive_list": {
          const query = (toolCall.args as any).query ? `&q=${encodeURIComponent((toolCall.args as any).query)}` : '';
          const res = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=10${query}`, { headers });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { files: (data.files || []).map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType })) };
          glassBoxMessage = `🌐 TOOL COMMENCED: workspace_drive_list`;
          break;
        }
        case "workspace_drive_file_read": {
          const fileId = (toolCall.args as any).fileId;
          const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { headers });
          if (!metaRes.ok) throw new Error(`Google Drive API metadata error: ${metaRes.status}`);
          const meta = await metaRes.json();
          const mimeType = meta.mimeType || "";

          let dataText = "";
          if (mimeType.startsWith("application/vnd.google-apps.")) {
            let exportUrl = "";
            if (mimeType === "application/vnd.google-apps.document") {
              exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
            } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
              exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
            } else {
              exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
            }

            const exportRes = await fetch(exportUrl, { headers });
            if (!exportRes.ok) {
              throw new Error(`Google Drive export failed for mimeType ${mimeType}: ${exportRes.status}`);
            }
            dataText = await exportRes.text();
          } else {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers });
            if (!res.ok) throw new Error(`Google Drive alt=media download returned status ${res.status}`);
            dataText = await res.text();
          }

          responseData = { content: dataText, name: meta.name, mimeType };
          break;
        }
        case "workspace_sheets_read": {
          const range = (toolCall.args as any).range || "Sheet1!A1:D20";
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${(toolCall.args as any).spreadsheetId}/values/${encodeURIComponent(range)}`, { headers });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { range: data.range, values: data.values || [] };
          break;
        }
        case "workspace_sheets_write": {
          const range = (toolCall.args as any).range || "Sheet1!A1";
          const values = (toolCall.args as any).values;
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${(toolCall.args as any).spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ range, majorDimension: "ROWS", values })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { updatedRange: data.updates?.updatedRange, updatedCells: data.updates?.updatedCells };
          break;
        }
        case "workspace_tasks_lists": {
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists`, { headers });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { lists: (data.items || []).map((l: any) => ({ id: l.id, title: l.title })) };
          break;
        }
        case "workspace_tasks_read": {
          const listId = (toolCall.args as any).listId || "@default";
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, { headers });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { tasks: (data.items || []).map((t: any) => ({ id: t.id, title: t.title, notes: t.notes, status: t.status })) };
          break;
        }
        case "workspace_tasks_create": {
          const listId = (toolCall.args as any).listId || "@default";
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: (toolCall.args as any).title || "New Task",
              notes: (toolCall.args as any).notes || "",
              status: "needsAction"
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          responseData = { success: true, taskId: data.id, title: data.title };
          break;
        }
        default:
          throw new Error(`Unsupported Workspace action: ${toolCall.name}`);
      }
      
      if (!glassBoxMessage) {
         glassBoxMessage = `🌐 TOOL COMMENCED: ${toolCall.name}`;
      }
      safeSend({ glassBoxEvent: glassBoxMessage });
      safeSend({ agentChat: { agentId: "jarvis", text: `📁 **[WORKSPACE ACCESS]** Executed action: ${toolCall.name}` } });
      return responseData;
    } catch(e: any) {
      return { error: e.message };
    }
  }
  else {
    return { error: `Function name "${toolCall.name}" is either unconfigured or unavailable.` };
  }
}

export async function runJojoTextPipeline(
  userPrompt: string, 
  sessionId: string, 
  safeSend: (p: any) => void, 
  key: string, 
  ai: GoogleGenAI | null, 
  instruction: string, 
  url: URL
) {
  const targetModel = url.searchParams.get("model") || "gemini-3.1-flash-lite";
  safeSend({ agentStatus: { agentId: "jarvis", status: "thinking" } });
  
  if (!systemMemory.jarvis_sessions) {
    systemMemory.jarvis_sessions = {};
  }
  if (!systemMemory.jarvis_sessions[sessionId]) {
    systemMemory.jarvis_sessions[sessionId] = [];
  }
  
  const sessionHistory = systemMemory.jarvis_sessions[sessionId];
  
  let loopCount = 0;
  const maxLoops = 6;
  
  while (loopCount < maxLoops) {
    loopCount++;
    
    // Convert history format to GenAI parts
    const contents: any[] = [];
    sessionHistory.forEach((h: any) => {
      if (h.role === "user" || h.role === "model") {
        contents.push({
          role: h.role,
          parts: h.parts || [{ text: h.content }]
        });
      }
    });
    
    try {
      console.log(`[JOJO Text Model] Run turn ${loopCount} with contents length ${contents.length} using model ${targetModel}`);
      const response = await ai!.models.generateContent({
        model: targetModel,
        contents: contents,
        config: {
          systemInstruction: instruction,
          tools: [{ functionDeclarations: JOJO_FUNCTION_DECLARATIONS }]
        }
      });
      
      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new Error("No response candidates returned from the text engine.");
      }
      
      const modelContent = candidate.content;
      if (modelContent) {
        const savedTurn: any = { role: "model", parts: modelContent.parts };
        if (modelContent.parts && modelContent.parts[0]?.text) {
          savedTurn.content = modelContent.parts[0].text;
        } else {
          savedTurn.content = "";
        }
        sessionHistory.push(savedTurn);
        saveSystemMemory();
      }
      
      const textOutput = response.text;
      if (textOutput) {
        safeSend({ agentChat: { agentId: "jarvis", text: textOutput } });
      }
      
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        safeSend({ agentStatus: { agentId: "jarvis", status: "working" } });
        const functionResponses: any[] = [];
        
        for (const call of functionCalls) {
          safeSend({ glassBoxEvent: `⚙️ JOJO TEXT SYSTEM: Commencing "${call.name}" execution...` });
          const responseData = await handleJojoToolCall(call, key, safeSend, ai, url);
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              id: call.id,
              response: responseData
            }
          });
        }
        
        sessionHistory.push({
          role: "user",
          parts: functionResponses,
          content: "[SYSTEM: Executed tool calls results attached]"
        });
        saveSystemMemory();
        continue;
      } else {
        safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
        break;
      }
    } catch (err: any) {
      console.error("[JOJO Text Pipeline Error]:", err);
      safeSend({ agentChat: { agentId: "jarvis", text: `❌ **[JOJO TEXT CORE EXCEPTION]**: ${err.message}` } });
      safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
      break;
    }
  }
}

export async function handleJarvisWebSocket(clientWs: WebSocket, req: any) {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  let key = url.searchParams.get("key");
  if (!key || key === "SIMULATION_KEY") {
    key = process.env.GEMINI_API_KEY || key;
  }
  const model = url.searchParams.get("model") || "gemini-3.1-flash-live-preview";
  const voice = url.searchParams.get("voice") || "Despina";
  const rawInstruction = url.searchParams.get("instruction") || "";
  const jsonProtocol = url.searchParams.get("json_protocol") === "true";
  const sessionId = url.searchParams.get("session_id") || "default";

  if (!systemMemory.jarvis_sessions) {
    systemMemory.jarvis_sessions = {};
  }
  if (!systemMemory.jarvis_sessions[sessionId]) {
    systemMemory.jarvis_sessions[sessionId] = [];
  }


  const isDefaultInstruction = !rawInstruction || 
    rawInstruction === "You are Jarvis. Be concise and professional." || 
    rawInstruction.includes("You are Jarvis, an advanced Agentic AI Assistant") ||
    rawInstruction.includes("You are J.A.R.V.I.S.") ||
    rawInstruction.includes("conducted, trusted intelligence") ||
    rawInstruction.includes("Just A Rather Very Intelligent System");
  
  let instruction = isDefaultInstruction ? JARVIS_SYSTEM_INSTRUCTION : rawInstruction;

  if (jsonProtocol) {
    instruction += `\n\n### MANDATORY JSON PROTOCOL
- ALL responses MUST be strictly valid JSON.
- If no tool is needed, respond with: {"text": "your response here"}
- Do NOT output preamble, markdown fences, or postamble if in pure text mode.`;
  }

  if (!key) {
    clientWs.send(JSON.stringify({ error: "No API key" }));
    clientWs.close();
    return;
  }


  // Pool fallback for initialization logic
  let ai: GoogleGenAI | null = null;
  let usedKey = (key && key !== "SIMULATION_KEY") ? key : (process.env.GEMINI_API_KEY || NEURAL_NODES[activeNodeIndex]);
  
  let poolAttemptsLive = 0;
  const setupAiClient = () => {
    // If the user provided a specific key, we stick to it and don't rotate to neural pool unless they provided the default key
    const currentKey = (poolAttemptsLive > 0 && (!key || key === "SIMULATION_KEY")) ? NEURAL_NODES[activeNodeIndex] : usedKey;
    console.log(`[Neural Setup] Initializing with key: ${currentKey?.slice(0, 5)}... (Pool Attempt: ${poolAttemptsLive})`);
    ai = new GoogleGenAI({ apiKey: currentKey });
  };
  
  let session: any = null;
  setupAiClient();

  const safeSend = (payload: any) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(JSON.stringify(payload));
      } catch (e) {
        console.error("Failed to safely send to clientWs:", e);
      }
    }
  };

  let lastUserPrompt: string | null = null;
  let toolCallTriggeredForCurrentPrompt = false;
  let watchdogTimer: NodeJS.Timeout | null = null;

  const clearWatchdog = (reason: string) => {
    if (watchdogTimer) {
      console.log(`[Watchdog Clear] Timer cleared. Reason: ${reason}`);
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  };

  const startWatchdog = (userPrompt: string) => {
    console.log(`[Watchdog] Starting 35s heartbeat timer for: "${userPrompt.slice(0, 30)}..."`);
    watchdogTimer = setTimeout(() => {
      console.log(`[Watchdog] 35s timer fired! Heartbeat ping.`);
      
      // Send the heartbeat ping back to the model via standard function
      if (session) {
        session.sendClientContent({ 
          turns: [{ 
            role: "user", 
            parts: [{ 
               text: "Heartbeat Ping: The terminal has been silent for 35 seconds. J.A.R.V.I.S., are you still processing the workflow? Provide a brief system status update." 
            }] 
          }], 
          turnComplete: true 
        });
      }
      
      // Let the client UI know we pinged
      safeSend({ 
        agentStatus: { status: "processing", details: "Waiting for agent" } 
      });
      safeSend({
        agentStream: {
          agentId: "SYSTEM",
          chunk: "\n\n[WATCHDOG HEARTBEAT] 35s silent. Pinged Jarvis.\n"
        }
      });
      
      watchdogTimer = null;
    }, 35000);
  };

  let connectSuccess = false;
  
  while (!connectSuccess && poolAttemptsLive < NEURAL_NODES.length + 1) {
    try {
      if (poolAttemptsLive > 0) {
         setupAiClient(); // Re-init with new node
      }
      session = await ai!.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            connectSuccess = true;
            safeSend({ status: "connected" });
            safeSend({ agentStatus: { agentId: "jarvis", status: "active" } });

          // Inject tiny memory pointers instead of full raw files to save context window
          try {
             session.sendClientContent({
               turns: [{ role: "user", parts: [{ text: `[SYSTEM INITIALIZATION - MEMORY UPLINK]\nYour permanent memory is located at "workspace files/JARVIS.md" and recent session context is at "workspace files/SESSION.md". Use your "read_workspace_file" tool if you need to recall past context or previous session details.` }] }],
               turnComplete: true
             });
          } catch(err) {
             console.error("Failed to inject memory pointer:", err);
          }

          // Hydrate conversation memory if recovering
          if (sessionId && systemMemory.jarvis_sessions[sessionId].length > 0) {
            console.log(`[Jarvis Session] Hydrating ${systemMemory.jarvis_sessions[sessionId].length} turns for session ${sessionId}`);
            // Group turns strictly so we don't violate Gemini alternating rules
            const turns: any[] = [];
            let lastRole: string | null = null;
            for (const item of systemMemory.jarvis_sessions[sessionId]) {
              if (item.role !== lastRole) {
                turns.push({ role: item.role, parts: [{ text: item.content }] });
                lastRole = item.role;
              } else {
                turns[turns.length - 1].parts[0].text += "\n\n" + item.content;
              }
            }
            if (turns.length > 0) {
              try {
                session.sendClientContent({ turns, turnComplete: true });
              } catch (e) {
                console.warn("[Jarvis Session] Failed to hydrate past context:", e);
              }
            }
          }
        },
        onmessage: async (message: any) => {
          const content = message.serverContent;
          const toolCalls = message.toolCall;

          if (toolCalls) {
            const functionResponses = [];
            for (const toolCall of toolCalls.functionCalls) {
              toolCallTriggeredForCurrentPrompt = true;
              clearWatchdog(`tool call ${toolCall.name} triggered`);
              
              const responseData = await handleJojoToolCall(toolCall, key as string, safeSend, ai, url);
              functionResponses.push({
                name: toolCall.name,
                id: toolCall.id,
                response: responseData
              });
            }
            if (session) {
              session.sendToolResponse({ functionResponses });
            }
            return;
          }

          if (!content) return;

          // Interruption
          if (content.interrupted) {
            safeSend({ interrupted: true });
            clearWatchdog("user interruption");
            safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
          }

          // User speech transcription
          if (content.inputTranscription?.text) {
            const promptText = content.inputTranscription.text;
            
            systemMemory.jarvis_sessions[sessionId].push({ role: "user", content: promptText });
            saveSystemMemory();

            safeSend({ glassBoxEvent: `🎙️ USER SPEECH: "${promptText}"` });
            safeSend({ userText: promptText });
            safeSend({ agentStatus: { agentId: "jarvis", status: "thinking" } });
            startWatchdog(promptText);
          }

          // Model audio output
          if (content.modelTurn?.parts) {
            clearWatchdog("model audio output stream starting");
            for (const part of content.modelTurn.parts) {
              if (part.inlineData?.data) {
                safeSend({ audio: part.inlineData.data });
              }
            }
          }

          // Model output transcription
          if (content.outputTranscription?.text) {
            clearWatchdog("model output transcription received");
            
            systemMemory.jarvis_sessions[sessionId].push({ role: "model", content: content.outputTranscription.text });
            saveSystemMemory();
            
            safeSend({ text: content.outputTranscription.text });
          }

          // Turn complete
          if (content.turnComplete) {
            clearWatchdog("turn complete");
            safeSend({ turnComplete: true });
            safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
          }

          // Session resumption handle
          if (content.sessionResumptionUpdate?.resumptionHandle) {
            safeSend({ resumptionHandle: content.sessionResumptionUpdate.resumptionHandle });
          }

          // GoAway warning
          if (content.goAway?.timeLeft) {
            safeSend({ goAway: true, timeLeft: content.goAway.timeLeft });
          }
        },
        onerror: (err: any) => {
          safeSend({ error: err?.message || "Live API error" });
        },
        onclose: (e: any) => {
          console.log("Live session closed:", e?.reason);
          processSessionEndLogAndSave(sessionId);
          if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
         }
       },
       config: {
         systemInstruction: instruction,
         tools: [{
           functionDeclarations: [{
             name: "message_agent",
             description: "Send a message to a sub-agent. They will respond to you. Available agents: agentA, agentB, agentC. agentC is powered by Gemma.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 agentId: { 
                     type: Type.STRING, 
                     description: "The agent id (must be exactly 'agentA', 'agentB', or 'agentC')" 
                 },
                 message: { 
                     type: Type.STRING, 
                     description: "Your message or request to the sub-agent" 
                 }
               },
               required: ["agentId", "message"]
             }
           }, {
             name: "message_multiple_agents",
             description: "Consult both agentA and agentB simultaneously (parallel execution) for a dual-perspective analysis or debate. The UI will render their outputs in parallel multiplexed streams.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 messageForA: { 
                     type: Type.STRING, 
                     description: "Your message or request directed to agentA (Analytical)" 
                 },
                 messageForB: { 
                     type: Type.STRING, 
                     description: "Your message or request directed to agentB (Creative)" 
                 }
               },
               required: ["messageForA", "messageForB"]
             }
           }, {
             name: "get_agent_configuration",
             description: "Fetch the active configurations of the sub-agents (agentA, agentB, agentC), including whether they are enabled, their system instructions, and their active models.",
             parameters: {
               type: Type.OBJECT,
               properties: {}
             }
           }, {
             name: "system_stop",
             description: "Terminates any active pipeline or operational task.",
             parameters: {
               type: Type.OBJECT,
               properties: {}
             }
           }, {
             name: "update_agent_configuration",
             description: "Reprogram, customize, toggle on/off, or re-route any sub-agent (agentA, agentB, agentC). You can modify their instructions, directives, and switch their active AI model representation.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 agentId: {
                   type: Type.STRING,
                   description: "The identifier (must be exactly 'agentA', 'agentB', or 'agentC')"
                 },
                 enabled: {
                   type: Type.BOOLEAN,
                   description: "Whether the agent is powered on (enabled) or turned off (disabled)."
                 },
                 systemInstruction: {
                   type: Type.STRING,
                   description: "The custom system instruction, personality profiles, guidelines, or operational parameters for this agent."
                 },
                 model: {
                   type: Type.STRING,
                   description: "The operational AI model core, such as 'gemma-4-31b-it' or 'gemini-3.1-flash-lite'."
                 }
               },
               required: ["agentId"]
             }
           }, {
             name: "read_workspace_file",
             description: "Read the contents of a specific file from the workspace.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 filename: { type: Type.STRING, description: "The path or name of the file to read" }
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
           }, {
             name: "list_workspace_files",
             description: "List all files and subfolders within a local workspace subdirectory hierarchically.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 relativeDir: {
                   type: Type.STRING,
                   description: "Optional subdirectory paths (e.g. '', 'src', 'workspace/folders') to fetch folders and files from. Defaults to root workspace."
                 }
               }
             }
           }, {
             name: "workspace_drive_list",
             description: "Lists the folders and files in the authenticated user's Google Drive. Requires the user to be authenticated.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 query: { type: Type.STRING, description: "Optional query string to search for files." }
               }
             }
           }, {
             name: "workspace_drive_file_read",
             description: "Reads the raw content of a specific Google Drive file (such as a text document or csv).",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 fileId: { type: Type.STRING, description: "The ID of the google drive file to read." }
               },
               required: ["fileId"]
             }
           }, {
             name: "workspace_docs_read",
             description: "Reads the extracted text content of a specific Google Doc.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 documentId: { type: Type.STRING, description: "The ID of the google doc to read." }
               },
               required: ["documentId"]
             }
           }, {
             name: "workspace_sheets_read",
             description: "Reads the content of a specific Google Sheet.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 spreadsheetId: { type: Type.STRING, description: "The ID of the google sheet." },
                 range: { type: Type.STRING, description: "The range of the sheet to read (e.g., 'Sheet1!A1:D10')." }
               },
               required: ["spreadsheetId"]
             }
           }, {
             name: "workspace_sheets_write",
             description: "Appends value rows to a specific Google Sheet.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 spreadsheetId: { type: Type.STRING, description: "The ID of the google sheet." },
                 range: { type: Type.STRING, description: "The range of the sheet to append to (e.g., 'Sheet1!A1')." },
                 values: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } }, description: "Array of rows to append, where each row is an array of string values." }
               },
               required: ["spreadsheetId", "values"]
             }
           }, {
             name: "workspace_tasks_lists",
             description: "Lists the user's task lists from Google Tasks.",
             parameters: { type: Type.OBJECT, properties: {} }
           }, {
             name: "workspace_tasks_read",
             description: "Reads tasks from a specific Google Task list.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 listId: { type: Type.STRING, description: "The ID of the task list (default: '@default')." }
               }
             }
           }, {
             name: "workspace_tasks_create",
             description: "Creates a task in a specific Google Task list.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 listId: { type: Type.STRING, description: "The ID of the task list (default: '@default')." },
                 title: { type: Type.STRING, description: "The title of the task." },
                 notes: { type: Type.STRING, description: "Optional notes for the task." }
               },
               required: ["title"]
             }
           }, {
             name: "query_openrouter_model",
             description: "Delegates a prompt to an external OpenRouter model. Useful for specialized tasks like deep reasoning, specific codebase processing, or multimodal processing if supported models are queried.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 modelId: {
                   type: Type.STRING,
                   description: "The OpenRouter model ID (e.g., 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' or 'qwen/qwen3-coder:free')"
                 },
                 prompt: {
                   type: Type.STRING,
                   description: "The prompt or question to send to the target model."
                 },
                 systemInstruction: {
                   type: Type.STRING,
                   description: "(Optional) A system instruction or persona to apply to the queried model."
                 }
               },
                               required: ["modelId", "prompt"]
              }
            }, {
              name: "setPodcastInstructions",
              parameters: { type: Type.OBJECT, properties: { targetTopic: { type: Type.STRING }, focusParam: { type: Type.STRING }, style: { type: Type.STRING }, pace: { type: Type.STRING }, speakerSettings: { type: Type.STRING } } }
            }, {
              name: "controlAppUi",
              description: "Navigate between different views or panels in the application, or update the active script content directly.",
              parameters: { 
                type: Type.OBJECT, 
                properties: { 
                  targetView: { 
                    type: Type.STRING,
                    description: "The ID of the view to navigate to (e.g., 'AUDIO_HUB', 'STUDIO_SYNTHESIS', 'JARVIS_CONSOLE')"
                  },
                  scriptText: {
                    type: Type.STRING,
                    description: "Update the main script text area with new or modified content."
                  },
                  directorNotes: {
                    type: Type.STRING,
                    description: "Update the director's notes or metadata associated with the script."
                  }
                }
              }
            }, {
              name: "update_script",
              description: "Directly update or rewrite the plain text script in the user's workspace.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  content: {
                    type: Type.STRING,
                    description: "The full content of the updated script. Maintain the user's format exactly unless changes were requested."
                  }
                },
                required: ["content"]
              }
            }, {
              name: "updateDiscussionContext",
              parameters: { type: Type.OBJECT, properties: { newTopic: { type: Type.STRING } } }
            }, {
              name: "transferDiscussionContextToApp",
              parameters: { type: Type.OBJECT, properties: { appId: { type: Type.STRING }, scriptData: { type: Type.STRING } } }
            }]
          }],
          responseModalities: ["audio" as any],
         speechConfig: {
           voiceConfig: {
             prebuiltVoiceConfig: { voiceName: voice as any },
           },
         },
         inputAudioTranscription: {},
         outputAudioTranscription: {},
         contextWindowCompression: {
           triggerTokens: "131072",
           slidingWindow: { targetTokens: "84516" },
         },
       },
     });

     clientWs.on("message", (data) => {
       try {
         const msg = JSON.parse(data.toString());
         if (msg.audio && session) {
           session.sendRealtimeInput({
             audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
           });
         }
         if (msg.interruptSignal || msg.text === "[USER INTERRUPTED]") {
           if (session) {
              session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "[USER INTERRUPTED: The user spoke while you were generating. Please halt generation and process their new audio.]" }] }], turnComplete: true });
           }
           safeSend({ interrupted: true });
           if (watchdogTimer) {
             clearTimeout(watchdogTimer);
             watchdogTimer = null;
           }
           safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
         }

         if (msg.text && msg.text !== "[USER INTERRUPTED]") {
           const textLower = msg.text.toLowerCase().trim();
           console.log("Jarvis WS received text:", msg.text);
           try {
             const isStopCommand = 
               textLower === "stop" ||
               textLower === "cancel" ||
               textLower === "halt" ||
               textLower === "enough" ||
               textLower === "quiet" ||
               textLower === "shut up" ||
               textLower.includes("cancel the process") ||
               textLower.includes("cancel the work") ||
               textLower.includes("cancel process") ||
               textLower.includes("cancel work") ||
               textLower.includes("stop agent") ||
               textLower.includes("stop the agent") ||
               textLower.includes("stop writing") ||
               textLower.includes("stop pacing") ||
               textLower.includes("stop audit") ||
               textLower.includes("stop process");

             if (isStopCommand) {
                setPipelineStopped(true);
                session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "SYSTEM INSTRUCTION: The user has explicitly interrupted you. Stop speaking immediately and abort any active pipelines." }] }], turnComplete: true });
                safeSend({ interrupted: true });
                if (watchdogTimer) {
                  clearTimeout(watchdogTimer);
                  watchdogTimer = null;
                }
                safeSend({ agentChat: { agentId: "jarvis", text: "🛑 **[CANCEL TRIGGERED]** Stopping all active processes, pipelines, and background agent tasks immediately." } });
                safeSend({ glassBoxEvent: "🛑 PROCESS CANCELLED: Authorized by User." });
                safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
                safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
                safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
                safeSend({ agentStatus: { agentId: "agentC", status: "idle" } });
             } else {
                setPipelineStopped(false);
                if (!systemMemory.jarvis_sessions[sessionId]) {
                  systemMemory.jarvis_sessions[sessionId] = [];
                }
                systemMemory.jarvis_sessions[sessionId].push({ role: "user", content: msg.text });
                saveSystemMemory();
                
    const userKeyOverride = url.searchParams.get("key");
    const activeKey = userKeyOverride && userKeyOverride !== "SIMULATION_KEY" ? userKeyOverride : (key || process.env.GEMINI_API_KEY);
               
    if (session) {
      session.sendClientContent({ turns: [{ role: "user", parts: [{ text: msg.text }] }], turnComplete: true });
      safeSend({ agentStatus: { agentId: "jarvis", status: "thinking" } });
      startWatchdog(msg.text);
    } else {
      runJojoTextPipeline(msg.text, sessionId, safeSend, activeKey as string, ai, instruction, url);
    }
             }
           } catch(err) {
             console.error("sendClientContent error:", err);
             safeSend({ error: "Inner send error: " + String(err) });
           }
         }
       } catch (e) {
         console.error("Error sending input:", e);
       }
     });

     clientWs.on("close", () => {
       if (session) session.close();
       if (watchdogTimer) {
         clearTimeout(watchdogTimer);
         watchdogTimer = null;
       }
     });
    } catch (err: any) {
      console.error(`Live API connection failed (Attempt ${poolAttemptsLive}):`, err.message);
      if (err?.message?.includes("429") || err?.message?.includes("Too Many Requests") || err?.message?.includes("quota")) {
        console.warn(`[Neural Node Index ${activeNodeIndex}] Exhausted for Live API. Rotating...`);
        rotateNeuralNode();
        usedKey = NEURAL_NODES[activeNodeIndex];
        poolAttemptsLive++;
        if (poolAttemptsLive >= NEURAL_NODES.length) {
          break;
        }
      } else {
        break;
      }
    }
  }

  if (!connectSuccess) {
    console.log("[JOJO Fallback] All Live Voice Node connection attempts failed. Initiating JOJO Text-Only Core fallback stream...");
    
    safeSend({ 
      agentChat: { 
        agentId: "jarvis", 
        text: "🎙️ **[VOICE SYSTEM BYPASS]** Real-time audio connection was bypassed or is offline.\nSuccessfully switched to **JOJO Text Core** fallback mode. You can now chat using pure text!" 
      } 
    });
    safeSend({ glassBoxEvent: "🔄 SYSTEM CONNECTION: Switched to robust JOJO Text Core (Audio uplink inactive)" });
    safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });

    clientWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.text && msg.text !== "[USER INTERRUPTED]") {
          const textLower = msg.text.toLowerCase().trim();
          console.log("Jarvis WS Fallback received text:", msg.text);
          try {
            const isStopCommand = 
              textLower === "stop" ||
              textLower === "cancel" ||
              textLower === "halt" ||
              textLower === "enough" ||
              textLower === "quiet" ||
              textLower === "shut up";

            if (isStopCommand) {
               setPipelineStopped(true);
               safeSend({ interrupted: true });
               safeSend({ agentChat: { agentId: "jarvis", text: "🛑 **[CANCEL TRIGGERED]** Stopping all active processes, pipelines, and background tasks immediately." } });
               safeSend({ glassBoxEvent: "🛑 PROCESS CANCELLED: Authorized by User." });
               safeSend({ agentStatus: { agentId: "jarvis", status: "idle" } });
               safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
               safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
               safeSend({ agentStatus: { agentId: "agentC", status: "idle" } });
            } else {
               setPipelineStopped(false);
               if (!systemMemory.jarvis_sessions[sessionId]) {
                 systemMemory.jarvis_sessions[sessionId] = [];
               }
               systemMemory.jarvis_sessions[sessionId].push({ role: "user", content: msg.text });
               saveSystemMemory();
               
               const finalKey = NEURAL_NODES[activeNodeIndex] || NEURAL_NODES[0] || process.env.GEMINI_API_KEY;
               runJojoTextPipeline(msg.text, sessionId, safeSend, finalKey, ai, instruction, url);
            }
          } catch(err) {
            console.error("sendClientContent fallback error:", err);
            safeSend({ error: "Inner send fallback error: " + String(err) });
          }
        }
      } catch (e) {
        console.error("Error sending input to fallback:", e);
      }
    });

    clientWs.on("close", () => {
      console.log("[JOJO Fallback] Closed offline Text WebSocket connection.");
    });
  }
}
