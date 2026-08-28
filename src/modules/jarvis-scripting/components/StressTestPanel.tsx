import React, { useState, useRef, useEffect } from 'react';
import { Play, Activity, CheckCircle, AlertTriangle, RefreshCw, Layers, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogLine {
  text: string;
  timestamp: string;
}

export default function StressTestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Real-time metrics
  const [latency, setLatency] = useState<number | null>(null);
  const [throughput, setThroughput] = useState<number | null>(null);
  const [queueDepth, setQueueDepth] = useState<number | null>(null);
  const [concurrencyScore, setConcurrencyScore] = useState<string | null>(null);
  const [bufferHealth, setBufferHealth] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runTest = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setProgress(0);
    setLogs([{ text: "🔌 Connecting to Live System Stress Test API...", timestamp: new Date().toLocaleTimeString() }]);
    setLatency(null);
    setThroughput(null);
    setQueueDepth(null);
    setConcurrencyScore(null);
    setBufferHealth(null);

    const eventSource = new EventSource('/api/stress-test');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          setLogs(prev => [...prev, { text: data.log, timestamp: new Date().toLocaleTimeString() }]);
        }
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.metrics) {
          if (data.metrics.avgLatencyMs !== undefined) setLatency(data.metrics.avgLatencyMs);
          if (data.metrics.throughputSec !== undefined) setThroughput(data.metrics.throughputSec);
          if (data.metrics.queueDepth !== undefined) setQueueDepth(data.metrics.queueDepth);
          if (data.metrics.concurrencyScore !== undefined) setConcurrencyScore(data.metrics.concurrencyScore);
          if (data.metrics.bufferHealth !== undefined) setBufferHealth(data.metrics.bufferHealth);
        }
        if (data.completed) {
          setIsCompleted(true);
          setIsRunning(false);
          eventSource.close();
        }
        if (data.error) {
          setLogs(prev => [...prev, { text: `❌ ERROR: ${data.error}`, timestamp: new Date().toLocaleTimeString() }]);
          setIsRunning(false);
          eventSource.close();
        }
      } catch (err: any) {
        console.error("Error parsing stress test message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setLogs(prev => [...prev, { text: "💥 Connection lost or test completed.", timestamp: new Date().toLocaleTimeString() }]);
      setIsRunning(false);
      eventSource.close();
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#080a0f] text-white overflow-hidden p-6 font-sans">
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#00d2ff]/10 flex items-center justify-center border border-[#00d2ff]/30 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <Zap className="w-5 h-5 text-[#00d2ff] animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Cognitive Actor Pool Stress Engine <span className="text-xs bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded-full font-mono font-bold">v0.4 LIVE</span>
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1">Measuring concurrency, thread limits, message latencies, and transaction safety of the event broker.</p>
          </div>
        </div>

        <button
          onClick={runTest}
          disabled={isRunning}
          className={`px-5 py-2.5 rounded-xl font-mono text-sm uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
            isRunning 
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#00d2ff] to-[#ff00d2] text-white border-transparent hover:shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:scale-[1.02]'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running stress test...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white fill-current" />
              Launch Live Stress Test
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
        {/* Real-time stats column */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#0c0e14]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              System Metrics under Load
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 border border-white/[0.03] p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Broker Latency</span>
                <span className="text-xl font-bold font-mono text-[#00d2ff] mt-1">
                  {latency !== null ? `${latency.toFixed(3)} ms` : '--'}
                </span>
              </div>

              <div className="bg-black/30 border border-white/[0.03] p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Event Throughput</span>
                <span className="text-xl font-bold font-mono text-[#ff00d2] mt-1">
                  {throughput !== null ? `${throughput.toFixed(0)} msg/s` : '--'}
                </span>
              </div>

              <div className="bg-black/30 border border-white/[0.03] p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Queue Saturation</span>
                <span className="text-xl font-bold font-mono text-yellow-400 mt-1">
                  {queueDepth !== null ? `${queueDepth} payloads` : '--'}
                </span>
              </div>

              <div className="bg-black/30 border border-white/[0.03] p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Memory Integrity</span>
                <span className="text-xl font-bold font-mono text-teal-400 mt-1">
                  {bufferHealth || '--'}
                </span>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-emerald-500 animate-pulse' : isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-white/10'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-white/40 uppercase">Engine Status</span>
                <span className="text-xs font-mono font-bold mt-0.5">
                  {isCompleted ? 'STABILITY VERIFIED (PASS)' : isRunning ? 'TRANSMITTING COGNITIVE BURST' : 'STATIONARY (AWAITING COMMAND)'}
                </span>
              </div>
            </div>
          </div>

          {/* Actor pool diagram */}
          <div className="bg-[#0c0e14]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-4">
              <Layers className="w-3.5 h-3.5 text-[#00d2ff]" />
              Actor Concurrency Routing Map
            </h3>

            <div className="flex flex-col gap-3 flex-1 justify-center z-10">
              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-red-500 animate-ping' : 'bg-red-500'}`} />
                  <span className="text-xs font-mono font-bold text-red-400">JARVIS (Compute Core)</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{isRunning ? 'ROUTING' : 'IDLE'}</span>
              </div>

              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-pink-500 animate-ping' : 'bg-pink-500'}`} />
                  <span className="text-xs font-mono font-bold text-pink-400">AGENT A (Parser)</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{isRunning ? 'PROCESSING' : 'IDLE'}</span>
              </div>

              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-yellow-400 animate-ping' : 'bg-yellow-400'}`} />
                  <span className="text-xs font-mono font-bold text-yellow-400">AGENT B (Director)</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{isRunning ? 'REFINING' : 'IDLE'}</span>
              </div>

              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-teal-400 animate-ping' : 'bg-teal-400'}`} />
                  <span className="text-xs font-mono font-bold text-teal-400">AGENT C (Curator)</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{isRunning ? 'CURATING' : 'IDLE'}</span>
              </div>
            </div>

            {/* Glowing success seal */}
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20"
              >
                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Stress Test Succeeded</h4>
                <p className="text-[11px] font-mono text-white/50 max-w-[240px] mt-1 leading-normal">
                  Event broker, actor message queues, and concurrent thread loops successfully validated with 0% data loss.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Live log feed column */}
        <div className="lg:col-span-2 flex flex-col bg-[#0c0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00d2ff]" />
              Stress Test Console Log Feed
            </h3>
            {progress > 0 && (
              <span className="text-xs font-mono font-bold text-[#00d2ff]">{progress}%</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 relative">
            <div 
              className="h-full bg-gradient-to-r from-[#00d2ff] to-[#ff00d2] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Log terminal */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs text-white/80 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 font-mono gap-2">
                <Zap className="w-8 h-8 opacity-10" />
                Launch the stress test to view live stream logs.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 py-1 border-b border-white/[0.01] hover:bg-white/[0.02] px-1 rounded transition-colors">
                  <span className="text-slate-500 shrink-0 select-none">{log.timestamp}</span>
                  <span className={log.text.includes("Complete") || log.text.includes("COMPLETE") ? "text-emerald-400 font-bold" : log.text.includes("ERROR") || log.text.includes("💥") ? "text-red-400 font-bold" : "text-white/80"}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
