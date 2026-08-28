import { runAutoGenPipeline } from "../autogen/autogenPipeline.ts";

export async function runPipeline(userInput: string, sendToUI: (msg: any) => void, sessionId: string = "default"): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  await runAutoGenPipeline(userInput, sendToUI, apiKey, sessionId);
}
