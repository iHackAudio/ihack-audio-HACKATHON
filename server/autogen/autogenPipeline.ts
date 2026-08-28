import { globalEventBroker } from "./EventBroker.ts";
import { globalActorHost } from "./ActorHost.ts";

export async function runAutoGenPipeline(
  userInput: string,
  sendToUI: (msg: any) => void,
  apiKey: string,
  sessionId: string = "default"
): Promise<void> {
  sendToUI({
    agentChat: {
      agentId: "system",
      text: "🤖 [AutoGen Engine v0.4] Initializing Asynchronous Actor Pool & Event-Driven Message Broker..."
    }
  });

  // Keep track of active subscriptions to clean them up at the end
  const subscriptions: (() => void)[] = [];

  // 1. Subscribe to logs and stream them to the UI
  const logSub = globalEventBroker.subscribe("pipeline.log", (event) => {
    const { agentId, text } = event.payload;
    sendToUI({
      agentChat: {
        agentId,
        text
      }
    });
  });
  subscriptions.push(logSub);

  // 2. Subscribe to status updates
  const statusSub = globalEventBroker.subscribe("actor.jarvis.status", (event) => {
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🔄 [Actor Status] Jarvis transitioned to: ${event.payload.status}`
      }
    });
  });
  const statusSubA = globalEventBroker.subscribe("actor.agentA.status", (event) => {
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🔄 [Actor Status] Agent A transitioned to: ${event.payload.status}`
      }
    });
  });
  const statusSubB = globalEventBroker.subscribe("actor.agentB.status", (event) => {
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🔄 [Actor Status] Agent B transitioned to: ${event.payload.status}`
      }
    });
  });
  const statusSubC = globalEventBroker.subscribe("actor.agentC.status", (event) => {
    sendToUI({
      agentChat: {
        agentId: "system",
        text: `🔄 [Actor Status] Agent C transitioned to: ${event.payload.status}`
      }
    });
  });
  subscriptions.push(statusSub, statusSubA, statusSubB, statusSubC);

  // 3. Subscribe to final script curation event
  let isDone = false;
  const donePromise = new Promise<void>((resolve, reject) => {
    const curationSub = globalEventBroker.subscribe("script.curated", async (event) => {
      try {
        const { finalScript } = event.payload;
        
        // Auto-save script via standard filesystem
        const { discoverBibleFile, extractStoryTitle } = await import("../skillBibleUtils.js");
        const bibleFile = discoverBibleFile();
        const storyTitle = extractStoryTitle(bibleFile?.content || "", bibleFile?.fileName);

        const { saveFinalScript } = await import("../../server.ts");
        await saveFinalScript("AutoGen_Pipeline", `FINAL SCRIPT READY\n${finalScript}`, storyTitle);

        sendToUI({
          agentChat: {
            agentId: "agentC",
            text: `✅ PIPELINE COMPLETE — FINAL SCRIPT READY\n${finalScript}`
          }
        });

        sendToUI({
          agentChat: {
            agentId: "jarvis",
            text: "🟢 Asynchronous Event-Driven AutoGen Pipeline Run completed successfully."
          }
        });

        isDone = true;
        resolve();
      } catch (err: any) {
        reject(err);
      }
    });
    subscriptions.push(curationSub);

    const debateSub = globalEventBroker.subscribe("debate.complete", (event) => {
      const { finalSummary } = event.payload;
      
      sendToUI({
        agentChat: {
          agentId: "jarvis",
          text: `🏆 GROUP CHAT DEBATE COMPLETE\n\n${finalSummary}`
        }
      });

      isDone = true;
      resolve();
    });
    subscriptions.push(debateSub);

    // Watch for actor errors to fail gracefully
    const errorSubA = globalEventBroker.subscribe("actor.agentA.error", (event) => reject(new Error(`Agent A Error: ${event.payload.error}`)));
    const errorSubB = globalEventBroker.subscribe("actor.agentB.error", (event) => reject(new Error(`Agent B Error: ${event.payload.error}`)));
    const errorSubC = globalEventBroker.subscribe("actor.agentC.error", (event) => reject(new Error(`Agent C Error: ${event.payload.error}`)));
    subscriptions.push(errorSubA, errorSubB, errorSubC);
  });

  try {
    // 4. Trigger the pipeline!
    globalActorHost.triggerPipeline(userInput, apiKey);

    // 5. Wait for curation or error
    await donePromise;
  } catch (err: any) {
    sendToUI({
      agentChat: {
        agentId: "jarvis",
        text: `💥 PIPELINE FAILED: ${err.message}`
      }
    });
  } finally {
    // Clean up subscriptions to prevent memory leaks across multiple runs
    for (const unsub of subscriptions) {
      unsub();
    }
  }
}
