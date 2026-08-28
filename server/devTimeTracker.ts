import fs from "fs";
import path from "path";

const WORKSPACE_DIR = process.cwd();
const LOG_FILE_PATH = path.join(WORKSPACE_DIR, "dev_time_log.json");

export interface SessionRecord {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  endedReason?: string;
}

export interface DevTimeData {
  totalSeconds: number;
  sessions: SessionRecord[];
}

class DevTimeTracker {
  private totalSeconds: number = 0;
  private sessions: SessionRecord[] = [];
  private activeSession: SessionRecord | null = null;
  private lastHeartbeatTime: number = Date.now();
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
    this.startNewSession("Server initialized");
    
    // Check stale sessions every 10 seconds
    setInterval(() => {
      this.checkStaleSession();
    }, 10000);
  }

  private loadFromDisk() {
    const PRELOGGED_BASE_SECONDS = 108000; // 30 hours prelogged
    try {
      if (fs.existsSync(LOG_FILE_PATH)) {
        const raw = fs.readFileSync(LOG_FILE_PATH, "utf-8");
        const data: DevTimeData = JSON.parse(raw);
        this.totalSeconds = data.totalSeconds || 0;
        this.sessions = Array.isArray(data.sessions) ? data.sessions : [];
        
        // Ensure baseline 30 hours prelogged is included
        if (this.totalSeconds < PRELOGGED_BASE_SECONDS) {
          this.totalSeconds += PRELOGGED_BASE_SECONDS;
          this.sessions.unshift({
            id: "session_prelogged_baseline",
            date: new Date().toISOString().split("T")[0],
            startTime: "09:00:00 AM",
            endTime: "07:00:00 PM",
            durationSeconds: PRELOGGED_BASE_SECONDS,
            endedReason: "Pre-logged Architecture & Early Build (30 hrs)"
          });
        }
      } else {
        this.totalSeconds = PRELOGGED_BASE_SECONDS;
        this.sessions = [
          {
            id: "session_prelogged_baseline",
            date: new Date().toISOString().split("T")[0],
            startTime: "09:00:00 AM",
            endTime: "07:00:00 PM",
            durationSeconds: PRELOGGED_BASE_SECONDS,
            endedReason: "Pre-logged Architecture & Early Build (30 hrs)"
          }
        ];
      }
    } catch (e) {
      console.error("Failed to load dev_time_log.json:", e);
      this.totalSeconds = PRELOGGED_BASE_SECONDS;
      this.sessions = [];
    }
  }

  private saveToDisk() {
    try {
      const allSessions = [...this.sessions];
      if (this.activeSession) {
        // Include current active session with live metrics
        const index = allSessions.findIndex(s => s.id === this.activeSession?.id);
        if (index >= 0) {
          allSessions[index] = { ...this.activeSession };
        } else {
          allSessions.push({ ...this.activeSession });
        }
      }

      const activeSeconds = this.activeSession ? this.activeSession.durationSeconds : 0;
      const computedTotal = this.totalSeconds + activeSeconds;

      const data: DevTimeData = {
        totalSeconds: computedTotal,
        sessions: allSessions.slice(-50) // Keep last 50 session logs
      };
      fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save dev_time_log.json:", e);
    }
  }

  public startNewSession(reason: string = "App opened") {
    if (this.activeSession) {
      this.endActiveSession("Starting new session");
    }

    const now = new Date();
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    this.activeSession = {
      id,
      date: now.toISOString().split("T")[0],
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      durationSeconds: 0,
      endedReason: "Active..."
    };
    this.lastHeartbeatTime = Date.now();
    this.saveToDisk();
  }

  public recordHeartbeat(sessionId?: string): { activeSeconds: number; totalSeconds: number; sessionId: string } {
    const now = Date.now();
    
    if (!this.activeSession) {
      this.startNewSession("Client re-connected");
    }

    const elapsedSinceLast = Math.floor((now - this.lastHeartbeatTime) / 1000);
    if (elapsedSinceLast > 0 && elapsedSinceLast < 60) {
      if (this.activeSession) {
        this.activeSession.durationSeconds += elapsedSinceLast;
      }
    }

    this.lastHeartbeatTime = now;
    if (this.activeSession) {
      this.activeSession.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    this.saveToDisk();

    const activeSeconds = this.activeSession ? this.activeSession.durationSeconds : 0;
    return {
      activeSeconds,
      totalSeconds: this.totalSeconds + activeSeconds,
      sessionId: this.activeSession ? this.activeSession.id : ""
    };
  }

  public endActiveSession(reason: string = "Tab closed / reloaded") {
    if (!this.activeSession) return;

    this.activeSession.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.activeSession.endedReason = reason;
    this.totalSeconds += this.activeSession.durationSeconds;
    this.sessions.push({ ...this.activeSession });
    this.activeSession = null;
    this.saveToDisk();
  }

  private checkStaleSession() {
    if (this.activeSession) {
      const timeSinceLastHb = Date.now() - this.lastHeartbeatTime;
      // If no heartbeat for > 20 seconds, close session cleanly
      if (timeSinceLastHb > 20000) {
        this.endActiveSession("Inactivity / Reload timeout");
      }
    }
  }

  public getStats() {
    const activeSeconds = this.activeSession ? this.activeSession.durationSeconds : 0;
    const computedTotal = this.totalSeconds + activeSeconds;
    
    const logs = [...this.sessions];
    if (this.activeSession) {
      logs.push({ ...this.activeSession });
    }

    return {
      activeSeconds,
      totalSeconds: computedTotal,
      activeSessionId: this.activeSession ? this.activeSession.id : null,
      activeStartTime: this.activeSession ? this.activeSession.startTime : null,
      sessions: logs.reverse() // Most recent first
    };
  }
}

export const devTimeTracker = new DevTimeTracker();
