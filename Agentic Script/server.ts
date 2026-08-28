import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import multer from "multer";
import { JARVIS_SYSTEM_INSTRUCTION } from "./server/instruction.ts";

const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

function getWorkspaceRoot(): string {
  try {
    const configFile = path.join(process.cwd(), "server", "agent_config.json");
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      if (data.allowAppMutation === true) {
        return process.cwd();
      }
    }
  } catch (err) {
    // Ignore and fallback
  }
  const defaultWorkspace = path.join(process.cwd(), "workspace files");
  if (!fs.existsSync(defaultWorkspace)) {
    fs.mkdirSync(defaultWorkspace, { recursive: true });
  }
  return defaultWorkspace;
}

function getSafePath(relativePath: string): string {
  const root = getWorkspaceRoot();
  const fullPath = path.resolve(root, relativePath);
  if (!fullPath.startsWith(root) && fullPath !== root) {
    throw new Error("Access denied: Path outside permitted directory root.");
  }
  return fullPath;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getWorkspaceRoot());
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 3.1 Set up /api/health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Local File Management Endpoints
  app.get("/api/files", (req, res) => {
    try {
      const targetSubDir = (req.query.path as string) || "";
      const fullPath = getSafePath(targetSubDir);
      
      if (!fs.existsSync(fullPath)) {
        return res.json({ files: [] });
      }

      const files = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(entry => {
          return !["node_modules", "dist", ".git", "package-lock.json", "server/agent_config.json", "server/agent_memory.json"].includes(entry.name);
        })
        .map(entry => {
          const entryRelativePath = path.join(targetSubDir, entry.name);
          const stats = fs.statSync(path.join(fullPath, entry.name));
          return {
            name: entry.name,
            path: entryRelativePath,
            isDirectory: entry.isDirectory(),
            size: stats.isDirectory() ? 0 : stats.size,
            updatedAt: stats.mtime
          };
        });

      res.json({ files });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/files/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const targetSubDir = (req.query.path as string) || "";
      if (targetSubDir) {
        const finalDir = getSafePath(targetSubDir);
        fs.mkdirSync(finalDir, { recursive: true });
        const srcPath = req.file.path;
        const finalDest = path.join(finalDir, req.file.originalname);
        if (srcPath !== finalDest) {
          fs.renameSync(srcPath, finalDest);
        }
      }
      res.json({ status: "success", file: req.file?.originalname });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/files/content/:filename", (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      const fullPath = getSafePath(filename);
      if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "Not found" });
      const content = fs.readFileSync(fullPath, "utf-8");
      res.json({ content });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/files/content", (req, res) => {
    try {
      const { filename, content } = req.body;
      if (!filename) return res.status(400).json({ error: "Filename missing" });
      const fullPath = getSafePath(filename);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content || "", "utf-8");
      res.json({ status: "success" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/files/folder", (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) return res.status(400).json({ error: "Path missing" });
      const fullPath = getSafePath(dirPath);
      fs.mkdirSync(fullPath, { recursive: true });
      res.json({ status: "success" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/files/:filename", (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      const fullPath = getSafePath(filename);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
      res.json({ status: "success" });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/clear-history", async (req, res) => {
    try {
      const sessionId = req.body?.sessionId || null;
      const { clearSubAgent } = await import("./server/agentHub.ts");
      clearSubAgent(sessionId);
      res.json({ status: "success", message: "In-memory sub-agent history cleared successfully." });
    } catch (err: any) {
      console.error("Failed to clear sub-agent memory:", err);
      res.status(500).json({ error: err?.message || "Failed to clear memory" });
    }
  });

  app.get("/api/agent-config", async (req, res) => {
    try {
      const { loadAgentConfigs } = await import("./server/agentConfigManager.ts");
      const config = loadAgentConfigs();
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/agent-config", async (req, res) => {
    try {
      const { saveAgentConfigs } = await import("./server/agentConfigManager.ts");
      saveAgentConfigs(req.body);
      res.json({ status: "success", config: req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const targetAgentId = req.body.agentId || "jarvis";
      
      const { chatWithSubAgent, NEURAL_NODES, activeNodeIndex, rotateNeuralNode } = await import("./server/agentHub.ts");
      const { GoogleGenAI, Type } = await import("@google/genai");
      const key = process.env.GEMINI_API_KEY || NEURAL_NODES[activeNodeIndex];
      // Note: We bypass strict key requirement if pool is active

      if (targetAgentId === "agentA" || targetAgentId === "agentB") {
        const reply = await chatWithSubAgent(targetAgentId, message, key);
        return res.json({ text: reply, agentId: targetAgentId });
      } else {
        const requestInstruction = req.body.instruction || JARVIS_SYSTEM_INSTRUCTION;
        const rawMiddlemanModel = req.body.middlemanModel || "gemini-3.1-flash-lite";
        const middlemanModel = rawMiddlemanModel;
        
        // Re-hydrate full conversation context for J.A.R.V.I.S. from history
        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          let lastRole: string | null = null;
          for (const item of history) {
            const role = item.role === 'user' ? 'user' : 'model';
            // Gemini API requires strictly alternating role sequence (user -> model -> user -> model)
            if (role !== lastRole) {
              contents.push({
                role: role,
                parts: [{ text: item.content }]
              });
              lastRole = role;
            } else {
              // Merge successive turns of identical roles side-by-side to maintain valid structure
              if (contents.length > 0) {
                contents[contents.length - 1].parts[0].text += "\n\n" + item.content;
              } else {
                contents.push({
                  role: role,
                  parts: [{ text: item.content }]
                });
                lastRole = role;
              }
            }
          }
        }

        // Add user prompt to the alternating chain safely
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts[0].text += "\n\n" + message;
        } else {
          contents.push({ role: "user", parts: [{ text: message }] });
        }
        let loopLimit = 5;
        let responseText = "";
        let runLogs: any[] = [];

        while (loopLimit > 0) {
          loopLimit--;
          
          let poolAttempts = 0;
          let response: any = null;
          
          while (!response && poolAttempts < NEURAL_NODES.length + 1) {
            const currentKey = process.env.GEMINI_API_KEY || NEURAL_NODES[activeNodeIndex];
            const ai = new GoogleGenAI({ apiKey: currentKey });
            try {
              response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
            contents: contents,
            config: {
              systemInstruction: requestInstruction,
              tools: [{
                functionDeclarations: [{
                  name: "message_agent",
                  description: "Send a message to a sub-agent. They will respond to you, and you can relay their findings. Available agents: agentA, agentB.",
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
                }]
              }]
            }
          });
        } catch(err: any) {
          const errMsg = err?.message || "";
          if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.includes("quota")) {
             console.warn(`[Neural Node Index ${activeNodeIndex}] Exhausted fallback. Rotating keys...`);
             rotateNeuralNode();
             poolAttempts++;
             delete process.env.GEMINI_API_KEY; 
             continue;
          } else {
             throw err; // Stop on Non-429 errors
          }
        }
      }
      
      if (!response) {
        return res.status(429).json({ error: "429 Error: All API limits exhausted for Neural Nodes." });
      }

      const modelTurn = response.candidates?.[0]?.content;
          const functionCalls = response.functionCalls;

          if (modelTurn) {
            contents.push(modelTurn);
          }

          if (functionCalls && functionCalls.length > 0) {
            const functionResponses: any[] = [];
            for (const call of functionCalls) {
              if (call.name === "message_agent") {
                const { agentId, message: agentMsg } = call.args as any;
                console.log(`[Text API ToolCall] message_agent: ${agentId} - ${agentMsg}`);
                try {
                  const rawReply = await chatWithSubAgent(agentId, agentMsg, key);
                  
                  // Track telemetry logs for display in frontend AgentLogsPanel
                  runLogs.push({
                     agentId: agentId,
                     text: rawReply,
                     timestamp: Date.now()
                  });

                  functionResponses.push({
                    name: "message_agent",
                    response: { agent_reply: rawReply }
                  });
                } catch (err: any) {
                  console.error(`[Text API ToolCall Error] ${agentId}:`, err);
                  functionResponses.push({
                    name: "message_agent",
                    response: { error: `Failed to communicate with ${agentId}: ${err.message}` }
                  });
                }
              }
            }

            // Provide tool responses straight back to Jarvis for synthesis
            contents.push({
              role: "user",
              parts: functionResponses.map((resp, idx) => ({
                functionResponse: {
                  name: resp.name,
                  id: functionCalls[idx].id,
                  response: resp.response
                }
              }))
            });
          } else {
            responseText = response.text || "";
            break;
          }
        }

        return res.json({ 
          text: responseText || "Cognitive pipeline successfully completed with no final text.", 
          agentId: "jarvis", 
          logs: runLogs 
        });
      }
    } catch (err: any) {
      console.error("/api/chat error:", err);
      res.status(500).json({ error: err.message || "Failed to process chat" });
    }
  });

  // 3.2 Set up HTTP Server and WebSocket
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/live" });

  const { handleJarvisWebSocket } = await import("./server/agents/jarvis.ts");

  wss.on("connection", (ws, req) => {
    // Only Jarvis remains as the Live WS handler
    handleJarvisWebSocket(ws, req);
  });

  // 3.3 Verify Vite middleware loads in dev mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 3.4 Verify server starts on PORT 3000
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
