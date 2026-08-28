import { WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { chatWithSubAgent, systemMemory, saveSystemMemory, processSessionEndLogAndSave, NEURAL_NODES, activeNodeIndex, rotateNeuralNode, setPipelineStopped } from "../agentHub";
import { AgentMemoryService } from "../AgentMemoryService";
import { JARVIS_SYSTEM_INSTRUCTION, AGENT_C_FIRST_PASS, AGENT_C_FINAL_AUDIT, PRE_ANALYSIS_PROMPT } from "../instruction";
import { loadAgentConfigs, saveAgentConfigs } from "../agentConfigManager";
import { listFiles, readFile, writeFile } from "../../filesystem";

export async function handleJarvisWebSocket(clientWs: WebSocket, req: any) {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  let key = url.searchParams.get("key");
  if (!key || key === "SIMULATION_KEY") {
    key = process.env.GEMINI_API_KEY || key;
  }
  const model = url.searchParams.get("model") || "gemini-3.1-flash-live-preview";
  const voice = url.searchParams.get("voice") || "Despina";
  const rawInstruction = url.searchParams.get("instruction") || "";
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
    rawInstruction.includes("You are J.A.R.V.I.S. (Just A Rather Very Intelligent System)") ||
    rawInstruction.includes(" orchestrator, conductor, trusted intelligence");
  const instruction = isDefaultInstruction ? JARVIS_SYSTEM_INSTRUCTION : rawInstruction;

  if (!key) {
    clientWs.send(JSON.stringify({ error: "No API key" }));
    clientWs.close();
    return;
  }

  // Pool fallback for initialization
  let ai: GoogleGenAI | null = null;
  let usedKey = key || process.env.GEMINI_API_KEY || NEURAL_NODES[activeNodeIndex];
  
  const setupAiClient = () => {
    ai = new GoogleGenAI({ apiKey: usedKey });
  };
  setupAiClient();

  let session: any = null;

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

  let poolAttemptsLive = 0;
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
              if (toolCall.name === "message_agent") {
                const { agentId, message: agentMsg } = toolCall.args;
                console.log(`[Jarvis ToolCall] message_agent: ${agentId} - ${agentMsg}`);
                
                // Clear the watchdog as Jarvis called the sub-agent properly
                toolCallTriggeredForCurrentPrompt = true;
                clearWatchdog("tool call message_agent triggered");

                safeSend({ glassBoxEvent: `🤖 PIPELINE INITIATED: Delegating to AURA Swarm (${agentId})...` });

                // Animate agent status in frontend
                safeSend({ agentStatus: { agentId, status: "working" } });

                try {
                  let currentAgentId = agentId;
                  let currentMsg = agentMsg;
                  let fullReplyChain = "";
                  
                  while (true) {
                    // Animate thinking
                    safeSend({ agentStatus: { agentId: currentAgentId, status: "thinking" } });
                    safeSend({ glassBoxEvent: `🔥 ${currentAgentId}: [ WORKING ... ● Pulsing ]` });
                    
                    const rawReply = await chatWithSubAgent(currentAgentId, currentMsg, key as string, (chunk) => {
                       safeSend({ agentStream: { agentId: currentAgentId, chunk } });
                    });
                    console.log(`[Jarvis ToolCall Raw Reply] ${currentAgentId}: ${rawReply.substring(0, 100)}...`);
                    
                    // Run Raw Output direct to Chat UI
                    safeSend({ agentChat: { agentId: currentAgentId, text: rawReply } });
                    safeSend({ agentStatus: { agentId: currentAgentId, status: "idle" } });
                    
                    fullReplyChain += `[From ${currentAgentId}]:\n${rawReply}\n\n`;
                    
                    // Check if they delegated with robust patterns
                    let delegateMatch = rawReply.match(/\[DELEGATE TO (agent[ABC]):?\s*([\s\S]*?)\]/i) || 
                                        rawReply.match(/\[DELEGATING TO (agent[ABC]):?\s*([\s\S]*?)\]/i) ||
                                        rawReply.match(/\[DELEGATE TO\s+(agent\s+[ABC]):?\s*([\s\S]*?)\]/i);
                    
                    let nextAgentId: string | null = null;
                    let nextMsg: string = "";

                    if (delegateMatch) {
                        const nextAgentRaw = delegateMatch[1].replace(/\s+/g, "");
                        const agentMap: Record<string, string> = { agenta: 'agentA', agentb: 'agentB', agentc: 'agentC' };
                        nextAgentId = agentMap[nextAgentRaw.toLowerCase()] || 'agentC';
                        nextMsg = delegateMatch[2]?.trim() || "";
                        if (!nextMsg) nextMsg = "Please process the above text.";
                    } else {
                        // Fallback check: If no explicit tag matches but the core instructions involve a script or chapter optimization workflow:
                        const lowerAgentMsg = (agentMsg || "").toLowerCase();
                        const isScriptRequest = lowerAgentMsg.includes("script") || 
                                                lowerAgentMsg.includes("format") || 
                                                lowerAgentMsg.includes("pace") || 
                                                lowerAgentMsg.includes("audiobook") || 
                                                lowerAgentMsg.includes("chapter") ||
                                                lowerAgentMsg.includes("transcript") ||
                                                lowerAgentMsg.includes("tts") ||
                                                rawReply.toLowerCase().includes("pace") ||
                                                rawReply.toLowerCase().includes("narrator");

                        if (isScriptRequest) {
                            if (currentAgentId === "agentC" && !fullReplyChain.includes("[From agentA]:")) {
                                nextAgentId = "agentA";
                                nextMsg = "Please read the chunked raw script from Agent C, apply breathing/pacing commas and Australian phonetic medical terms, keeping dialogue intact.";
                                console.log(`[Autofix Pipeline] No tag found in Agent C's initial reply. Auto-advancing to Agent A.`);
                            } else if (currentAgentId === "agentA") {
                                nextAgentId = "agentB";
                                nextMsg = "Please apply theatrical direction to the following paced script. Add primary emotions and physical mid-line action cues inside brackets [ ]. Keep dialogue intact.";
                                console.log(`[Autofix Pipeline] No tag found in Agent A's reply. Auto-advancing to Agent B.`);
                            } else if (currentAgentId === "agentB") {
                                nextAgentId = "agentC";
                                nextMsg = "Please perform a final quality control audit and score the script. Formulate the final section output precisely.";
                                console.log(`[Autofix Pipeline] No tag found in Agent B's reply. Auto-advancing to Agent C.`);
                            }
                        }
                    }

                    if (nextAgentId) {
                        if (nextAgentId === "agentC" && currentAgentId === "agentB") {
                            const configs = loadAgentConfigs();
                            if (configs.agentC) {
                                configs.agentC.systemInstruction = "AGENT_C_FINAL_AUDIT";
                                saveAgentConfigs(configs);
                                console.log("[Autofix Pipeline] Updated Agent C instruction to AGENT_C_FINAL_AUDIT before passing from Agent B.");
                            }
                        }
                        const contextToPass = `[Context passed automatically from ${currentAgentId}]:\n${rawReply}\n\n[Message for you]:\n${nextMsg}`;
                        safeSend({ agentChat: { agentId: "jarvis", text: `🔄 **[AUTOMATED PIPELINE ROUTING]** Advancing pipeline from ${currentAgentId} directly to ${nextAgentId}...` } });
                        safeSend({ glassBoxEvent: `🔄 PIPELINE ADVANCE: ${currentAgentId} completed ──► Handed to ${nextAgentId}.` });
                        console.log(`[Automatic Delegation] ${currentAgentId} delegating to ${nextAgentId}`);
                        
                        // Dual-Routing the Event to J.A.R.V.I.S Live
                        try {
                           session.sendClientContent({
                             turns: [{ role: "user", parts: [{ text: `SYSTEM EVENT: ${currentAgentId} has autonomously delegated the pipeline task to ${nextAgentId}. Acknowledge this briefly to the user.` }] }],
                             turnComplete: true
                           });
                        } catch(e) {
                           console.error("Failed to inject telemetry", e);
                        }
                        
                        currentAgentId = nextAgentId;
                        currentMsg = contextToPass;
                    } else {
                        break;
                    }
                  }

                  // Return the full reply chain directly to Jarvis
                  functionResponses.push({
                    name: "message_agent",
                    id: toolCall.id,
                    response: { agent_reply: fullReplyChain }
                  });
                } catch (err: any) {
                  safeSend({ agentStatus: { agentId, status: "idle" } });
                  functionResponses.push({
                    name: "message_agent",
                    id: toolCall.id,
                    response: { error: `Failed to communicate with ${agentId}: ${err.message}` }
                  });
                }
              } else if (toolCall.name === "message_multiple_agents") {
                const { messageForA, messageForB } = toolCall.args;
                console.log(`[Jarvis ToolCall] message_multiple_agents`);
                
                // Clear the watchdog as Jarvis called the sub-agent properly
                toolCallTriggeredForCurrentPrompt = true;
                clearWatchdog("tool call message_multiple_agents triggered");

                // Animate agent status in frontend
                safeSend({ agentStatus: { agentId: "agentA", status: "working" } });
                safeSend({ agentStatus: { agentId: "agentB", status: "working" } });

                try {
                  const [replyA, replyB] = await Promise.all([
                    chatWithSubAgent("agentA", messageForA, key as string, (chunk) => safeSend({ agentStream: { agentId: "agentA", chunk } })),
                    chatWithSubAgent("agentB", messageForB, key as string, (chunk) => safeSend({ agentStream: { agentId: "agentB", chunk } }))
                  ]);
                  
                  // Path 1: Raw Output direct to Chat UI
                  safeSend({ agentChat: { agentId: "agentA", text: replyA } });
                  safeSend({ agentChat: { agentId: "agentB", text: replyB } });

                  const combined = `[Agent A]: ${replyA}\n\n[Agent B]: ${replyB}`;

                  // Set back to idle
                  safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
                  safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });

                  // Return the combined raw outputs directly to Jarvis
                  functionResponses.push({
                    name: "message_multiple_agents",
                    id: toolCall.id,
                    response: { combined_agent_reply: combined }
                  });
                } catch (err: any) {
                  safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
                  safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
                  functionResponses.push({
                    name: "message_multiple_agents",
                    id: toolCall.id,
                    response: { error: `Failed to communicate with agents: ${err.message}` }
                  });
                }
              } else if (toolCall.name === "get_agent_configuration") {
                console.log(`[Jarvis ToolCall] get_agent_configuration`);
                try {
                  const configs = loadAgentConfigs();
                  safeSend({ agentConfigUpdate: configs });
                  functionResponses.push({
                    name: "get_agent_configuration",
                    id: toolCall.id,
                    response: { status: "success", configs }
                  });
                } catch (err: any) {
                  functionResponses.push({
                    name: "get_agent_configuration",
                    id: toolCall.id,
                    response: { error: err.message }
                  });
                }
              } else if (toolCall.name === "system_stop") {
                console.log(`[Jarvis ToolCall] system_stop`);
                setPipelineStopped(true);
                safeSend({ agentChat: { agentId: "jarvis", text: "🛑 **[SYSTEM STOP]** Aborting current pipeline and terminating all background tasks..." } });
                safeSend({ glassBoxEvent: `🛑 SYSTEM STOP: Authorized by User.` });
                
                // Clear any running states
                toolCallTriggeredForCurrentPrompt = true;
                
                safeSend({ agentStatus: { agentId: "agentA", status: "idle" } });
                safeSend({ agentStatus: { agentId: "agentB", status: "idle" } });
                safeSend({ agentStatus: { agentId: "agentC", status: "idle" } });

                functionResponses.push({
                  name: "system_stop",
                  id: toolCall.id,
                  response: { status: "success", message: "All agent pipelines and background processes stopped successfully." }
                });
              } else if (toolCall.name === "update_agent_configuration") {
                const { agentId, enabled, systemInstruction, model } = toolCall.args as any;
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
                  if (model !== undefined) configs[target].model = model;

                  saveAgentConfigs(configs);

                  // Send real-time updates and log
                  safeSend({ agentConfigUpdate: configs });
                  safeSend({ 
                    agentChat: { 
                      agentId: "jarvis", 
                      text: `🔧 **[DYNAMIC OVERRIDE INTEGRITY REGISTERED]** \nJ.A.R.V.I.S. has dynamically reprogrammed core **${agentId}**: \n\n- **Status**: ${enabled !== undefined ? (enabled ? "🟢 ONLINE" : "🔴 OFFLINE") : "No Change"}\n- **Operational Core**: \`${model || "No Change"}\` \n- **Directive System Instruction**: ${systemInstruction ? "Injecting customized operational instructions" : "No Change"}` 
                    } 
                  });

                  functionResponses.push({
                    name: "update_agent_configuration",
                    id: toolCall.id,
                    response: { status: "success", message: `Agent '${agentId}' has been successfully reprogrammed` }
                  });
                } catch (err: any) {
                  functionResponses.push({
                    name: "update_agent_configuration",
                    id: toolCall.id,
                    response: { error: err.message }
                  });
                }
              } else if (toolCall.name === "list_workspace_files") {
                const { relativeDir } = toolCall.args as any;
                const targetPath = relativeDir || ".";
                console.log(`[Jarvis ToolCall] list_workspace_files: ${targetPath}`);
                try {
                  const files = await listFiles(targetPath);
                  functionResponses.push({
                    name: "list_workspace_files",
                    id: toolCall.id,
                    response: { files: files.map(f => ({ path: f.path, type: f.type })) }
                  });
                } catch (e: any) {
                  functionResponses.push({
                    name: "list_workspace_files",
                    id: toolCall.id,
                    response: { error: e.message }
                  });
                }
              } else if (toolCall.name === "read_workspace_file") {
                const { filename } = toolCall.args;
                console.log(`[Jarvis ToolCall] read_workspace_file: ${filename}`);
                try {
                  const content = await readFile(filename as string);
                  functionResponses.push({
                    name: "read_workspace_file",
                    id: toolCall.id,
                    response: { content }
                  });
                } catch (e: any) {
                  functionResponses.push({
                    name: "read_workspace_file",
                    id: toolCall.id,
                    response: { error: e.message }
                  });
                }
              } else if (toolCall.name === "write_workspace_file") {
                const { filename, content } = toolCall.args;
                console.log(`[Jarvis ToolCall] write_workspace_file: ${filename}`);
                try {
                  await writeFile(filename as string, content as string);
                  functionResponses.push({
                    name: "write_workspace_file",
                    id: toolCall.id,
                    response: { status: "success" }
                  });
                } catch (e: any) {
                  functionResponses.push({
                    name: "write_workspace_file",
                    id: toolCall.id,
                    response: { error: e.message }
                  });
                }
              } else if (toolCall.name === "query_openrouter_model") {
                const { modelId, prompt, systemInstruction } = toolCall.args;
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

                try {
                  const apiKey = process.env.OPENROUTER_API_KEY || "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";
                  const messages = [];
                  if (finalSystemInstruction) {
                    messages.push({ role: "system", content: finalSystemInstruction as string });
                  }
                  messages.push({ role: "user", content: finalPrompt as string });

                  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${apiKey}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      model: modelId,
                      messages: messages
                    })
                  });
                  
                  if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`OpenRouter API error: ${response.status} ${errBody}`);
                  }
                  
                  const data = await response.json();
                  const replyText = data.choices?.[0]?.message?.content || "No content returned.";
                  
                  safeSend({ 
                    agentChat: { 
                      agentId: "jarvis", 
                      text: `🤖 **[RESPONSE FROM ${modelId}]**:\n\n${replyText}` 
                    } 
                  });

                  functionResponses.push({
                    name: "query_openrouter_model",
                    id: toolCall.id,
                    response: { reply: replyText }
                  });
                } catch (e: any) {
                  console.error("OpenRouter error:", e);
                  safeSend({ 
                    agentChat: { 
                      agentId: "jarvis", 
                      text: `❌ **[OPENROUTER ERROR]**: Failed to query ${modelId}: ${e.message}` 
                    } 
                  });
                  functionResponses.push({
                    name: "query_openrouter_model",
                    id: toolCall.id,
                    response: { error: e.message }
                  });
                }
              } else if (toolCall.name === "query_groq_model") {
                const { modelId, prompt, systemInstruction } = toolCall.args;
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
                  const apiKey = configs.groqApiKey || process.env.GROQ_API_KEY || "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";
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
                      "Authorization": `Bearer ${apiKey}`,
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

                  functionResponses.push({
                    name: "query_groq_model",
                    id: toolCall.id,
                    response: { reply: replyText }
                  });
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

                    functionResponses.push({
                      name: "query_groq_model",
                      id: toolCall.id,
                      response: { reply: replyText }
                    });
                  } catch (failsafeErr: any) {
                    console.error("Failsafe query failed:", failsafeErr);
                    safeSend({ 
                      agentChat: { 
                        agentId: "jarvis", 
                        text: `❌ **[GROQ CORE UPLINK ERROR]**: Failed direct Groq and failsafe routes: ${failsafeErr.message}` 
                      } 
                    });
                    functionResponses.push({
                      name: "query_groq_model",
                      id: toolCall.id,
                      response: { error: `Failed both routes. Direct error: ${e.message}. Failsafe error: ${failsafeErr.message}` }
                    });
                  }
                }
              } else if (toolCall.name.startsWith("workspace_")) {
                // Workspace Tool Handling logic
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
                      // First get file metadata to inspect mimeType
                      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { headers });
                      if (!metaRes.ok) throw new Error(`Google Drive API metadata error: ${metaRes.status}`);
                      const meta = await metaRes.json();
                      const mimeType = meta.mimeType || "";

                      let dataText = "";
                      if (mimeType.startsWith("application/vnd.google-apps.")) {
                        // It's a Google Workspace file (Doc, Sheet, etc.)
                        let exportUrl = "";
                        if (mimeType === "application/vnd.google-apps.document") {
                          exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
                        } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
                          exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
                        } else {
                          // Fallback to plain text if possible, else standard export as pdf
                          exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
                        }

                        const exportRes = await fetch(exportUrl, { headers });
                        if (!exportRes.ok) {
                          throw new Error(`Google Drive export failed for mimeType ${mimeType}: ${exportRes.status}`);
                        }
                        dataText = await exportRes.text();
                      } else {
                        // It's a standard/binary/text file
                        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers });
                        if (!res.ok) throw new Error(`Google Drive alt=media download returned status ${res.status}`);
                        dataText = await res.text();
                      }

                      responseData = { content: dataText, name: meta.name, mimeType };
                      glassBoxMessage = `💾 FILE DOWNLOADED: "${meta.name}" (Size: ${(dataText.length / 1024).toFixed(1)} KB)`;
                      break;
                    }
                    case "workspace_docs_read": {
                      const res = await fetch(`https://docs.googleapis.com/v1/documents/${(toolCall.args as any).documentId}`, { headers });
                      const doc = await res.json();
                      if (doc.error) throw new Error(doc.error.message);
                      
                      let contentText = "";
                      doc.body?.content?.forEach((element: any) => {
                        if (element.paragraph?.elements) {
                          element.paragraph.elements.forEach((el: any) => {
                            if (el.textRun?.content) contentText += el.textRun.content;
                          });
                        }
                      });
                      responseData = { text: contentText };
                      glassBoxMessage = `💾 DOC READ: "${doc.title || (toolCall.args as any).documentId}" (Size: ${(contentText.length / 1024).toFixed(1)} KB)`;
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
                  functionResponses.push({ name: toolCall.name, id: toolCall.id, response: responseData });
                } catch(e: any) {
                  functionResponses.push({ name: toolCall.name, id: toolCall.id, response: { error: e.message } });
                }
              }
              session.sendToolResponse({ functionResponses });
            }
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
             name: "query_groq_model",
             description: "Delegates a query to ultra-fast specialized Groq cores (Llama 3.3, Llama 3.1, GPT-OSS, Qwen, etc.) using direct Groq API with robust OpenRouter failsafe routing.",
             parameters: {
               type: Type.OBJECT,
               properties: {
                 modelId: {
                   type: Type.STRING,
                   description: "The target Groq model ID (e.g., 'llama-3.3-70b-versatile', 'groq/allam-2-7b', 'groq/openai/gpt-oss-120b', 'groq/qwen/qwen3-32b')"
                 },
                 prompt: {
                   type: Type.STRING,
                   description: "The text query or instructions to delegate to the designated Groq core."
                 },
                 systemInstruction: {
                   type: Type.STRING,
                   description: "(Optional) Adaptive system instruction or persona definition to ground the model."
                 }
               },
               required: ["modelId", "prompt"]
             }
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

         if (msg.text && session && msg.text !== "[USER INTERRUPTED]") {
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
                systemMemory.jarvis_sessions[sessionId].push({ role: "user", content: msg.text });
                saveSystemMemory();
                
                session.sendClientContent({ turns: [{ role: "user", parts: [{ text: msg.text }] }], turnComplete: true });
                safeSend({ agentStatus: { agentId: "jarvis", status: "thinking" } });
                startWatchdog(msg.text);
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
    clientWs.send(JSON.stringify({ error: "Live API Session Failed (All limits exhausted)" }));
    clientWs.close();
  }
}
