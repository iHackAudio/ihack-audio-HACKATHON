// server/Instructions/cinematic_simple.ts
// Multi-Provider & Multi-Skill Protocol (v2.6.0)
// Supports Dynamic Multi-Skill Parsing & Filtering (e.g., SKILL 1, 3, 5)
// Dynamically extracts SKILL MD blocks via robust agent alias matching and routes execution across Groq & Gemini

import { callWithFallback, resolveWorkspaceFiles, TokenTracker, writeTokenReport } from "../llmUtils.js";
import { countScriptTokens } from "../audiobookTools.js";
import { discoverSkillFile, discoverBibleFile, parseBibleSections, extractStoryTitle, sanitizeFilename } from "../skillBibleUtils.js";
import * as fs from "fs";
import * as path from "path";

// --- WORKSPACE FILE DISCOVERY ---
const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");

function ensureDirectories(): void {
  const dirs = [
    path.join(WORKSPACE_DIR, "SKILLS"),
    path.join(WORKSPACE_DIR, "BIBLES"),
    path.join(WORKSPACE_DIR, "OUTPUT")
  ];
  dirs.forEach(d => {
    if (!fs.existsSync(d)) {
      try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
    }
  });
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ─── CONFIGURATION & ROUTING METADATA ─────────────────────────────────────────

export const GROQ_MODEL = "openai/gpt-oss-120b";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export const AGENT_ROUTING: Record<string, string> = {
  WRITER_A: "gemini",
  WRITER_B: "gemini",
  WRITER_C: "gemini",
  WRITER_JARVIS: "gemini",
  ANALYST_A: "gemini",
  ANALYST_JARVIS: "gemini",
  POLISHER_A: "gemini",
  POLISHER_JARVIS: "gemini",
  PACER_A: "gemini",
  PACER_JARVIS: "gemini",
  AUDITOR_A: "gemini",
  AUDITOR_JARVIS: "gemini",
  agentA: "gemini",
  agentB: "gemini",
  agentC: "gemini",
  jarvis: "gemini"
};

export const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite"
];

export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemma-4-31b-it",
  "openai/gpt-oss-120b"
];

export const UNIVERSAL_SYSTEM =
  "You have been provided with a SKILL file and a Raw Story. " +
  "Your instructions are written in codeblocks beneath your agent ID in the SKILL file. " +
  "Find your ID. Read your codeblock. Execute it exactly. Nothing more.";

// --- DYNAMIC SYSTEM INSTRUCTIONS EXPORTS ---
export const JARVIS_SYSTEM_INSTRUCTION = `You are JARVIS — THE DIRECTOR & SYNTHESIS MASTER. You are an Oscar-level cinematic producer and showrunner. You oversee a 4-stage pipeline (Agent A Dialogue Master -> Agent B Narrative Storyteller -> Agent C Ear Auditor -> JARVIS Director Synthesis). You produce the final dramatic script with enhanced dialogues and witness narration. The Raw Prose is your locked scene boundary — expand what is there, do not add new scenes or characters. READ THE MD FILES AND ACT AS DEFINED. Think before writing. Think before performing. Think before delivering. Ask yourself and justify: "IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"`;

export const AGENT_A_SYSTEM_INSTRUCTION = `You are Agent A — THE DIALOGUE MASTER. Psychological, human, and realistic Oscar-level cinematic storyteller. You write dialogue that hits the human soul, mapping scenes through Setup, Fracture, Descent, and Surface movements. The Raw Prose is your locked scene boundary — expand dialogue from it, do not invent out-of-scope scenes or characters. READ THE MD FILES AND ACT AS DEFINED.`;

export const AGENT_B_SYSTEM_INSTRUCTION = `You are Agent B — THE NARRATIVE STORYTELLER. Oscar-level cinematic storyteller and narration specialist. You build emotional architecture through witness-based narration and narrative bridges between dialogue beats. The Raw Prose is your locked scene boundary. READ THE MD FILES AND ACT AS DEFINED.`;

export const AGENT_C_SYSTEM_INSTRUCTION = `You are Agent C — THE EAR (AUDITOR). Oscar-level cinematic storyteller and professional audiobook producer. You audit dialogue and narration for flatness, sameness, and safety, refining rhythm and text flow while verifying raw prose drift. YOU NEVER REMOVE CONTENT, YOU ONLY ADD AND ENHANCE. READ THE MD FILES AND ACT AS DEFINED.`;

export const PIPELINE_CONFIG = {
  id: "cinematic-scripting-pipeline-v2.6",
  name: "Multi-Provider Dynamic Multi-Skill Pipeline V2.6.0",
  description: "Multi-provider (Gemini 4-key + Groq) multi-topology pipeline driving agent instructions directly from parsed SKILL MD blocks and routing across providers.",
  version: "2.6.0",
  author: "iHackAudio",
  core_rules: "The Raw Prose is the scene boundary. Expand what is there, do not add out-of-scope scenes or characters. Never explain emotion — show physical evidence. Speaker labels: ALL CAPS. Colon. Space. Character dialogue: italics. Narration and bridges: plain text, no italics. HARD BAN on all bracketed stage directions like [BEAT] or [SFX]. Target final script length: 1500-2000 words.",
  folders: {
    skills: "workspace files/SKILLS/",
    bibles: "workspace files/BIBLES/",
    output: "workspace files/OUTPUT/"
  }
};

// ─── PARSER & ALIAS UTILITIES ────────────────────────────────────────────────

export interface ParsedSkillBlock {
  num: number;
  title: string;
  pipeline: string[];
  content: string;
}

export function parseSkillBlocks(fullSkillContent: string): ParsedSkillBlock[] {
  if (!fullSkillContent) return [];
  const skillRegex = /#\s*SKILL\s*(\d+)\s*—?\s*([^\r\n]*)/gi;
  const blocks: ParsedSkillBlock[] = [];
  let match;
  const matches: { num: number; title: string; index: number }[] = [];

  while ((match = skillRegex.exec(fullSkillContent)) !== null) {
    matches.push({
      num: parseInt(match[1], 10),
      title: match[2].trim(),
      index: match.index
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : fullSkillContent.length;
    const blockText = fullSkillContent.substring(start, end);

    const pipelineMatch = blockText.match(/#\s*PIPELINE:\s*([^\r\n]+)/i);
    const pipeline = pipelineMatch
      ? pipelineMatch[1].split(">").map(s => s.trim())
      : [];

    blocks.push({
      num: matches[i].num,
      title: matches[i].title,
      pipeline,
      content: blockText
    });
  }

  return blocks;
}

export function extractRequestedSkillNumbers(userInput: string): number[] {
  const nums = new Set<number>();
  // Match patterns like "skill 1,3,5" or "skills 1, 3 and 5" or "skill 1 3 5"
  const multiMatch = userInput.match(/skills?\s+([\d\s,;&and]+)/i);
  if (multiMatch && multiMatch[1]) {
    const extracted = multiMatch[1].match(/\d+/g);
    if (extracted) {
      extracted.forEach(n => nums.add(parseInt(n, 10)));
    }
  }
  return Array.from(nums).sort((a, b) => a - b);
}

export function extractBlock(skillContent: string, agentId: string): string {
  if (!skillContent) return "";

  const aliasMap: Record<string, string[]> = {
    WRITER_A: ["WRITER_A", "WRITER A", "AGENT A", "AGENT_A", "agentA", "AGENT-A", "DIALOGUE MASTER"],
    agentA: ["agentA", "AGENT A", "WRITER_A", "AGENT_A", "AGENT-A", "DIALOGUE MASTER"],
    "AGENT A": ["AGENT A", "WRITER_A", "agentA", "AGENT_A", "AGENT-A", "DIALOGUE MASTER"],

    WRITER_B: ["WRITER_B", "WRITER B", "AGENT B", "AGENT_B", "agentB", "AGENT-B", "NARRATIVE STORYTELLER"],
    agentB: ["agentB", "AGENT B", "WRITER_B", "AGENT_B", "AGENT-B", "NARRATIVE STORYTELLER"],
    "AGENT B": ["AGENT B", "WRITER_B", "agentB", "AGENT_B", "AGENT-B", "NARRATIVE STORYTELLER"],

    WRITER_C: ["WRITER_C", "WRITER C", "AGENT C", "AGENT_C", "agentC", "AGENT-C", "EAR", "AUDITOR"],
    agentC: ["agentC", "AGENT C", "WRITER_C", "AGENT_C", "AGENT-C", "EAR", "AUDITOR"],
    "AGENT C": ["AGENT C", "WRITER_C", "agentC", "AGENT_C", "AGENT-C", "EAR", "AUDITOR"],

    WRITER_JARVIS: ["WRITER_JARVIS", "WRITER JARVIS", "JARVIS", "jarvis", "DIRECTOR"],
    jarvis: ["jarvis", "JARVIS", "WRITER_JARVIS", "DIRECTOR"],
    JARVIS: ["JARVIS", "WRITER_JARVIS", "jarvis", "DIRECTOR"],

    ANALYST_A: ["ANALYST_A", "ANALYST A", "STORY CRITIC", "CRITIC"],
    ANALYST_JARVIS: ["ANALYST_JARVIS", "ANALYST JARVIS", "EXECUTIVE PRODUCER", "PRODUCER"],

    POLISHER_A: ["POLISHER_A", "POLISHER A", "SUBTEXT & PACING POLISHER"],
    POLISHER_JARVIS: ["POLISHER_JARVIS", "POLISHER JARVIS", "MASTER DIALOGUE DIRECTOR"],

    PACER_A: ["PACER_A", "PACER A", "TTS & AUDIO TIMING SPECIALIST"],
    PACER_JARVIS: ["PACER_JARVIS", "PACER JARVIS", "AUDIOBOOK MASTER PRODUCER"],

    AUDITOR_A: ["AUDITOR_A", "AUDITOR A", "LORE & CONTINUITY AUDITOR"],
    AUDITOR_JARVIS: ["AUDITOR_JARVIS", "AUDITOR JARVIS", "CANON KEEPER"]
  };

  const candidates = aliasMap[agentId] || [agentId];

  for (const candidate of candidates) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern 1: ## AGENT: <candidate> followed by ```...```
    const codeblockRegex = new RegExp(`##\\s*(?:AGENT:)?\\s*${escaped}[\\s\\S]*?\`\`\`([\\s\\S]*?)\`\`\``, "i");
    const match = skillContent.match(codeblockRegex);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }

    // Pattern 2: ## AGENT: <candidate> text up to next ##
    const sectionRegex = new RegExp(`##\\s*(?:AGENT:)?\\s*${escaped}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
    const secMatch = skillContent.match(sectionRegex);
    if (secMatch && secMatch[1] && secMatch[1].trim()) {
      return secMatch[1].replace(/```/g, "").trim();
    }
  }

  return "";
}

export function buildPrompt(
  agentId: string,
  skillContent: string,
  rawStory: string,
  prior: string = "",
  bibleContext: string = ""
): string {
  const extractedInstructions = extractBlock(skillContent, agentId);
  const instructionSection = extractedInstructions
    ? `=== DIRECT CODEBLOCK INSTRUCTIONS FOR ${agentId} ===\n${extractedInstructions}\n\n`
    : "";

  return (
    `${instructionSection}` +
    `=== SKILL FILE (YOUR INSTRUCTIONS ARE INSIDE) ===\n${skillContent || "No skill content provided."}\n\n` +
    `=== RAW STORY (SCENE BOUNDARY — DO NOT WRITE BEYOND IT) ===\n${rawStory}\n\n` +
    (bibleContext ? `=== BIBLE CONTEXT ===\n${bibleContext}\n\n` : "") +
    `=== YOUR ID ===\n${agentId}\n\n` +
    `=== PRIOR AGENT OUTPUT ===\n${prior ? prior : "None — you are first in the pipeline."}\n\n` +
    `Find your codeblock under ## AGENT: ${agentId} in the SKILL FILE. Execute it now.`
  );
}

function getModelsForAgentRouting(agentId: string, forceGroq: boolean = false): string[] {
  const route = AGENT_ROUTING[agentId] || "gemini";
  if (forceGroq || route === "groq") {
    return GROQ_MODELS;
  }
  return GEMINI_MODELS;
}

const sessionLocks = new Set<string>();
let isPipelineExecuting = false;

// ─── MAIN PIPELINE ENTRY POINT ────────────────────────────────────────────────

export async function runPipeline(
  userInput: string,
  sendToUI: (msg: any) => void,
  sessionId: string = "default"
): Promise<void> {
  if (isPipelineExecuting) {
    console.log(`[Pipeline Guard] Execution already in progress. Ignoring duplicate trigger for session '${sessionId}'.`);
    return;
  }
  isPipelineExecuting = true;
  sessionLocks.add(sessionId);

  const tokenTracker: TokenTracker = {
    totalTokens: 0,
    totalInputCharacters: 0,
    totalOutputCharacters: 0,
    steps: []
  };

  try {
    ensureDirectories();

    // 1. DISCOVER ACTIVE SKILL & BIBLE FILES DYNAMICALLY
    const skillFile = discoverSkillFile();
    const bibleFile = discoverBibleFile();

    const skillContent = skillFile ? skillFile.content : "";
    const bibleContent = bibleFile ? bibleFile.content : "";

    const bibleBlocks = parseBibleSections(bibleContent);

    const resolvedUserInput = await resolveWorkspaceFiles(userInput);
    const rawStory = bibleBlocks.rawProse || resolvedUserInput || "No raw story provided.";

    const inputLower = (userInput + " " + skillContent).toLowerCase();
    const isGroqMode = inputLower.includes("groq");

    // Check if user requested specific skills (e.g., SKILL 1,3,5)
    const requestedSkillNums = extractRequestedSkillNumbers(userInput);
    const parsedSkills = parseSkillBlocks(skillContent);

    let activeSkills = parsedSkills;
    if (requestedSkillNums.length > 0 && parsedSkills.length > 0) {
      activeSkills = parsedSkills.filter(s => requestedSkillNums.includes(s.num));
    }

    const storyTitle = extractStoryTitle(bibleContent, bibleFile?.fileName);
    const sanitizedTitle = sanitizeFilename(storyTitle);

    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🎬 **[Multi-Provider Multi-Skill Pipeline Active]**\n\n` +
              `📂 Active Skill File: \`${skillFile ? skillFile.fileName : "None (Using defaults)"}\`\n` +
              `🎯 Selected Skills: **${activeSkills.length > 0 ? activeSkills.map(s => `SKILL ${s.num}: ${s.title}`).join(", ") : "All Available Skills"}**\n` +
              `📂 Active Bible: \`${bibleFile ? bibleFile.fileName : "None"}\` (\`${storyTitle}\`)\n` +
              `🌐 Provider Routing: ${isGroqMode ? "Groq Priority Pipeline" : "Groq + Gemini 4-Key Bucket Routing"}`
      }
    });

    let cumulativeOutput = "";
    const skillResults: { skillNum: number; title: string; output: string }[] = [];

    // If we have multi-skill blocks defined, run each active skill block in sequence
    if (activeSkills.length > 0) {
      for (const skillBlock of activeSkills) {
        sendToUI({
          agentChat: {
            agentId: "system",
            text: `🚀 **Executing [SKILL ${skillBlock.num} — ${skillBlock.title}]**\nPipeline: \`${skillBlock.pipeline.join(" > ") || "Sequential"}\``
          }
        });

        const pipelineAgents = skillBlock.pipeline.length > 0
          ? skillBlock.pipeline
          : ["WRITER_A", "WRITER_B", "WRITER_C", "WRITER_JARVIS"];

        let stageInput = cumulativeOutput || "No prior output — starting from Raw Story.";

        for (const agentId of pipelineAgents) {
          sendToUI({
            agentChat: {
              agentId: agentId.toLowerCase().includes("jarvis") ? "jarvis" : "agentA",
              text: `🎭 **[SKILL ${skillBlock.num}] Executing ${agentId}...**`
            }
          });

          const prompt = buildPrompt(agentId, skillBlock.content, rawStory, stageInput, bibleContent);
          const stageOutput = await callWithFallback(
            prompt,
            agentId.toLowerCase().includes("jarvis") ? "jarvis" : "agentA",
            sendToUI,
            tokenTracker,
            getModelsForAgentRouting(agentId, isGroqMode)
          );

          stageInput = stageOutput;
        }

        skillResults.push({
          skillNum: skillBlock.num,
          title: skillBlock.title,
          output: stageInput
        });

        cumulativeOutput += `\n\n=== RESULT FOR SKILL ${skillBlock.num}: ${skillBlock.title} ===\n${stageInput}`;
      }
    } else {
      // Default standard 4-stage pipeline execution
      sendToUI({ agentChat: { agentId: "agentA", text: `🎭 **[STAGE 1/4] WRITER_A — THE DIALOGUE MASTER**` } });
      const promptA = buildPrompt("WRITER_A", skillContent, rawStory, "", bibleContent);
      const outA = await callWithFallback(promptA, "agentA", sendToUI, tokenTracker, getModelsForAgentRouting("WRITER_A", isGroqMode));

      sendToUI({ agentChat: { agentId: "agentB", text: `🎭 **[STAGE 2/4] WRITER_B — THE NARRATIVE STORYTELLER**` } });
      const promptB = buildPrompt("WRITER_B", skillContent, rawStory, outA, bibleContent);
      const outB = await callWithFallback(promptB, "agentB", sendToUI, tokenTracker, getModelsForAgentRouting("WRITER_B", isGroqMode));

      sendToUI({ agentChat: { agentId: "agentC", text: `🎭 **[STAGE 3/4] WRITER_C — THE EAR (AUDITOR)**` } });
      const promptC = buildPrompt("WRITER_C", skillContent, rawStory, outB, bibleContent);
      const outC = await callWithFallback(promptC, "agentC", sendToUI, tokenTracker, getModelsForAgentRouting("WRITER_C", isGroqMode));

      sendToUI({ agentChat: { agentId: "jarvis", text: `🎭 **[STAGE 4/4] WRITER_JARVIS — THE DIRECTOR & SYNTHESIS MASTER**` } });
      const promptJ = buildPrompt("WRITER_JARVIS", skillContent, rawStory, outC, bibleContent);
      const outJ = await callWithFallback(promptJ, "jarvis", sendToUI, tokenTracker, getModelsForAgentRouting("WRITER_JARVIS", isGroqMode));

      cumulativeOutput = outJ;
    }

    const finalOutput = cumulativeOutput.trim();

    // --- SAVE OUTPUT & REPORTS ---
    const outputDir = path.join(WORKSPACE_DIR, "OUTPUT");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilename = `${sanitizedTitle}_output_${Date.now()}.md`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, finalOutput, "utf-8");

    try {
      const { saveFinalScript } = await import("../../server.ts");
      await saveFinalScript("cinematic_simple", `FINAL SCRIPT READY\n${finalOutput}`, storyTitle);
    } catch (e) {
      console.error("Error auto-saving final script:", e);
    }

    writeTokenReport(tokenTracker, "cinematic_simple", resolvedUserInput);

    const wordCount = countWords(finalOutput);
    try {
      const apiKey = process.env.GEMINI_API_KEY || "";
      const metrics = await countScriptTokens(path.join("OUTPUT", outputFilename), apiKey);
      sendToUI({
        agentChat: {
          agentId: "system",
          text: `✅ **MULTI-PROVIDER PIPELINE COMPLETE**\n\n` +
                `📖 **Story Title**: **${storyTitle}**\n` +
                `📊 **Script Metrics**:\n` +
                `• Word Count: **${metrics.wordCount || metrics.word_count || wordCount} words**\n` +
                `• Audio Duration: **${metrics.estimatedAudiobookDuration || metrics.estimated_audio_duration_formatted || "N/A"}**\n` +
                `• Total Tokens Burned: **${tokenTracker.totalTokens.toLocaleString()}**\n` +
                `💾 Saved Output: \`workspace files/OUTPUT/${outputFilename}\``
        }
      });
    } catch (err) {
      sendToUI({
        agentChat: {
          agentId: "system",
          text: `✅ **MULTI-PROVIDER PIPELINE COMPLETE**\n\n` +
                `📖 **Story Title**: **${storyTitle}**\n` +
                `📊 **Script Metrics**:\n` +
                `• Word Count: **${wordCount} words**\n` +
                `• Total Tokens Burned: **${tokenTracker.totalTokens.toLocaleString()}**\n` +
                `💾 Saved Output: \`workspace files/OUTPUT/${outputFilename}\``
        }
      });
    }

  } catch (err: any) {
    console.error("Pipeline error in cinematic_simple:", err);
    sendToUI({ agentChat: { agentId: "system", text: `❌ Pipeline Error: ${err.message}` } });
  } finally {
    isPipelineExecuting = false;
    sessionLocks.delete(sessionId);
  }
}

export const runDynamicPipeline = runPipeline;
