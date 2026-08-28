import { BaseActor } from "../BaseActor.ts";
import { ActorId, ActorMessage } from "../types.ts";
import { globalEventBroker } from "../EventBroker.ts";
import { chatWithSubAgent } from "../../agentHub.ts";

export class DirectorActor extends BaseActor {
  public readonly id: ActorId = "agentB";

  protected async processMessage(message: ActorMessage): Promise<void> {
    if (message.topic === "script.parsed") {
      const { manuscript, parsedScript, skillBlocks, bibleBlocks, userInput, key } = message.payload;

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "🎭 **[STAGE 2/4] Agent B — THE NARRATIVE STORYTELLER**"
      });

      this.setStatus("thinking");

      const prompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks?.allAgents || "Think before writing. Think before performing. Think before delivering. Ask yourself: IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"}

=== YOUR ROLE: AGENT B (THE NARRATIVE STORYTELLER) ===
${skillBlocks?.agentB || "Oscar-level cinematic storyteller and narration specialist. Weaves witness narration and narrative bridges around dialogue beats within Raw Prose boundary (~1000-1300 words)."}

=== CORE SCENE BOUNDARY RULE ===
The Raw Prose is the LOCKED scene boundary. Weave witness narration and narrative bridges around Agent A's dialogue beats.
Do not add scenes, locations, or characters that do not exist in the Raw Prose.

=== GLOBAL FORMAT & HARD BANS ===
Speaker labels: ALL CAPS. Colon. Space. (e.g. WATSON: )
Dialogue: *italics*
Narration: plain text
PROHIBITED TAGS (HARD BAN): [BEAT], [ATMOSPHERE: ...], [PAUSE], [SFX: ...], or ANY bracketed stage directions.

=== RAW PROSE (MASTER SOURCE FOR BRIDGES) ===
${bibleBlocks?.rawProse || manuscript}

=== AGENT A DIALOGUE MAP & DRAFT ===
${parsedScript}

=== USER SCENE REQUEST ===
${userInput || manuscript}

=== TASK FOR AGENT B ===
1. Self-Check: Ask yourself "What is the character most afraid to feel in this scene?"
2. Weave witness-style narration (Shawshank / Attenborough / Apocalypse Now) and short narrative bridges (max 3 lines) around Agent A's dialogue.
3. Open the scene with vivid room/sound placement, bridge emotional shifts, and close on a physical detail that keeps the wound open.
4. Output integrated narrative & dialogue script (~1000–1300 words).`;

      const reply = await chatWithSubAgent(this.id, prompt, key);

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "✅ Stage 2 Completed (Narrative Storyteller). Delegating to Agent C (Ear Auditor)."
      });

      this.setStatus("idle");

      // Publish event so Curator (Agent C) can pick it up
      globalEventBroker.publish("script.refined", this.id, {
        manuscript,
        refinedScript: reply,
        skillBlocks,
        bibleBlocks,
        userInput,
        key
      });
    }
  }
}

