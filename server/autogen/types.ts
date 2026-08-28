export type ActorId = "jarvis" | "agentA" | "agentB" | "agentC";

export interface ActorMessage {
  id: string;
  sender: ActorId | "user" | "system";
  recipient: ActorId;
  topic: string;
  payload: any;
  timestamp: number;
}

export interface ActorEvent {
  topic: string;
  sender: ActorId | "system";
  payload: any;
  timestamp: number;
}

export type ActorStatus = "idle" | "working" | "thinking" | "preparing" | "sending";

export interface ActorState {
  id: ActorId;
  status: ActorStatus;
  queueSize: number;
}
