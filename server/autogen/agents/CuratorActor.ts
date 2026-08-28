import { BaseActor } from "../BaseActor.ts";
import { ActorId, ActorMessage } from "../types.ts";
import { globalEventBroker } from "../EventBroker.ts";
import { chatWithSubAgent } from "../../agentHub.ts";

export class CuratorActor extends BaseActor {
  public readonly id: ActorId = "agentC";

  protected async processMessage(message: ActorMessage): Promise<void> {
    if (message.topic === "script.refined") {
      const { manuscript, refinedScript, skillBlocks, bibleBlocks, userInput, key } = message.payload;

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "🎭 **[STAGE 3/4] Agent C — THE EAR (AUDITOR)**"
      });

      this.setStatus("thinking");

      const prompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks?.allAgents || "Think before writing. Think before performing. Think before delivering. Ask yourself: IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"}

=== YOUR ROLE: AGENT C (THE EAR AUDITOR) ===
${skillBlocks?.agentC || "Oscar-level cinematic storyteller and professional audiobook producer. Audits script for flatness, machine tone, named emotions, and raw prose drift (~1300-1600 words)."}

=== CORE AUDITOR MANDATE & SCENE DRIFT CHECK ===
1. Verify script stays strictly inside the Raw Prose scene boundary.
2. Audit for flatness, machine tone, named emotions, and safety.
3. HARD BAN CHECK: Ensure no bracketed stage directions ([BEAT], [SFX], etc.) exist.
4. AUDITOR'S LAW: YOU NEVER REMOVE CONTENT! YOU ONLY ADD AND ENHANCE!
5. Output audit marks followed by full enhanced script (~1300–1600 words).

=== RAW PROSE (BOUNDING ANCHOR) ===
${bibleBlocks?.rawProse || manuscript}

=== COMBINED SCRIPT FROM AGENT B ===
${refinedScript}

=== TASK FOR AGENT C ===
Audit and enhance the script in plain text with enhanced dialogue, dramatic vibe, and expanded narrative depth (~1300–1600 words).`;

      const reply = await chatWithSubAgent(this.id, prompt, key);

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "✅ Stage 3 Completed (Ear Auditor). Delegating to JARVIS (Director Synthesis Master)."
      });

      this.setStatus("idle");

      // Publish audited script event for Jarvis (Stage 4) to perform synthesis
      globalEventBroker.publish("script.audited", this.id, {
        manuscript,
        auditedScript: reply,
        skillBlocks,
        bibleBlocks,
        userInput,
        key
      });
    }
  }
}

