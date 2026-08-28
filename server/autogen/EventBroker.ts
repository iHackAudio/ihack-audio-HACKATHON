import { EventEmitter } from "events";
import { ActorEvent } from "./types.ts";

export class EventBroker {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  public subscribe(topic: string, callback: (event: ActorEvent) => void): () => void {
    this.emitter.on(topic, callback);
    return () => {
      this.emitter.off(topic, callback);
    };
  }

  public publish(topic: string, sender: ActorEvent["sender"], payload: any): void {
    const event: ActorEvent = {
      topic,
      sender,
      payload,
      timestamp: Date.now()
    };
    console.log(`[EventBroker] [Topic: ${topic}] Published by ${sender}`);
    this.emitter.emit(topic, event);
  }
}

export const globalEventBroker = new EventBroker();
