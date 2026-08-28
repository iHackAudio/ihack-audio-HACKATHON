import { JarvisActor } from "./agents/JarvisActor.ts";
import { ParserActor } from "./agents/ParserActor.ts";
import { DirectorActor } from "./agents/DirectorActor.ts";
import { CuratorActor } from "./agents/CuratorActor.ts";
import { globalEventBroker } from "./EventBroker.ts";
import { ActorId, ActorMessage, ActorState } from "./types.ts";

export class ActorHost {
  private jarvis = new JarvisActor();
  private agentA = new ParserActor();
  private agentB = new DirectorActor();
  private agentC = new CuratorActor();

  private static instance: ActorHost | null = null;

  public static getInstance(): ActorHost {
    if (!ActorHost.instance) {
      ActorHost.instance = new ActorHost();
    }
    return ActorHost.instance;
  }

  private constructor() {
    this.registerSubscribers();
  }

  private registerSubscribers() {
    // Parser (Agent A) subscribes to pipeline.briefed
    globalEventBroker.subscribe("pipeline.briefed", (event) => {
      this.agentA.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentA",
        topic: "pipeline.briefed",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    // Director (Agent B) subscribes to script.parsed
    globalEventBroker.subscribe("script.parsed", (event) => {
      this.agentB.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentB",
        topic: "script.parsed",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    // Curator (Agent C) subscribes to script.refined
    globalEventBroker.subscribe("script.refined", (event) => {
      this.agentC.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentC",
        topic: "script.refined",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    // Jarvis subscribes to script.audited (Stage 4)
    globalEventBroker.subscribe("script.audited", (event) => {
      this.jarvis.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "jarvis",
        topic: "script.audited",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    // DEBATE SYSTEM SUBSCRIPTIONS
    globalEventBroker.subscribe("debate.started", (event) => {
      this.agentA.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentA",
        topic: "debate.started",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    globalEventBroker.subscribe("debate.turn.a", (event) => {
      this.agentA.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentA",
        topic: "debate.turn.a",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    globalEventBroker.subscribe("debate.turn.b", (event) => {
      this.agentB.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "agentB",
        topic: "debate.turn.b",
        payload: event.payload,
        timestamp: Date.now()
      });
    });

    globalEventBroker.subscribe("debate.turn.jarvis", (event) => {
      this.jarvis.receiveMessage({
        id: Math.random().toString(36).substring(7),
        sender: event.sender,
        recipient: "jarvis",
        topic: "debate.turn.jarvis",
        payload: event.payload,
        timestamp: Date.now()
      });
    });
  }

  public getActorStates(): ActorState[] {
    return [
      { id: "jarvis", status: this.jarvis.getStatus(), queueSize: this.jarvis.getQueueSize() },
      { id: "agentA", status: this.agentA.getStatus(), queueSize: this.agentA.getQueueSize() },
      { id: "agentB", status: this.agentB.getStatus(), queueSize: this.agentB.getQueueSize() },
      { id: "agentC", status: this.agentC.getStatus(), queueSize: this.agentC.getQueueSize() }
    ];
  }

  public triggerPipeline(userInput: string, key: string) {
    // Send pipeline start message to Jarvis actor
    this.jarvis.receiveMessage({
      id: Math.random().toString(36).substring(7),
      sender: "system",
      recipient: "jarvis",
      topic: "pipeline.start",
      payload: { userInput, key },
      timestamp: Date.now()
    });
  }
}

export const globalActorHost = ActorHost.getInstance();
