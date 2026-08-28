import { BaseActor } from "../BaseActor.ts";
import { ActorId, ActorMessage } from "../types.ts";
import { globalEventBroker } from "../EventBroker.ts";
import { chatWithSubAgent } from "../../agentHub.ts";
import { resolveWorkspaceFiles } from "../../llmUtils.ts";
import { discoverSkillFile, discoverBibleFile, parseSkillSections, parseBibleSections } from "../../skillBibleUtils.js";

export class JarvisActor extends BaseActor {
  public readonly id: ActorId = "jarvis";

  protected async processMessage(message: ActorMessage): Promise<void> {
    if (message.topic === "pipeline.start") {
      const { userInput, key } = message.payload;

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: "🔍 Scanning workspace for referenced files, Skill MDs & Story Bibles..."
      });

      this.setStatus("thinking");

      try {
        const skillFile = discoverSkillFile();
        const bibleFile = discoverBibleFile();

        const skillContent = skillFile ? skillFile.content : "";
        const bibleContent = bibleFile ? bibleFile.content : "";

        const skillBlocks = parseSkillSections(skillContent);
        const bibleBlocks = parseBibleSections(bibleContent);

        const manuscript = await resolveWorkspaceFiles(userInput);

        globalEventBroker.publish("pipeline.log", this.id, {
          agentId: this.id,
          text: `🎬 **[Cinematic 3-Agent Story Protocol in AutoGen]**\n\n` +
                `📂 Skill File: \`${skillFile ? skillFile.fileName : "filename_SKILL.md"}\`\n` +
                `📂 Bible File: \`${bibleFile ? bibleFile.fileName : "filename_BIBLE.md"}\`\n` +
                `🔒 Locked Scene Boundary: Raw Prose Anchor\n` +
                `⚡ Dispatching Stage 1 to Agent A (Dialogue Master) in background actor pool!`
        });

        // Publish briefing so Agent A picks it up asynchronously
        globalEventBroker.publish("pipeline.briefed", this.id, {
          manuscript,
          skillBlocks,
          bibleBlocks,
          userInput,
          key
        });

        this.setStatus("idle");

      } catch (err: any) {
        globalEventBroker.publish("pipeline.log", this.id, {
          agentId: "system",
          text: `💥 Pipeline pre-processing failed: ${err.message}`
        });
        this.setStatus("idle");
      }
    } else if (message.topic === "script.audited") {
      const { manuscript, auditedScript, skillBlocks, bibleBlocks, userInput, key } = message.payload;

      globalEventBroker.publish("pipeline.log", this.id, {
        agentId: this.id,
        text: `🎭 **[STAGE 4/4] JARVIS — THE DIRECTOR & SYNTHESIS MASTER**`
      });

      this.setStatus("thinking");

      try {
        const jarvisPrompt = `=== ALL AGENTS PREAMBLE ===
${skillBlocks?.allAgents || "Think before writing. Think before performing. Think before delivering. Ask yourself: IS IT BEST I CAN DO or CAN I DO EVEN BETTER?"}

=== YOUR ROLE: JARVIS (THE DIRECTOR & SYNTHESIS MASTER) ===
${skillBlocks?.jarvis || "Final-stage director and synthesis master. Refines audited draft into publication-ready 1500-2000 word cinematic script in easy-going, accessible English."}

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
${bibleBlocks?.rawProse || manuscript}

=== AGENT C AUDITED DRAFT ===
${auditedScript}

=== TASK FOR JARVIS ===
Synthesize and write the complete, publication-ready, dramatic cinematic script (1500 - 2000 WORDS).`;

        const finalScript = await chatWithSubAgent(this.id, jarvisPrompt, key);

        globalEventBroker.publish("pipeline.log", this.id, {
          agentId: this.id,
          text: `✨ JARVIS Director Synthesis completed successfully.`
        });

        globalEventBroker.publish("script.curated", this.id, {
          finalScript
        });

        this.setStatus("idle");
      } catch (err: any) {
        globalEventBroker.publish("pipeline.log", this.id, {
          agentId: "system",
          text: `💥 Stage 4 (JARVIS Synthesis) failed: ${err.message}`
        });
        this.setStatus("idle");
      }
    }
  }
}

