// server/Instructions/cinematic_3agent_story.ts
// Master 4-Stage Cinematic Scripting Pipeline V2 (v2.4.0)
// Source-of-truth driven by dynamic Skill and Bible discovery.
// Bounded by the Raw Prose scene seed, with targeted context delivery per agent
// and strict word count targets (1500-2000 words publication-ready final script).

import { callWithFallback, resolveWorkspaceFiles, TokenTracker, writeTokenReport } from "../llmUtils.js";
import { countScriptTokens } from "../audiobookTools.js";
import * as fs from "fs";
import * as path from "path";

// --- SYSTEM INSTRUCTIONS EXPORTS FOR CONVERSATIONAL / SINGLE-AGENT MODE ---
export const JARVIS_SYSTEM_INSTRUCTION = `You are JARVIS — THE DIRECTOR & SYNTHESIS MASTER. You are an Oscar-level cinematic producer and showrunner. You oversee a 4-stage pipeline (Agent A Dialogue Master -> Agent B Narrative Storyteller -> Agent C Ear Auditor -> JARVIS Director Synthesis). You produce the final dramatic script with enhanced dialogues and witness narration. The Raw Prose is your locked scene boundary — expand what is there, do not add new scenes or characters. READ THE MD FILES AND ACT AS DEFINED. Think before writing. Think before performing. Think before delivering. Ask yourself and justify: "IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"`;

export const AGENT_A_SYSTEM_INSTRUCTION = `You are Agent A — THE DIALOGUE MASTER. Psychological, human, and realistic Oscar-level cinematic storyteller. You write dialogue that hits the human soul, mapping scenes through Setup, Fracture, Descent, and Surface movements. The Raw Prose is your locked scene boundary — expand dialogue from it, do not invent out-of-scope scenes or characters. READ THE MD FILES AND ACT AS DEFINED.`;

export const AGENT_B_SYSTEM_INSTRUCTION = `You are Agent B — THE NARRATIVE STORYTELLER. Oscar-level cinematic storyteller and narration specialist. You build emotional architecture through witness-based narration and narrative bridges between dialogue beats. The Raw Prose is your locked scene boundary. READ THE MD FILES AND ACT AS DEFINED.`;

export const AGENT_C_SYSTEM_INSTRUCTION = `You are Agent C — THE EAR (AUDITOR). Oscar-level cinematic storyteller and professional audiobook producer. You audit dialogue and narration for flatness, sameness, and safety, refining rhythm and text flow while verifying raw prose drift. YOU NEVER REMOVE CONTENT, YOU ONLY ADD AND ENHANCE. READ THE MD FILES AND ACT AS DEFINED.`;

// --- PIPELINE CONFIG & CORE RULES ---
export const PIPELINE_CONFIG = {
  id: "cinematic-scripting-pipeline-v2",
  name: "Cinematic Scripting Pipeline V2",
  description: "Master 4-stage cinematic audiobook pipeline v2.4.0. Bounded strictly by Raw Prose, delivering targeted context to each agent and expanding script to publication-ready 1500-2000 words.",
  version: "2.4.0",
  author: "iHackAudio",
  core_rules: "The Raw Prose is the scene boundary. Expand what is there, do not add out-of-scope scenes or characters. Never explain emotion — show physical evidence. Speaker labels: ALL CAPS. Colon. Space. Character dialogue: italics. Narration and bridges: plain text, no italics. HARD BAN on all bracketed stage directions like [BEAT] or [SFX]. Target final script length: 1500-2000 words.",
  folders: {
    skills: "workspace files/SKILLS/",
    bibles: "workspace files/BIBLES/",
    output: "workspace files/OUTPUT/"
  },
  phases: [
    {
      id: "phase-1",
      agent_id: "agentA",
      agent_name: "Agent A",
      role_name: "THE DIALOGUE MASTER",
      role_description: "Psychological, human, and realistic Oscar-level cinematic storyteller. Excavates dialogue moments from Raw Prose, mapping scenes through Setup, Fracture, Descent, and Surface movements (~800-1000 words).",
      target_words: 900,
      output_format: "expanded"
    },
    {
      id: "phase-2",
      agent_id: "agentB",
      agent_name: "Agent B",
      role_name: "THE NARRATIVE STORYTELLER",
      role_description: "Oscar-level cinematic storyteller and narration specialist. Weaves witness narration and narrative bridges around dialogue beats within Raw Prose boundary (~1000-1300 words).",
      target_words: 1150,
      output_format: "expanded"
    },
    {
      id: "phase-3",
      agent_id: "agentC",
      agent_name: "Agent C",
      role_name: "THE EAR (AUDITOR)",
      role_description: "Oscar-level cinematic storyteller and professional audiobook producer. Audits script for flatness, machine tone, named emotions, and raw prose drift (~1300-1600 words).",
      target_words: 1450,
      output_format: "expanded"
    },
    {
      id: "phase-4",
      agent_id: "jarvis",
      agent_name: "JARVIS",
      role_name: "THE DIRECTOR & SYNTHESIS MASTER",
      role_description: "Final-stage director and synthesis master. Refines audited draft into publication-ready 1500-2000 word cinematic script in easy-going, accessible English.",
      target_words: 1750,
      output_format: "final"
    }
  ]
};

// --- WORKSPACE FILE DISCOVERY ---
const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");

function ensureDirectories(): void {
  const dirs = [
    path.join(WORKSPACE_DIR, "SKILLS"),
    path.join(WORKSPACE_DIR, "BIBLES"),
    path.join(WORKSPACE_DIR, "OUTPUT"),
  ];
  dirs.forEach(d => {
    if (!fs.existsSync(d)) {
      try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
    }
  });
}

interface DiscoveredFile {
  fileName: string;
  filePath: string;
  content: string;
}

function discoverSkillFile(): DiscoveredFile | null {
  const possiblePaths = [
    path.join(WORKSPACE_DIR, "SKILLS"),
    path.join(process.cwd(), "workspace files", "SKILLS"),
    WORKSPACE_DIR
  ];

  for (const dirPath of possiblePaths) {
    if (!fs.existsSync(dirPath)) continue;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".md") && !file.toLowerCase().includes("readme")) {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isFile()) {
            const content = fs.readFileSync(fullPath, "utf-8");
            return { fileName: file, filePath: fullPath, content };
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

function discoverBibleFile(): DiscoveredFile | null {
  const possiblePaths = [
    path.join(WORKSPACE_DIR, "BIBLES"),
    path.join(process.cwd(), "workspace files", "BIBLES"),
    WORKSPACE_DIR
  ];

  for (const dirPath of possiblePaths) {
    if (!fs.existsSync(dirPath)) continue;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".md") && !file.toLowerCase().includes("readme")) {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isFile()) {
            const content = fs.readFileSync(fullPath, "utf-8");
            return { fileName: file, filePath: fullPath, content };
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

// --- PARSER UTILITIES ---
function parseSkillSections(skillContent: string) {
  const allAgentsMatch = skillContent.match(/##\s+ALL AGENTS\s*[\r\n]+```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const allAgents = allAgentsMatch ? allAgentsMatch[1].trim() : "";

  const agentAMatch = skillContent.match(/##\s+AGENT:\s*AGENT A[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentA = agentAMatch ? agentAMatch[1].trim() : "";

  const agentBMatch = skillContent.match(/##\s+AGENT:\s*AGENT B[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentB = agentBMatch ? agentBMatch[1].trim() : "";

  const agentCMatch = skillContent.match(/##\s+AGENT:\s*AGENT C[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentC = agentCMatch ? agentCMatch[1].trim() : "";

  const jarvisMatch = skillContent.match(/##\s+AGENT:\s*JARVIS[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const jarvis = jarvisMatch ? jarvisMatch[1].trim() : "";

  const globalRulesMatch = skillContent.match(/##\s+GLOBAL RULES and OUTPUT FORMAT\s*[\r\n]+```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const globalRules = globalRulesMatch ? globalRulesMatch[1].trim() : "";

  return { allAgents, agentA, agentB, agentC, jarvis, globalRules };
}

function parseBibleSections(bibleContent: string) {
  const rawProseMatch = bibleContent.match(/####?\s*Raw Prose[\s\S]*?\n([\s\S]*?)(?=\n###?|\n##?|$)/i);
  const rawProse = rawProseMatch ? rawProseMatch[1].trim() : bibleContent;

  const cpsdMatch = bibleContent.match(/####?\s*Cinematic Prose Scene Document[\s\S]*?\n([\s\S]*?)(?=\n####?\s*Raw Prose|\n###?|\n##?|$)/i);
  const cpsdBlueprint = cpsdMatch ? cpsdMatch[1].trim() : "";

  const charactersMatch = bibleContent.match(/##\s*4\.\s*CHARACTER PROFILES[\s\S]*?\n([\s\S]*?)(?=\n##\s*5\.|\n##\s*[0-9]|$)/i);
  const characterProfiles = charactersMatch ? charactersMatch[1].trim() : "";

  const conceptMatch = bibleContent.match(/##\s*1\.\s*PROJECT CONCEPT[\s\S]*?\n([\s\S]*?)(?=\n##\s*2\.|\n##\s*[0-9]|$)/i);
  const projectConcept = conceptMatch ? conceptMatch[1].trim() : "";

  return { rawProse, cpsdBlueprint, characterProfiles, projectConcept };
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// --- MAIN PIPELINE EXECUTION ---
const sessionLocks = new Set<string>();

export async function runPipeline(
  userInput: string,
  sendToUI: (msg: any) => void,
  sessionId: string = "default"
): Promise<void> {
  if (sessionLocks.has(sessionId)) {
    sendToUI({ agentChat: { agentId: "system", text: "⚠️ Pipeline execution is already in progress for this session." } });
    return;
  }
  sessionLocks.add(sessionId);

  const tokenTracker: TokenTracker = {
    totalTokens: 0,
    totalInputCharacters: 0,
    totalOutputCharacters: 0,
    steps: []
  };

  try {
    ensureDirectories();

    // 1. DISCOVER SKILL & BIBLE FILES
    const skillFile = discoverSkillFile();
    const bibleFile = discoverBibleFile();

    const skillContent = skillFile ? skillFile.content : "";
    const bibleContent = bibleFile ? bibleFile.content : "";

    const skillBlocks = parseSkillSections(skillContent);
    const bibleBlocks = parseBibleSections(bibleContent);

    const resolvedUserInput = await resolveWorkspaceFiles(userInput);

    // 2. ANNOUNCE PIPELINE START
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🎬 **[Cinematic Scripting Pipeline V2 (v2.4.0)]**\n\n` +
              `📂 Skill File: \`${skillFile ? skillFile.fileName : "filename_SKILL.md"}\`\n` +
              `📂 Bible File: \`${bibleFile ? bibleFile.fileName : "filename_BIBLE.md"}\`\n` +
              `🔒 Locked Scene Boundary: Raw Prose Seed (~800 words)\n` +
              `⚡ Targeted Context Routing: Executing 4-Stage Multi-Agent Pipeline (Agent A → Agent B → Agent C → JARVIS)...`
      }
    });

    const phaseOutputs = new Map<string, string>();
    let accumulatedDraft = "";

    // --- PHASE 1: AGENT A (THE DIALOGUE MASTER) ---
    // Target Context: Role instruction, Character profiles, CPSD Scene Blueprint, Raw Prose, User request
    sendToUI({
      agentChat: {
        agentId: "agentA",
        text: `🎭 **[STAGE 1/4] Agent A — THE DIALOGUE MASTER**`
      }
    });

    const agentAPrompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks.allAgents || "Think before writing. Think before performing. Think before delivering. Ask yourself: IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"}

=== YOUR ROLE: AGENT A (THE DIALOGUE MASTER) ===
${skillBlocks.agentA || PIPELINE_CONFIG.phases[0].role_description}

=== CORE SCENE BOUNDARY RULE ===
The Raw Prose is the LOCKED scene boundary. Everything you write must expand FROM it — not beyond it.
Do not add scenes, locations, or characters that do not exist in the Raw Prose.

=== GLOBAL FORMAT & HARD BANS ===
Speaker labels: ALL CAPS. Colon. Space. (e.g. HOLMES: )
Dialogue: *italics*
Narration: plain text
PROHIBITED TAGS (HARD BAN): [BEAT], [ATMOSPHERE: ...], [PAUSE], [SFX: ...], or ANY bracketed stage directions. Write physical action in plain text prose instead.

=== CHARACTER PROFILES (TARGETED CONTEXT) ===
${bibleBlocks.characterProfiles}

=== CPSD SCENE BLUEPRINT (TARGETED CONTEXT) ===
${bibleBlocks.cpsdBlueprint}

=== RAW PROSE (LOCKED MASTER SKELETON) ===
${bibleBlocks.rawProse}

=== USER SCENE REQUEST ===
${resolvedUserInput}

=== TASK FOR AGENT A ===
1. Map the scene into 4 movements: SETUP, FRACTURE, DESCENT, SURFACE.
2. Excavate dialogue beats directly from the Raw Prose, adding psychological subtext, dramatic pauses, and pacing drops.
3. Stay strictly inside the Raw Prose scene boundary.
4. Output your movement map and the expanded dialogue draft (~800–1000 words).`;

    let agentAOutput = await callWithFallback(agentAPrompt, "agentA", sendToUI, tokenTracker);

    if (countWords(agentAOutput) < 650) {
      sendToUI({ glassBoxEvent: "⚡ Agent A output under length target (~800–1000 words). Executing targeted dialogue expansion..." });
      const expansionPrompt = `=== DIALOGUE EXPANSION PASS (STAY INSIDE RAW PROSE) ===
Your previous draft was ${countWords(agentAOutput)} words. Target is ~800–1000 words.
Deepen character subtext and pacing drops across SETUP, FRACTURE, DESCENT, SURFACE without introducing new scenes or characters outside the Raw Prose.

=== RAW PROSE SKELETON ===
${bibleBlocks.rawProse}

=== YOUR PREVIOUS DRAFT ===
${agentAOutput}

=== EXPANDED DIALOGUE SCRIPT (~800–1000 WORDS) ===`;
      agentAOutput = await callWithFallback(expansionPrompt, "agentA", sendToUI, tokenTracker);
    }

    phaseOutputs.set("agentA", agentAOutput);
    accumulatedDraft = agentAOutput;

    // --- PHASE 2: AGENT B (THE NARRATIVE STORYTELLER) ---
    // Target Context: Role instruction, Raw Prose, Agent A's output, User request
    sendToUI({
      agentChat: {
        agentId: "agentB",
        text: `🎭 **[STAGE 2/4] Agent B — THE NARRATIVE STORYTELLER**`
      }
    });

    const agentBPrompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks.allAgents}

=== YOUR ROLE: AGENT B (THE NARRATIVE STORYTELLER) ===
${skillBlocks.agentB || PIPELINE_CONFIG.phases[1].role_description}

=== CORE SCENE BOUNDARY RULE ===
The Raw Prose is the LOCKED scene boundary. Weave witness narration and narrative bridges around Agent A's dialogue beats.
Do not add scenes, locations, or characters that do not exist in the Raw Prose.

=== GLOBAL FORMAT & HARD BANS ===
Speaker labels: ALL CAPS. Colon. Space. (e.g. WATSON: )
Dialogue: *italics*
Narration: plain text
PROHIBITED TAGS (HARD BAN): [BEAT], [ATMOSPHERE: ...], [PAUSE], [SFX: ...], or ANY bracketed stage directions.

=== RAW PROSE (MASTER SOURCE FOR BRIDGES) ===
${bibleBlocks.rawProse}

=== AGENT A DIALOGUE MAP & DRAFT ===
${accumulatedDraft}

=== USER SCENE REQUEST ===
${resolvedUserInput}

=== TASK FOR AGENT B ===
1. Self-Check: Ask yourself "What is the character most afraid to feel in this scene?"
2. Weave witness-style narration (Shawshank / Attenborough / Apocalypse Now) and short narrative bridges (max 3 lines) around Agent A's dialogue.
3. Open the scene with vivid room/sound placement, bridge emotional shifts, and close on a physical detail that keeps the wound open.
4. Output integrated narrative & dialogue script (~1000–1300 words).`;

    let agentBOutput = await callWithFallback(agentBPrompt, "agentB", sendToUI, tokenTracker);

    if (countWords(agentBOutput) < 850) {
      sendToUI({ glassBoxEvent: "⚡ Agent B output under length target (~1000–1300 words). Executing narrative expansion..." });
      const expansionPrompt = `=== NARRATIVE EXPANSION PASS (STAY INSIDE RAW PROSE) ===
Your previous script was ${countWords(agentBOutput)} words. Target is ~1000–1300 words.
Enrich the witness narration, add deeper sensory narrative bridges after fracture lines, and stay strictly inside the Raw Prose boundary.

=== RAW PROSE SKELETON ===
${bibleBlocks.rawProse}

=== YOUR PREVIOUS SCRIPT ===
${agentBOutput}

=== EXPANDED NARRATIVE & DIALOGUE SCRIPT (~1000–1300 WORDS) ===`;
      agentBOutput = await callWithFallback(expansionPrompt, "agentB", sendToUI, tokenTracker);
    }

    phaseOutputs.set("agentB", agentBOutput);
    accumulatedDraft = agentBOutput;

    // --- PHASE 3: AGENT C (THE EAR AUDITOR) ---
    // Target Context: Role instruction, Agent B's output, Raw Prose (for drift checking)
    sendToUI({
      agentChat: {
        agentId: "agentC",
        text: `🎭 **[STAGE 3/4] Agent C — THE EAR (AUDITOR)**`
      }
    });

    const agentCPrompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks.allAgents}

=== YOUR ROLE: AGENT C (THE EAR AUDITOR) ===
${skillBlocks.agentC || PIPELINE_CONFIG.phases[2].role_description}

=== CORE AUDITOR MANDATE & SCENE DRIFT CHECK ===
1. Verify script stays strictly inside the Raw Prose scene boundary.
2. Audit for flatness, machine tone, named emotions, and safety.
3. HARD BAN CHECK: Ensure no bracketed stage directions ([BEAT], [SFX], etc.) exist.
4. AUDITOR'S LAW: YOU NEVER REMOVE CONTENT! YOU ONLY ADD AND ENHANCE!
5. Output audit marks followed by full enhanced script (~1300–1600 words).

=== RAW PROSE (BOUNDING ANCHOR) ===
${bibleBlocks.rawProse}

=== COMBINED SCRIPT FROM AGENT B ===
${accumulatedDraft}

=== TASK FOR AGENT C ===
Audit and enhance the script in plain text with enhanced dialogue, dramatic vibe, and expanded narrative depth (~1300–1600 words).`;

    let agentCOutput = await callWithFallback(agentCPrompt, "agentC", sendToUI, tokenTracker);

    if (countWords(agentCOutput) < 1150) {
      sendToUI({ glassBoxEvent: "⚡ Agent C output under length target (~1300–1600 words). Executing audit enhancement pass..." });
      const expansionPrompt = `=== AUDIT ENHANCEMENT & EXPANSION PASS ===
Your previous audited draft was ${countWords(agentCOutput)} words. Target is ~1300–1600 words.
Enhance scene pressure, dialogue tension, and narrative bridges. Remember: NEVER REMOVE, ONLY ADD! Stay inside Raw Prose.

=== RAW PROSE ===
${bibleBlocks.rawProse}

=== YOUR PREVIOUS AUDITED DRAFT ===
${agentCOutput}

=== EXPANDED AUDITED SCRIPT (~1300–1600 WORDS) ===`;
      agentCOutput = await callWithFallback(expansionPrompt, "agentC", sendToUI, tokenTracker);
    }

    phaseOutputs.set("agentC", agentCOutput);
    accumulatedDraft = agentCOutput;

    // --- PHASE 4: JARVIS (THE DIRECTOR & SYNTHESIS MASTER) ---
    // Target Context: Role instruction, Agent C's audited draft, Raw Prose (final boundary check)
    sendToUI({
      agentChat: {
        agentId: "jarvis",
        text: `🎭 **[STAGE 4/4] JARVIS — THE DIRECTOR & SYNTHESIS MASTER**`
      }
    });

    const jarvisPrompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks.allAgents}

=== YOUR ROLE: JARVIS (THE DIRECTOR & SYNTHESIS MASTER) ===
${skillBlocks.jarvis || PIPELINE_CONFIG.phases[3].role_description}

=== REQUIRED DEEP REFLECTION & JUSTIFICATION ===
Before writing the final script, you MUST include an internal reflection block answering:
1. THINK WHY, WHAT, AND HOW for each scene context & dialogue.
2. Answer and justify: "IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"

=== SCENE BOUNDARY & PUBLICATION SPECIFICATION ===
1. The Raw Prose is the locked boundary. Do NOT expand into new locations or plot points.
2. Refine the material into publication-ready, Oscar-level dramatic quality using easy, accessible English for general listeners.
3. Speaker labels: ALL CAPS. Colon. Space. (e.g. CHARACTER: )
4. Dialogue: *italics*
5. Narration and bridges: plain text, no italics.
6. HARD BAN: ABSOLUTELY NO BRACKETED TAGS ([BEAT], [ATMOSPHERE], [SFX]).
7. TARGET WORD COUNT: 1500–2000 WORDS PUBLICATION-READY FINAL SCRIPT.

=== RAW PROSE (LOCKED BOUNDARY) ===
${bibleBlocks.rawProse}

=== AGENT C AUDITED DRAFT ===
${accumulatedDraft}

=== TASK FOR JARVIS ===
Synthesize and write the complete, publication-ready, dramatic cinematic script (1500 - 2000 WORDS).`;

    let jarvisOutput = await callWithFallback(jarvisPrompt, "jarvis", sendToUI, tokenTracker);

    if (countWords(jarvisOutput) < 1350) {
      sendToUI({ glassBoxEvent: "⚡ JARVIS output under length target (1500–2000 words). Executing final director synthesis expansion..." });
      const expansionPrompt = `=== FINAL DIRECTOR SYNTHESIS EXPANSION PASS ===
Your previous draft was ${countWords(jarvisOutput)} words. The target is PUBLICATION-READY 1500–2000 WORDS.
Expand the cinematic depth of the scene, deepen character subtext, enrich narrative bridges, while staying strictly inside the Raw Prose boundary.

=== FORMAT RECAP ===
- Speaker labels: ALL CAPS, colon, space (e.g. HOLMES: )
- Dialogue: *italics*
- Narration: plain text, no italics
- HARD BAN: No bracketed stage directions ([BEAT], [SFX], etc.)
- TARGET: 1500–2000 WORDS.

=== RAW PROSE BOUNDARY ===
${bibleBlocks.rawProse}

=== YOUR PREVIOUS DRAFT ===
${jarvisOutput}

=== FULL PUBLICATION-READY CINEMATIC SCRIPT (1500 - 2000 WORDS) ===`;
      jarvisOutput = await callWithFallback(expansionPrompt, "jarvis", sendToUI, tokenTracker);
    }

    phaseOutputs.set("jarvis", jarvisOutput);

    // 4. SAVE FINAL OUTPUT & WRITE REPORT
    const finalScript = jarvisOutput;
    const outputDir = path.join(WORKSPACE_DIR, "OUTPUT");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const { extractStoryTitle, sanitizeFilename } = await import("../skillBibleUtils.js");
    const storyTitle = extractStoryTitle(bibleContent, bibleFile?.fileName);
    const sanitizedTitle = sanitizeFilename(storyTitle);

    const outputFilename = `${sanitizedTitle}_output_${Date.now()}.md`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, finalScript, "utf-8");

    try {
      const { saveFinalScript } = await import("../../server.ts");
      await saveFinalScript("cinematic_3agent", `FINAL SCRIPT READY\n${finalScript}`, storyTitle);
    } catch (e) {
      console.error("Error auto-saving final script:", e);
    }

    // Write token burn report
    writeTokenReport(tokenTracker, "cinematic_3agent", resolvedUserInput);

    // 5. COMPUTE METRICS & FINAL ANNOUNCEMENT
    const wordCount = countWords(finalScript);
    try {
      const apiKey = process.env.GEMINI_API_KEY || "";
      const metrics = await countScriptTokens(path.join("OUTPUT", outputFilename), apiKey);
      sendToUI({
        agentChat: {
          agentId: "system",
          text: `✅ **CINEMATIC SCRIPTING PIPELINE V2 COMPLETE**\n\n` +
                `📊 **Script Metrics**:\n` +
                `• Word Count: **${metrics.word_count || wordCount} words**\n` +
                `• Audio Duration: **${metrics.estimated_audio_duration_formatted}**\n` +
                `• Total Tokens Burned: **${tokenTracker.totalTokens.toLocaleString()}**\n` +
                `🔒 Boundary Enforced: Raw Prose Anchor\n` +
                `💾 Saved Output: \`workspace files/OUTPUT/${outputFilename}\``
        }
      });
    } catch (err) {
      sendToUI({
        agentChat: {
          agentId: "system",
          text: `✅ **CINEMATIC SCRIPTING PIPELINE V2 COMPLETE**\n\n` +
                `📊 **Script Metrics**:\n` +
                `• Word Count: **${wordCount} words**\n` +
                `• Total Tokens Burned: **${tokenTracker.totalTokens.toLocaleString()}**\n` +
                `🔒 Boundary Enforced: Raw Prose Anchor\n` +
                `💾 Saved Output: \`workspace files/OUTPUT/${outputFilename}\``
        }
      });
    }

  } catch (err: any) {
    console.error("Pipeline error in cinematic_3agent_story:", err);
    sendToUI({ agentChat: { agentId: "system", text: `❌ Pipeline Error: ${err.message}` } });
  } finally {
    sessionLocks.delete(sessionId);
  }
}

// Alias for backward compatibility
export const runDynamicPipeline = runPipeline;
