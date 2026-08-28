import { GoogleGenAI } from "@google/genai";
import { NEURAL_NODES, rotateNeuralNode, activeNodeIndex } from "./agentHub.ts";
import { loadAgentConfigs } from "./agentConfigManager.ts";

export interface AIProviderConfig {
  primaryModel: string;
  fallbackModels: string[];
}

export const SUPPORTED_MODELS = {
  gemini: [
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it"
  ],
  mimo: [
    "mimo-v2.5-pro-ultraspeed",
    "mimo-v2.5",
    "mimo-v2.5-pro"
  ],
  moonshot: [
    "moonshot-v1-128k",
    "moonshot-v1-auto",
    "moonshot-v1-32k"
  ],
  openrouter: [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3.5-content-safety:free"
  ],
  groq: [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b",
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768"
  ]
};

function getGeminiApiKey(agentSlot?: 'jarvis' | 'writerA' | 'writerB' | 'writerC'): string {
  if (agentSlot === 'jarvis' && process.env.GEMINI_KEY_JARVIS) return process.env.GEMINI_KEY_JARVIS;
  if (agentSlot === 'writerA' && process.env.GEMINI_KEY_A) return process.env.GEMINI_KEY_A;
  if (agentSlot === 'writerB' && process.env.GEMINI_KEY_B) return process.env.GEMINI_KEY_B;
  if (agentSlot === 'writerC' && process.env.GEMINI_KEY_C) return process.env.GEMINI_KEY_C;
  return process.env.GEMINI_API_KEY || process.env.GEMINI_KEY_JARVIS || "";
}

export async function generateContentWithFallback(
  prompt: string,
  agentSlot?: 'jarvis' | 'writerA' | 'writerB' | 'writerC',
  preferredModel: string = "gemini-3.1-flash-lite",
  temperature?: number
): Promise<string> {
  const initialKey = getGeminiApiKey(agentSlot);

  // Build candidate key list prioritizing slot key, system key, then neural nodes in rotated order
  const keyPool: string[] = [];
  if (initialKey) keyPool.push(initialKey);
  if (process.env.GEMINI_API_KEY && !keyPool.includes(process.env.GEMINI_API_KEY)) {
    keyPool.push(process.env.GEMINI_API_KEY);
  }
  // Append neural nodes starting from the current active index
  for (let i = 0; i < NEURAL_NODES.length; i++) {
    const nodeKey = NEURAL_NODES[(activeNodeIndex + i) % NEURAL_NODES.length];
    if (nodeKey && !keyPool.includes(nodeKey)) {
      keyPool.push(nodeKey);
    }
  }

  // Build candidate model list to overcome per-model quota limits (e.g. gemini-3-flash exhausted)
  const candidateModels = Array.from(new Set([
    preferredModel || "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-pro"
  ]));

  // Attempt generation with key rotation and model fallback
  for (const currentKey of keyPool) {
    for (const modelToTry of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        const configObj: any = {};
        if (temperature !== undefined) configObj.temperature = temperature;

        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: Object.keys(configObj).length > 0 ? configObj : undefined
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuotaOrRateLimit = errMsg.includes("429") || 
          errMsg.includes("resource_exhausted") || 
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("limit: 25000000");

        console.warn(`[AIFallbackEngine] Gemini call failed (Key: ...${currentKey.slice(-6)}, Model: ${modelToTry}):`, errMsg);

        if (isQuotaOrRateLimit) {
          rotateNeuralNode();
        }
      }
    }
  }

  console.warn(`[AIFallbackEngine] All Gemini keys/models exhausted. Falling back to third-party providers...`);

  // F1: Groq Fallback (ultra-fast, using configured key or env)
  let groqKey = process.env.JARVIS_GROQ_KEY || process.env.GROQ_KEY || process.env.GROQ_API_KEY;
  if (!groqKey) {
    try {
      const cfg = loadAgentConfigs();
      groqKey = cfg?.groqApiKey;
    } catch {}
  }
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn("[AIFallbackEngine] Groq fallback failed:", err?.message || err);
    }
  }

  // F2: Mimo Fallback
  const mimoKey = process.env.MIMO_KEY_1 || process.env.MIMO_KEY_2;
  if (mimoKey) {
    try {
      const res = await fetch("https://api.mimo.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mimoKey}`
        },
        body: JSON.stringify({
          model: "mimo-v2.5-pro",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn("[AIFallbackEngine] F2 Mimo failed:", err?.message || err);
    }
  }

  // F3: Moonshot Fallback
  const moonshotKey = process.env.MOONSHOT_API_KEY;
  if (moonshotKey) {
    try {
      const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${moonshotKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-128k",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn("[AIFallbackEngine] F2 Moonshot failed:", err?.message || err);
    }
  }

  // F3: OpenRouter Fallback
  const openrouterKey = process.env.OPENROUTER_KEY;
  if (openrouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterKey}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn("[AIFallbackEngine] F3 OpenRouter failed:", err?.message || err);
    }
  }

 
  throw new Error("AI Generation failed. Please check that process.env.GEMINI_API_KEY is properly set.");
}

export async function testAllKeys(): Promise<Record<string, { status: 'ok' | 'error'; message: string }>> {
  const results: Record<string, { status: 'ok' | 'error'; message: string }> = {};

  // 1. Test Gemini Primary API Key
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY_JARVIS;
  if (!geminiKey) {
    results['gemini'] = { status: 'error', message: 'GEMINI_API_KEY environment variable is not defined.' };
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Respond with "OK".' }] }]
      });
      if (response.text) {
        results['gemini'] = { status: 'ok', message: `Gemini 2.5 Flash working. Response: ${response.text.trim()}` };
      } else {
        results['gemini'] = { status: 'error', message: 'Gemini returned empty text.' };
      }
    } catch (err: any) {
      results['gemini'] = { status: 'error', message: err.message || String(err) };
    }
  }

  // 2. Test Mimo Key
  const mimoKey = process.env.MIMO_KEY_1 || process.env.MIMO_KEY_2;
  if (!mimoKey) {
    results['mimo'] = { status: 'error', message: 'MIMO_KEY_1 or MIMO_KEY_2 environment variable is not set.' };
  } else {
    try {
      const res = await fetch("https://api.mimo.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mimoKey}` },
        body: JSON.stringify({ model: "mimo-v2.5", messages: [{ role: "user", content: "Hi" }] })
      });
      if (res.ok) {
        results['mimo'] = { status: 'ok', message: 'Mimo API connection successful.' };
      } else {
        results['mimo'] = { status: 'error', message: `Mimo returned HTTP ${res.status}: ${await res.text()}` };
      }
    } catch (err: any) {
      results['mimo'] = { status: 'error', message: err.message || String(err) };
    }
  }

  // 3. Test Moonshot Key
  const moonshotKey = process.env.MOONSHOT_API_KEY;
  if (!moonshotKey) {
    results['moonshot'] = { status: 'error', message: 'MOONSHOT_API_KEY environment variable is not set.' };
  } else {
    try {
      const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${moonshotKey}` },
        body: JSON.stringify({ model: "moonshot-v1-8k", messages: [{ role: "user", content: "Hi" }] })
      });
      if (res.ok) {
        results['moonshot'] = { status: 'ok', message: 'Moonshot API connection successful.' };
      } else {
        results['moonshot'] = { status: 'error', message: `Moonshot returned HTTP ${res.status}` };
      }
    } catch (err: any) {
      results['moonshot'] = { status: 'error', message: err.message || String(err) };
    }
  }

  // 4. Test OpenRouter Key
  const openrouterKey = process.env.OPENROUTER_KEY;
  if (!openrouterKey) {
    results['openrouter'] = { status: 'error', message: 'OPENROUTER_KEY environment variable is not set.' };
  } else {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openrouterKey}` },
        body: JSON.stringify({ model: "nvidia/nemotron-3-ultra-550b-a55b:free", messages: [{ role: "user", content: "Hi" }] })
      });
      if (res.ok) {
        results['openrouter'] = { status: 'ok', message: 'OpenRouter API connection successful.' };
      } else {
        results['openrouter'] = { status: 'error', message: `OpenRouter returned HTTP ${res.status}` };
      }
    } catch (err: any) {
      results['openrouter'] = { status: 'error', message: err.message || String(err) };
    }
  }

  // 5. Test Groq Key
  const groqKey = process.env.JARVIS_GROQ_KEY || process.env.GROQ_KEY || process.env.GROQ_API_KEY;
  if (!groqKey) {
    results['groq'] = { status: 'error', message: 'GROQ_API_KEY environment variable is not set.' };
  } else {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Hi" }] })
      });
      if (res.ok) {
        results['groq'] = { status: 'ok', message: 'Groq API connection successful.' };
      } else {
        results['groq'] = { status: 'error', message: `Groq returned HTTP ${res.status}` };
      }
    } catch (err: any) {
      results['groq'] = { status: 'error', message: err.message || String(err) };
    }
  }

  return results;
}

