import { runADKStoryPipeline, DEFAULT_MODEL, WORKSPACE_DIR } from "../server/adk/storyProductionAdk.ts";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=================================================");
  console.log("   GOOGLE ADK LIVE MULTI-AGENT PIPELINE TEST     ");
  console.log("=================================================");
  console.log(`Default Model: ${DEFAULT_MODEL}`);
  console.log(`Workspace Dir: ${WORKSPACE_DIR}`);

  const skillDocPath = path.join(WORKSPACE_DIR, "STORY_PRODUCTION_SKILL_SYSTEM.md");
  console.log(`Skill Doc Present: ${fs.existsSync(skillDocPath)}`);

  const samplePrompt = `Create a dark sci-fi audiobook concept about an AI signal detected inside an abandoned lunar mining colony called Meridian-9.
Characters:
1. Captain Elena Vance (Salvage Chief, tired, cynical, sharp).
2. ECHO-4 (Dying synth AI, glitching, protective).`;

  try {
    console.log("\nStarting live run with Google ADK Sequential Agent Pipeline...\n");

    const startTime = Date.now();
    const result = await runADKStoryPipeline({
      userPrompt: samplePrompt,
      modelName: DEFAULT_MODEL,
      agentKeys: {
        conceptKey: process.env.GEMINI_API_KEY,
        characterKey: process.env.GEMINI_API_KEY,
        sceneKey: process.env.GEMINI_API_KEY,
        scriptKey: process.env.GEMINI_API_KEY
      },
      sessionId: `test_session_${Date.now()}`,
      onEvent: (event: any) => {
        if (event.author) {
          console.log(`[ADK Event Stream] Author: ${event.author}`);
        }
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n-------------------------------------------------");
    console.log(`Pipeline Execution Complete in ${elapsed}s!`);
    console.log(`Session ID: ${result.sessionId}`);
    console.log(`Models In Use:`, result.modelsInUse);
    console.log(`Total Events Processed: ${result.eventCount}`);
    console.log("Keys In Use:", result.keysInUse);
    console.log("-------------------------------------------------\n");

    console.log("=== FINAL RESPONSE OUTPUT SAMPLE ===");
    console.log(result.finalResponseText.slice(0, 1000) + (result.finalResponseText.length > 1000 ? "\n...[truncated]" : ""));

  } catch (err: any) {
    console.error("\n❌ Live ADK Test Failed:", err);
    process.exit(1);
  }
}

main();
