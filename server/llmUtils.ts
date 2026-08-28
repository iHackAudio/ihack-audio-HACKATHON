import { GoogleGenAI } from "@google/genai";
import { loadAgentConfigs } from "./agentConfigManager.js";
import * as fs from "fs";
import * as path from "path";

// A global token tracker across all LLM calls in a session
export interface TokenTrackerStep {
  agentId: string;
  model: string;
  inputChars: number;
  outputChars: number;
  tokens: number;
}

export interface TokenTracker {
  totalTokens: number;
  totalInputCharacters: number;
  totalOutputCharacters: number;
  steps?: TokenTrackerStep[];
}

export const MODEL_MAP: Record<string, string[]> = {
  "jarvis": [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ],
  "agentC": [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ],
  "agentA": [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ],
  "agentB": [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
  ],
};

export function getModelsForAgent(agentId: string): string[] {
  const configs = loadAgentConfigs();
  const agentKeyBase = agentId.split(" ")[0].replace("-audit", "");
  const config = (configs as any)[agentKeyBase];

  if (config?.modelProvider) {
      let baseModel = config.modelProvider;
      let fallbacks = MODEL_MAP[agentId] || MODEL_MAP["jarvis"];
      return [baseModel, ...fallbacks.filter(m => m !== baseModel)];
  }
  
  if (config?.model) {
      let baseModel = config.model;
      let fallbacks = MODEL_MAP[agentId] || MODEL_MAP["jarvis"];
      return [baseModel, ...fallbacks.filter(m => m !== baseModel)];
  }
  
  if (config?.textModel) {
      let baseModel = config.textModel;
      let fallbacks = MODEL_MAP[agentId] || MODEL_MAP["jarvis"];
      return [baseModel, ...fallbacks.filter(m => m !== baseModel)];
  }

  return MODEL_MAP[agentId] || MODEL_MAP["default"];
}

export async function callWithFallback(
  prompt: string,
  agentId: string,
  sendToUI: (msg: any) => void,
  tokenTracker?: TokenTracker,
  modelsOverride?: string[]
): Promise<string> {
  const agentKeyBase = agentId.split(" ")[0].replace("-audit", "");
  
  let geminiKey = process.env.GEMINI_API_KEY || "";
  if (agentKeyBase === "agentA" && process.env.GEMINI_API_KEY_3) geminiKey = process.env.GEMINI_API_KEY_3;
  else if (agentKeyBase === "agentB" && process.env.GEMINI_API_KEY_4) geminiKey = process.env.GEMINI_API_KEY_4;
  else if (agentKeyBase === "agentC" && process.env.GEMINI_API_KEY_5) geminiKey = process.env.GEMINI_API_KEY_5;
  else if (agentKeyBase === "jarvis" && process.env.GEMINI_API_KEY_1) geminiKey = process.env.GEMINI_API_KEY_1;
  
  if (!geminiKey) geminiKey = process.env.GEMINI_API_KEY || "";

  const groqKey = process.env.GROQ_API_KEY || "";
  const kimiKey = process.env.KIMI_API_KEY || "";

  const models = modelsOverride || getModelsForAgent(agentId);

  for (const model of models) {
    try {
      sendToUI({ glassBoxEvent: `🔄 Trying ${model} for ${agentId}...` });

      if (model.startsWith("gemini") || model.startsWith("Gemini") || model.startsWith("gemma") || model.startsWith("Gemma")) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const res = await ai.models.generateContent({
          model: model.toLowerCase(),
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { maxOutputTokens: 10000, temperature: 0.5 }
        });

        if (tokenTracker && res.usageMetadata) {
          tokenTracker.totalTokens += res.usageMetadata.totalTokenCount || 0;
        }

        const text = res.text || "";
        if (text.trim().length < 50) {
           throw new Error("Response too short (under 50 chars). Possible safety block or truncation.");
        }
        
        if (tokenTracker) {
           tokenTracker.totalInputCharacters += prompt.length;
           tokenTracker.totalOutputCharacters += text.length;
           if (!tokenTracker.steps) tokenTracker.steps = [];
           tokenTracker.steps.push({
             agentId,
             model,
             inputChars: prompt.length,
             outputChars: text.length,
             tokens: res.usageMetadata?.totalTokenCount || 0
           });
        }

        sendToUI({
          agentChat: {
            agentId: "system",
            text: `📊 [${model} / ${agentId}] Input: ${prompt.length.toLocaleString()} chars | Output: ${text.length.toLocaleString()} chars | Tokens: ${res.usageMetadata?.totalTokenCount || "N/A"}`
          }
        });

        sendToUI({
          agentChat: {
            agentId: agentKeyBase,
            text: `📝 [AGENT ${agentKeyBase.toUpperCase()} OUTPUT]:\n\n${text}`
          }
        });

        return text;
      } else if (model.startsWith("groq/") || model.startsWith("qwen/") || model.startsWith("mimo/")) {
        let actualModel = model;
        if (model.startsWith("groq/")) actualModel = model.replace("groq/", "");
        if (model.startsWith("mimo/")) actualModel = model.replace("mimo/", "");
        if (model.startsWith("qwen/")) actualModel = model.replace("qwen/", "");

        let endpoint = "https://api.groq.com/openai/v1/chat/completions";
        let apiKeyToUse = process.env.GROQ_API_KEY || "";
        if (model.startsWith("mimo/")) {
            endpoint = "https://api.xiaomimimo.com/v1/chat/completions";
            apiKeyToUse = process.env.MIMO_API_KEY || apiKeyToUse;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyToUse}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: actualModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 4096
          })
        });
        if (!response.ok) throw new Error(`API Error (${endpoint}): ${response.status}`);

        const data = (await response.json()) as any;

        if (tokenTracker && data.usage) {
          tokenTracker.totalTokens += data.usage.total_tokens || 0;
        }

        const text = data.choices?.[0]?.message?.content || "";
        if (text.trim().length < 50) {
           throw new Error("Response too short (under 50 chars). Possible safety block or truncation.");
        }
        
        if (tokenTracker) {
           tokenTracker.totalInputCharacters += prompt.length;
           tokenTracker.totalOutputCharacters += text.length;
           if (!tokenTracker.steps) tokenTracker.steps = [];
           tokenTracker.steps.push({
             agentId,
             model,
             inputChars: prompt.length,
             outputChars: text.length,
             tokens: data.usage?.total_tokens || 0
           });
        }

        sendToUI({
          agentChat: {
            agentId: "system",
            text: `📊 [${model} / ${agentId}] Input: ${prompt.length.toLocaleString()} chars | Output: ${text.length.toLocaleString()} chars | Tokens: ${data.usage?.total_tokens || "N/A"}`
          }
        });

        sendToUI({
          agentChat: {
            agentId: agentKeyBase,
            text: `📝 [AGENT ${agentKeyBase.toUpperCase()} OUTPUT]:\n\n${text}`
          }
        });

        return text;
      } else if (model.startsWith("moonshot")) {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${kimiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 4096
          })
        });
        if (!response.ok) throw new Error(`Moonshot Error: ${response.status}`);
        const data = (await response.json()) as any;

        if (tokenTracker && data.usage) {
          tokenTracker.totalTokens += data.usage.total_tokens || 0;
        }

        const text = data.choices?.[0]?.message?.content || "";
        if (text.trim().length < 50) {
           throw new Error("Response too short (under 50 chars). Possible safety block or truncation.");
        }
        
        if (tokenTracker) {
           tokenTracker.totalInputCharacters += prompt.length;
           tokenTracker.totalOutputCharacters += text.length;
           if (!tokenTracker.steps) tokenTracker.steps = [];
           tokenTracker.steps.push({
             agentId,
             model,
             inputChars: prompt.length,
             outputChars: text.length,
             tokens: data.usage?.total_tokens || 0
           });
        }

        sendToUI({
          agentChat: {
            agentId: "system",
            text: `📊 [${model} / ${agentId}] Input: ${prompt.length.toLocaleString()} chars | Output: ${text.length.toLocaleString()} chars | Tokens: ${data.usage?.total_tokens || "N/A"}`
          }
        });

        sendToUI({
          agentChat: {
            agentId: agentKeyBase,
            text: `📝 [AGENT ${agentKeyBase.toUpperCase()} OUTPUT]:\n\n${text}`
          }
        });

        return text;
      }
    } catch (err: any) {
      sendToUI({ glassBoxEvent: `❌ Failed ${model}: ${err.message}` });
      sendToUI({ agentChat: { agentId: "system", text: `❌ Failed ${model}: ${err.message}` } });
      continue;
    }
  }

  sendToUI({ agentChat: { agentId: "system", text: `💥 All fallback models failed for agent ${agentId}.` } });
  throw new Error(`All fallback models failed for agent ${agentId}.`);
}

// Global Billboard Poster
export function postBillboard(input: string, output: string, agentId: string, sendToUI: (msg: any) => void): void {
  const clean = (text: string) => text
    .replace(/\{[^}]*\}\s*/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/## Scene:.*/g, '')
    .replace(/L\d+:\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const inLen = clean(input).length;
  const outLen = clean(output).length;
  const ratio = inLen > 0 ? (outLen / inLen) * 100 : 100;
  const isRedFlag = ratio < 85 || ratio > 250;

  sendToUI({
    agentChat: {
      agentId,
      text: `📊 Input: ${inLen.toLocaleString()} chars | Output: ${outLen.toLocaleString()} chars | Retention: ${ratio.toFixed(1)}% ${isRedFlag ? '⚠️ RED FLAG' : '✅'}`
    }
  });
}

// Validation helper for pipeline stages
export function validateStage(output: string, stageName: string) {
  if (!output || output.trim().length < 100) {
    throw new Error(`Stage [${stageName}] returned an empty or unacceptably short output.`);
  }
}

/**
 * Resolves filenames mentioned in the input and retrieves their contents from the workspace.
 */
export async function resolveWorkspaceFiles(text: string): Promise<string> {
  const fileRegex = /(?:["'])([^"']+\.[a-zA-Z0-9]+)(?:["'])|(\b[a-zA-Z0-9_\-\.]+\.(?:txt|md|pdf|doc|docx|ts|js|json|csv|sql)\b)/gi;
  const matches = [...text.matchAll(fileRegex)];
  
  if (matches.length === 0) return text;
  
  let fileContents = "";
  const seenFiles = new Set<string>();

  for (const match of matches) {
    const fileName = match[1] || match[2];
    if (seenFiles.has(fileName)) continue;
    seenFiles.add(fileName);

    const baseName = path.basename(fileName);
    const possiblePaths = [
      path.join(process.cwd(), fileName),
      path.join(process.cwd(), 'workspace files', fileName),
      path.join(process.cwd(), 'workspace files', 'BIBLES', fileName),
      path.join(process.cwd(), 'workspace files', 'projects', fileName),
      path.join(process.cwd(), 'workspace files', 'BIBLES', baseName),
      path.join(process.cwd(), 'workspace files', 'projects', baseName),
      path.join('/', fileName)
    ];

    // Helper to find file recursively in directory
    const findFileInDir = (dir: string, targetName: string): string | null => {
      if (!fs.existsSync(dir)) return null;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) {
            return fullPath;
          } else if (entry.isDirectory()) {
            const found = findFileInDir(fullPath, targetName);
            if (found) return found;
          }
        }
      } catch (e) {}
      return null;
    };

    let resolvedPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
        resolvedPath = p;
        break;
      }
    }

    if (!resolvedPath) {
      resolvedPath = findFileInDir(path.join(process.cwd(), 'workspace files', 'BIBLES'), baseName) ||
                     findFileInDir(path.join(process.cwd(), 'workspace files', 'projects'), baseName);
    }

    if (resolvedPath) {
      try {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        fileContents += `\n--- START OF FILE: ${fileName} ---\n${content}\n--- END OF FILE: ${fileName} ---\n`;
      } catch (e) {
        console.error(`[llmUtils] Failed to read file ${fileName}:`, e);
      }
    }
  }
  
  if (fileContents) {
    return `[USER COMMAND]: ${text}\n\n[RESOLVED WORKSPACE CONTENT]:\n${fileContents}`;
  }
  
  return text;
}

// Write the compiled Token & Cost Report to a Markdown file in the workspace
export function writeTokenReport(tokenTracker: TokenTracker, activeProtocol: string = "unknown", scriptContext: string = "No Context Provided"): string {
  const steps = tokenTracker.steps || [];
  
  let existingContent = "";
  let nextRunNumber = 1;
  const reportDir = path.resolve(process.cwd(), "workspace files");
  const reportPath = path.join(reportDir, "Pipeline_Burn_Reports.md");

  if (fs.existsSync(reportPath)) {
    try {
      existingContent = fs.readFileSync(reportPath, "utf-8");
      const match = existingContent.match(/## Run #(\d+)/);
      if (match && match[1]) {
        nextRunNumber = parseInt(match[1], 10) + 1;
      }
    } catch(e) {}
  }

  // Clean the context
  let cleanContext = scriptContext.trim();
  if (cleanContext.length > 100) {
    cleanContext = cleanContext.substring(0, 100).replace(/\n/g, ' ') + "...";
  }

  let md = `## Run #${nextRunNumber} — ${new Date().toLocaleString()}\n\n`;
  md += `**Context / Script**: *${cleanContext || "No Context Provided"}*\n`;
  md += `**Active Protocol**: ${activeProtocol.toUpperCase()}\n\n`;
  md += `| Step / Agent | Model Used | Input Chars | Output Chars | Burned Tokens |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: |\n`;
  
  for (const step of steps) {
    md += `| **${step.agentId}** | \`${step.model}\` | ${step.inputChars.toLocaleString()} | ${step.outputChars.toLocaleString()} | ${step.tokens.toLocaleString()} |\n`;
  }
  
  md += `| **TOTALS** | - | **${tokenTracker.totalInputCharacters.toLocaleString()}** | **${tokenTracker.totalOutputCharacters.toLocaleString()}** | **${tokenTracker.totalTokens.toLocaleString()}** |\n\n`;
  md += `--- \n\n`;

  try {
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    const header = `# 📊 Pipeline Token & Cost Burn Reports\n\n`;
    const newFileContent = existingContent ? existingContent.replace(header, header + md) : header + md;
    
    // In case the replace failed (header missing)
    if (existingContent && newFileContent === existingContent) {
      fs.writeFileSync(reportPath, header + md + existingContent, "utf-8");
    } else {
      fs.writeFileSync(reportPath, newFileContent, "utf-8");
    }
    
    console.log(`[Token Report] Saved successfully to ${reportPath}`);
  } catch (err: any) {
    console.error("Failed to write token report:", err.message);
  }

  return `# 📊 Pipeline Token & Cost Burn Report\n\n` + md;
}
