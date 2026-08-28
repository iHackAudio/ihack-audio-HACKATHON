import { runADKStoryPipeline, DEFAULT_MODEL, WORKSPACE_DIR } from "../adk/storyProductionAdk.ts";
import { resolveWorkspaceFiles } from "../llmUtils.js";
import { loadAgentConfigs } from "../agentConfigManager.js";
import * as fs from "fs";
import * as path from "path";

// ----------------------------------------------------------------------------
// System Instructions Exports for Settings Panel / Swarm Board
// ----------------------------------------------------------------------------

export const AGENT_A_SYSTEM_INSTRUCTION = `You are the Google ADK Concept Development Agent (Agent A — Skill 1: Concept Development) for Cinematic Audiobooks.
Your goal:
Analyze the user's premise, genre, and emotional ideas and produce a strictly structured CONCEPT SUMMARY formatted as:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPT SUMMARY — [STORY TITLE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENRE:          [1-3 words]
TONE:           [1-3 words]
FORMAT:         [Audiobook / Cinematic Audio]
INSPIRED BY:    [Context]

CORE PREMISE:
[2-3 sentences]

THE EMOTIONAL CORE:
[1 sentence: What listener FEELS at the very end]

THE SECRET UNDERNEATH:
[What this story is REALLY about]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Follow all directives in workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md.`;

export const AGENT_B_SYSTEM_INSTRUCTION = `You are the Google ADK Character Bible Agent (Agent B — Skill 2: Character Bible Creator).
For every character in the concept, define:
- ROLE, NATURE, FUNCTION, ARC
- VOICE PROFILE: One line description of voice resonance and tone
- DIRECTOR'S NOTE: 2-3 sentences for voice actors
- SUB-PROFILES (at least 4 emotional/vocal modes per character, e.g., Whispered Panic, Cold Command, Nostalgic Warmth, Unhinged Frenzy)
Follow all directives in workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md.`;

export const AGENT_C_SYSTEM_INSTRUCTION = `You are the Google ADK Scene Breakdown Architect (Agent C — Skill 3: Scene Breakdown Architect).
Structure every episode into EXACTLY 4 scenes:
Each episode needs:
- EPISODE FUNCTION, EMOTIONAL ARC, CLIFFHANGER
Each scene needs:
- SCENE TITLE, FUNCTION, CHARACTERS, SETTING (sonic environment), EMOTIONAL BEAT
- THIS SCENE MUST (3 specific requirements)
Follow all directives in workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md.`;

export const JARVIS_SYSTEM_INSTRUCTION = `You are the Google ADK Lead Script Writer & Audio Assembler Agent (Jarvis — Skill 4: Script Writer & Lead).
Write immersive, dialogue-rich narrative script using the Context Anchor, Character Sub-Profiles, and Scene Briefs.
At the end of each scene, call count_script_tokens to calculate performance metrics and save the completed output using write_workspace_file to workspace files.
Follow all directives in workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md.`;

const sessionLocks = new Set<string>();

export async function runPipeline(
  userInput: string,
  sendToUI: (msg: any) => void,
  sessionId: string = "default"
): Promise<void> {
  if (sessionLocks.has(sessionId)) {
    sendToUI({ agentChat: { agentId: "system", text: "⚠️ Google ADK Story Pipeline already running for this session." } });
    return;
  }
  sessionLocks.add(sessionId);

  try {
    const configs = loadAgentConfigs();

    const modelA = configs.agentA?.model || DEFAULT_MODEL;
    const modelB = configs.agentB?.model || DEFAULT_MODEL;
    const modelC = configs.agentC?.model || DEFAULT_MODEL;
    const modelJarvis = configs.jarvis?.model || DEFAULT_MODEL;

    sendToUI({
      agentChat: {
        agentId: "jarvis",
        text: `🚀 **[GOOGLE ADK STORY PIPELINE INITIATED]**\n\nLaunching Google ADK Multi-Agent Sequential Pipeline across 4 dedicated Swarm Nodes:\n• 💡 **Agent A (ConceptDeveloper)**: \`${modelA}\`\n• 🎭 **Agent B (CharacterBibleCreator)**: \`${modelB}\`\n• 🎬 **Agent C (SceneBreakdownArchitect)**: \`${modelC}\`\n• 📜 **JARVIS (ScriptWriter & Lead)**: \`${modelJarvis}\`\n\n*Reference Skill Doc: \`root/workspace files/STORY_PRODUCTION_SKILL_SYSTEM.md\`*`
      }
    });

    sendToUI({ agentChat: { agentId: "jarvis", text: "🔍 Resolving workspace files and scanning user input context..." } });
    const resolvedInput = await resolveWorkspaceFiles(userInput);

    const agentIdMap: Record<string, string> = {
      "ConceptDeveloper": "agentA",
      "CharacterBibleCreator": "agentB",
      "SceneBreakdownArchitect": "agentC",
      "ScriptWriter": "jarvis"
    };

    const agentDisplayNameMap: Record<string, string> = {
      "ConceptDeveloper": "💡 Agent A (Concept Developer)",
      "CharacterBibleCreator": "🎭 Agent B (Character Bible Creator)",
      "SceneBreakdownArchitect": "🎬 Agent C (Scene Breakdown Architect)",
      "ScriptWriter": "📜 JARVIS (Lead Script Writer)"
    };

    let fullScriptOutput = "";
    const activeOutputs: Record<string, string> = {};

    const result = await runADKStoryPipeline({
      userPrompt: resolvedInput,
      sessionId,
      modelName: DEFAULT_MODEL,
      agentModels: {
        conceptModel: modelA,
        characterModel: modelB,
        sceneModel: modelC,
        scriptModel: modelJarvis
      },
      agentInstructions: {
        conceptInstruction: configs.agentA?.systemInstruction || AGENT_A_SYSTEM_INSTRUCTION,
        characterInstruction: configs.agentB?.systemInstruction || AGENT_B_SYSTEM_INSTRUCTION,
        sceneInstruction: configs.agentC?.systemInstruction || AGENT_C_SYSTEM_INSTRUCTION,
        scriptInstruction: configs.jarvis?.systemInstruction || JARVIS_SYSTEM_INSTRUCTION
      },
      onEvent: (event: any) => {
        const author = event.author || "System";
        const uiAgentId = agentIdMap[author] || "jarvis";
        const displayName = agentDisplayNameMap[author] || author;

        if (event.content && event.content.parts) {
          let textChunk = "";
          for (const part of event.content.parts) {
            if ("text" in part && part.text) {
              textChunk += part.text;
            }
          }

          if (textChunk.trim()) {
            if (!activeOutputs[author]) {
              activeOutputs[author] = "";
              sendToUI({
                agentChat: {
                  agentId: uiAgentId,
                  text: `**[${displayName} — Active]**\n\n`
                }
              });
            }

            activeOutputs[author] += textChunk;

            sendToUI({
              agentChat: {
                agentId: uiAgentId,
                text: textChunk
              }
            });

            if (author === "ScriptWriter") {
              fullScriptOutput += textChunk + "\n";
            }
          }
        }
      }
    });

    const outputText = result.finalResponseText || fullScriptOutput || Object.values(activeOutputs).join("\n\n");
    const finalFilename = "adk_cinematic_story_master.md";

    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(WORKSPACE_DIR, finalFilename), outputText, "utf-8");

    sendToUI({
      agentChat: {
        agentId: "system",
        text: `💾 **[WORKSPACE SAVED]** Master artifact saved to \`workspace files/${finalFilename}\` (${outputText.length} characters).`
      }
    });

    sendToUI({
      agentChat: {
        agentId: "jarvis",
        text: `🏁 **[GOOGLE ADK PIPELINE COMPLETE]**\n\nAll 4 agents executed successfully!\n- **Agents Engaged**: Agent A, Agent B, Agent C, JARVIS\n- **Models**: ${JSON.stringify(result.modelsInUse)}\n- **API Keys**: Dedicated per agent node (${JSON.stringify(result.keysInUse)})\n- **Events Processed**: ${result.eventCount}\n- **Saved Location**: \`root/workspace files/${finalFilename}\``
      }
    });

  } catch (err: any) {
    console.error("[ADK Story Protocol Error]:", err);
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `❌ **[ADK PIPELINE ERROR]**: ${err.message || String(err)}`
      }
    });
  } finally {
    sessionLocks.delete(sessionId);
  }
}
