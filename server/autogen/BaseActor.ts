import { ActorId, ActorMessage, ActorStatus } from "./types.ts";
import { globalEventBroker } from "./EventBroker.ts";

export abstract class BaseActor {
  public abstract readonly id: ActorId;
  protected status: ActorStatus = "idle";
  protected inbox: ActorMessage[] = [];
  protected isProcessing = false;

  public getStatus(): ActorStatus {
    return this.status;
  }

  public getQueueSize(): number {
    return this.inbox.length;
  }

  public receiveMessage(message: ActorMessage): void {
    this.inbox.push(message);
    this.triggerProcessing();
  }

  protected setStatus(status: ActorStatus): void {
    this.status = status;
    globalEventBroker.publish(`actor.${this.id}.status`, this.id, { status });
  }

  private async triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.inbox.length > 0) {
      const msg = this.inbox.shift();
      if (msg) {
        try {
          this.setStatus("working");
          await this.processMessage(msg);
        } catch (err: any) {
          console.error(`[Actor ${this.id}] Error processing message:`, err);
          globalEventBroker.publish(`actor.${this.id}.error`, this.id, { error: err.message, messageId: msg.id });
        } finally {
          this.setStatus("idle");
        }
      }
    }

    this.isProcessing = false;
  }

  protected abstract processMessage(message: ActorMessage): Promise<void>;
}
