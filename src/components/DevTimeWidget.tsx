import React, { useState, useEffect, useRef } from 'react';
import { Clock, Activity, Calendar, X, RefreshCw, AlertCircle, History } from 'lucide-react';

interface SessionLog {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  endedReason?: string;
}

interface DevTimeData {
  activeSeconds: number;
  totalSeconds: number;
  activeSessionId: string | null;
  activeStartTime: string | null;
  sessions: SessionLog[];
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

export default function DevTimeWidget() {
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [activeStartTime, setActiveStartTime] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeSecsRef = useRef(activeSeconds);
  const totalSecsRef = useRef(totalSeconds);
  activeSecsRef.current = activeSeconds;
  totalSecsRef.current = totalSeconds;

  // Initial fetch and heartbeat loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let heartbeatTimer: NodeJS.Timeout;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/dev-time/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Client active' })
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.activeSeconds === 'number') {
            setActiveSeconds(data.activeSeconds);
          }
          if (typeof data.totalSeconds === 'number') {
            setTotalSeconds(data.totalSeconds);
          }
        }
      } catch (e) {
        // Silent catch for network hiccups
      }
    };

    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/dev-time');
        if (res.ok) {
          const data: DevTimeData = await res.json();
          setActiveSeconds(data.activeSeconds || 0);
          setTotalSeconds(data.totalSeconds || 0);
          setSessions(data.sessions || []);
          setActiveStartTime(data.activeStartTime);
        }
      } catch (e) {
        console.error('Failed to load dev time:', e);
      } finally {
        setIsLoading(false);
      }
      sendHeartbeat();
    };

    fetchInitial();

    // Local tick every second for smooth UI counter
    timer = setInterval(() => {
      setActiveSeconds(prev => prev + 1);
      setTotalSeconds(prev => prev + 1);
    }, 1000);

    // Heartbeat sync every 5 seconds
    heartbeatTimer = setInterval(sendHeartbeat, 5000);

    // Unload handler to save state immediately on browser close / reload
    const handleUnload = () => {
      const payload = JSON.stringify({ reason: 'Tab reload / close' });
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/dev-time/session-end', blob);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const refreshLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dev-time');
      if (res.ok) {
        const data: DevTimeData = await res.json();
        setActiveSeconds(data.activeSeconds || 0);
        setTotalSeconds(data.totalSeconds || 0);
        setSessions(data.sessions || []);
        setActiveStartTime(data.activeStartTime);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header Compact Badge */}
      <button
        onClick={() => {
          setIsOpen(true);
          refreshLogs();
        }}
        className="px-2.5 py-1 rounded bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 border border-[#00d2ff]/30 text-[#00d2ff] transition-all flex items-center gap-1.5 font-mono text-xs cursor-pointer shadow-[0_0_10px_rgba(0,210,255,0.1)] group"
        title="Click to view Total Development Time Logs"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
        <Clock className="w-3.5 h-3.5 text-[#00d2ff] group-hover:rotate-12 transition-transform" />
        <span className="font-semibold">{formatDuration(totalSeconds)}</span>
      </button>

      {/* Popover / Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0c0f1a] border border-[#00d2ff]/30 rounded-xl shadow-[0_0_40px_rgba(0,210,255,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-white font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121624]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00d2ff]/10 flex items-center justify-center border border-[#00d2ff]/30 text-[#00d2ff]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-white font-mono flex items-center gap-2">
                    Development Time Tracker
                  </h2>
                  <p className="text-[10px] text-white/50 font-mono">Live active session & interrupt logging</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={refreshLogs}
                  className="p-1.5 rounded bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Refresh Session Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00d2ff]' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar">
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Total Lifetime Dev Time */}
                <div className="p-3 bg-[#121624] border border-[#00d2ff]/30 rounded-lg flex flex-col gap-1 shadow-[0_0_15px_rgba(0,210,255,0.05)]">
                  <div className="flex items-center justify-between text-white/50 text-[10px] uppercase">
                    <span>Total Lifetime Dev Time</span>
                    <Activity className="w-3.5 h-3.5 text-[#00d2ff]" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-[#00d2ff]">
                    {formatDuration(totalSeconds)}
                  </div>
                  <div className="text-[10px] text-white/40">Persisted across reloads</div>
                </div>

                {/* Current Active Session */}
                <div className="p-3 bg-[#121624] border border-emerald-500/30 rounded-lg flex flex-col gap-1 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center justify-between text-white/50 text-[10px] uppercase">
                    <span>Active Session</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400">
                    {formatDuration(activeSeconds)}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    Started: {activeStartTime || 'Just now'}
                  </div>
                </div>

              </div>

              {/* Interrupt / Persistence Banner */}
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-semibold text-white">Auto Interrupt Logging Active:</span> Refreshing, closing the browser, or restarting the server automatically logs session stats into <span className="underline font-bold">dev_time_log.json</span>.
                </div>
              </div>

              {/* Recent Sessions Log Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-white/70 font-semibold text-[11px] uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Session History Logs ({sessions.length})</span>
                </div>

                <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                  <div className="max-h-52 overflow-y-auto custom-scrollbar">
                    {sessions.length === 0 ? (
                      <div className="p-4 text-center text-white/40 text-[11px]">No previous sessions logged yet.</div>
                    ) : (
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#121624] text-white/50 border-b border-white/10 sticky top-0">
                          <tr>
                            <th className="p-2 font-mono font-normal">Date</th>
                            <th className="p-2 font-mono font-normal">Start</th>
                            <th className="p-2 font-mono font-normal">Duration</th>
                            <th className="p-2 font-mono font-normal">Status / Event</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sessions.map((s, idx) => (
                            <tr key={s.id || idx} className="hover:bg-white/5 transition-colors">
                              <td className="p-2 text-white/80 font-mono truncate">{s.date}</td>
                              <td className="p-2 text-white/60 font-mono">{s.startTime}</td>
                              <td className="p-2 text-cyan-300 font-semibold font-mono">{formatDuration(s.durationSeconds)}</td>
                              <td className="p-2 text-white/50 text-[10px] truncate max-w-[120px]">
                                {s.endedReason || 'Completed'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-[#121624] flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-white/40">Status: Counter synced with backend</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
