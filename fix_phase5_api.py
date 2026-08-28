import re

with open("server/geminiService.ts", "r") as f:
    content = f.read()

phase5_func = """
export async function generatePhase5CinematicScriptService(
  cpsdDocument: string,
  bible: StoryBible
): Promise<{
  agentA_subtext: string;
  agentB_structure: string;
  agentC_voice: string;
  finalScript: string;
  producerNote: string;
}> {
  const cinematicSkill = loadSkill("cinematic-scripting.md");
  const _configs = loadAgentConfigs();
  const jarvisModel = _configs.jarvis?.model || TIER_MODEL_MAP.BIBLE.primary;
  
  const prompt = `${cinematicSkill}

You are the Master Orchestrator (Jarvis). Execute the Three-Agent Method exactly as described in the skill using the provided CPSD Document and Story Bible context.

CPSD Document:
${cpsdDocument}

Concept:
${JSON.stringify(bible.concept, null, 2)}

Characters:
${JSON.stringify(bible.characterProfiles, null, 2)}

Return strictly a valid JSON object matching this structure:
{
  "agentA_subtext": "Agent A's analysis of the fear and subtext",
  "agentB_structure": "Agent B's structural map",
  "agentC_voice": "Agent C's vocal fingerprints analysis",
  "finalScript": "The final formatted scene script (600-800 words, Audio Drama format)",
  "producerNote": "The 3-line producer note"
}`;

  try {
    const raw = await generateContentWithFallback(prompt, "jarvis", jarvisModel);
    const cleanJson = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("[generatePhase5CinematicScriptService] Error:", err);
    throw err;
  }
}
"""

if "generatePhase5CinematicScriptService" not in content:
    content += "\n" + phase5_func

with open("server/geminiService.ts", "w") as f:
    f.write(content)
