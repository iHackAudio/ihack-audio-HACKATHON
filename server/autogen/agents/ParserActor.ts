import { BaseActor } from "../BaseActor.ts";
import { ActorId, ActorMessage } from "../types.ts";
import { globalEventBroker } from "../EventBroker.ts";
import { chatWithSubAgent } from "../../agentHub.ts";

export class ParserActor extends BaseActor {
  public readonly id: ActorId = "agentA";

  protected async processMessage(message: ActorMessage): Promise<void> {
    if (message.topic === "pipeline.briefed") {
      const { manuscript, key, skillBlocks, bibleBlocks, userInput } = message.payload;
      
      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "🎭 **[STAGE 1/4] Agent A — THE DIALOGUE MASTER**"
      });

      this.setStatus("thinking");
      
      const prompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks?.allAgents || "Think before writing. Think before performing. Think before delivering. Ask yourself: IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"}

=== YOUR ROLE: AGENT A (THE DIALOGUE MASTER) ===
${skillBlocks?.agentA || "Psychological, human, and realistic Oscar-level cinematic storyteller. Excavates dialogue moments from Raw Prose, mapping scenes through Setup, Fracture, Descent, and Surface movements (~800-1000 words)."}

=== CORE SCENE BOUNDARY RULE ===
The Raw Prose is the LOCKED scene boundary. Everything you write must expand FROM it — not beyond it.
Do not add scenes, locations, or characters that do not exist in the Raw Prose.

=== GLOBAL FORMAT & HARD BANS ===
Speaker labels: ALL CAPS. Colon. Space. (e.g. HOLMES: )
Dialogue: *italics*
Narration: plain text
PROHIBITED TAGS (HARD BAN): [BEAT], [ATMOSPHERE: ...], [PAUSE], [SFX: ...], or ANY bracketed stage directions. Write physical action in plain text prose instead.

=== CHARACTER PROFILES (TARGETED CONTEXT) ===
${bibleBlocks?.characterProfiles || ""}

=== CPSD SCENE BLUEPRINT (TARGETED CONTEXT) ===
${bibleBlocks?.cpsdBlueprint || ""}

=== RAW PROSE (LOCKED MASTER SKELETON) ===
${bibleBlocks?.rawProse || manuscript}

=== USER SCENE REQUEST ===
${userInput || manuscript}

=== TASK FOR AGENT A ===
1. Map the scene into 4 movements: SETUP, FRACTURE, DESCENT, SURFACE.
2. Excavate dialogue beats directly from the Raw Prose, adding psychological subtext, dramatic pauses, and pacing drops.
3. Stay strictly inside the Raw Prose scene boundary.
4. Output your movement map and the expanded dialogue draft (~800–1000 words).`;
      
      const reply = await chatWithSubAgent(this.id, prompt, key);
      
      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "✅ Stage 1 Completed (Dialogue Master). Delegating to Agent B (Narrative Storyteller)."
      });

      this.setStatus("idle");

      // Publish event so Director (Agent B) can pick it up
      globalEventBroker.publish("script.parsed", this.id, {
        manuscript,
        parsedScript: reply,
        skillBlocks,
        bibleBlocks,
        userInput,
        key
      });
    }
  }
}

