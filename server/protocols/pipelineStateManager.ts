import * as fs from "fs";
import * as path from "path";
import { TokenTracker } from "../llmUtils.js";

export interface PipelineState {
  sessionId: string;
  script: string;
  brief: string;
  normalizedScript: string;
  distribution: string;
  deltaB: string;
  deltaA: string;
  finalScript: string;
  finalCheckReport: string;
  tokenTracker: TokenTracker;
  currentPhase: number; // 0, 1, 2, 3
  state: "AWAITING_PHASE_0_APPROVAL" | "AWAITING_PHASE_1_APPROVAL" | "AWAITING_PHASE_2_APPROVAL" | "AWAITING_PHASE_3_APPROVAL" | "IDLE";
  feedbackHistory: string[];
}

function getStateFilePath(sessionId: string): string {
  // Safe filename for sessionId
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(process.cwd(), "server", `pipeline_state_${safeSessionId}.json`);
}

export function saveState(sessionId: string, state: PipelineState): void {
  try {
    const filePath = getStateFilePath(sessionId);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
    console.log(`[PipelineState] Saved state for session ${sessionId} at phase ${state.currentPhase}`);
  } catch (err) {
    console.error("[PipelineState] Failed to save state:", err);
  }
}

export function loadState(sessionId: string): PipelineState | null {
  try {
    const filePath = getStateFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as PipelineState;
    }
  } catch (err) {
    console.error("[PipelineState] Failed to load state:", err);
  }
  return null;
}

export function clearState(sessionId: string): void {
  try {
    const filePath = getStateFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[PipelineState] Cleared state for session ${sessionId}`);
    }
  } catch (err) {
    console.error("[PipelineState] Failed to clear state:", err);
  }
}
