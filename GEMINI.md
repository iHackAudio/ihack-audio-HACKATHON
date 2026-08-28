# Gemini SDK & Multi-Agent Model Guidelines

This guide details best practices for orchestrating the `@google/genai` SDK within the Jarvis OS agent platform, specifically optimized for audiobook scripting, manuscript parsing, and multi-agent pipeline workloads.

---


## 📸 Multimodal PDF Processing Pattern
When parsing PDF manuscripts, we convert the local PDF file into a Base64-encoded string and feed it directly into the Gemini model alongside instruction prompts. This utilizes native multimodal PDF understanding instead of unreliable offline text parsing.

```ts
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

async function parseManuscript(filePath: string, apiKey: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      },
      "Extract all manuscript details into structured Markdown..."
    ]
  });
  
  return response.text;
}
```

---

## 🛠️ Tool Calling & Fallback Rotation
Jarvis OS employs an automatic rotation of keys and neural nodes when a rate limit (HTTP 429) is encountered.
- **Always preserve key rotation**: Ensure any customized agent or tool pipeline catches rate limit errors and invokes key-rotation utilities seamlessly.
- **Lazy Initialization**: Initialize the `GoogleGenAI` client only at execution time to prevent application startup crashes if some keys are transiently missing.

---

## 📚 Installed Gemini Skills
This workspace is configured with the official `google-gemini/gemini-skills` to guide development best practices. Agents should refer to the local `.agents/skills` directory when adding new features or interacting with the Gemini API:

- **`gemini-api-dev`**: General best practices for developing apps that use the Gemini API.
- **`gemini-interactions-api`**: Specific techniques for building applications utilizing the Gemini Interactions API (text generation, multi-turn chat, function calling, deep research agents, etc.).
- **`gemini-live-api-dev`**: Instructions for building bidirectional real-time audio and video streaming applications with the Gemini Live API.
- **`gemini-omni-flash-api`**: Guidelines for the specialized video generation model.

Agents should read the respective `*.mdc` files inside `.agents/skills/` before attempting to implement these features.
