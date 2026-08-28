export interface ApiLog {
  id: string;
  timestamp: string;
  purpose: string;
  model: string;
  charsIn: number;
  charsOut: number;
  audioDurationSec: number;
  nodeId: string;
  approxCost: number;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

const STORAGE_KEY = 'ihack_api_session_logs';

export function getApiLogs(): ApiLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read API logs:', e);
    return [];
  }
}

export function saveApiLogs(logs: ApiLog[]) {
  try {
    // Keep a robust rolling list (max 100 entries, pruning older records)
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    // Dispatch a custom event so the UI can listen and auto-update
    window.dispatchEvent(new CustomEvent('ihack_api_logs_updated'));
  } catch (e) {
    console.error('Failed to save API logs:', e);
  }
}

export function clearApiLogs() {
  saveApiLogs([]);
}

export function calculateCost(
  model: string,
  type: 'TEXT' | 'AUDIO' | 'IMAGE',
  charsIn: number,
  charsOut: number,
  audioDurationSec: number
): number {
  // Let's model pricing on standard high-fidelity Gemini models
  // Text rate: Input ~ $0.075/M characters, Output ~ $0.30/M characters
  // Audio output rate: ~ $2.40 per Million characters (or ~$0.0015 per second of raw synthesised stream)
  // Image synthesis: ~$0.015 flat fee per high-fidelity render.
  
  let cost = 0;
  
  // Calculate base text input Cost
  cost += charsIn * 0.000000075;
  
  if (type === 'AUDIO') {
    // Add audio extraction fee
    cost += audioDurationSec * 0.00167; // ~$0.10 per min of audio
  } else if (type === 'IMAGE') {
    cost += 0.018; // ~$0.018 per overlay
  } else {
    // Standard text output fee
    cost += charsOut * 0.000000300;
  }
  
  // Clean decimal rounding to significant figures
  return Math.max(0.00001, parseFloat(cost.toFixed(6)));
}

export function logApiRequest(
  purpose: string,
  model: string,
  type: 'TEXT' | 'AUDIO' | 'IMAGE',
  details: {
    charsIn: number;
    charsOut?: number;
    audioDurationSec?: number;
    nodeId: string;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }
) {
  const duration = details.audioDurationSec || 0;
  const outChars = details.charsOut || 0;
  
  const approxCost = details.status === 'FAILED' ? 0 : calculateCost(
    model,
    type,
    details.charsIn,
    outChars,
    duration
  );

  const logEntry: ApiLog = {
    id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    purpose,
    model,
    charsIn: details.charsIn,
    charsOut: outChars,
    audioDurationSec: duration,
    nodeId: details.nodeId || 'UNKNOWN',
    approxCost,
    status: details.status,
    errorMessage: details.error
  };

  const logs = getApiLogs();
  // Append to the front of logs so newest is first
  logs.unshift(logEntry);
  saveApiLogs(logs);
}

export function downloadLogsAsJson() {
  const logs = getApiLogs();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `ihack-api-ledger-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getLedgerStats() {
  const logs = getApiLogs();
  
  // Calculate rolling statistics
  let totalCalls = logs.length;
  let totalCost = 0;
  let successCount = 0;
  const activeNodes = new Set<string>();
  
  for (const log of logs) {
    if (log.status === 'SUCCESS') {
      successCount++;
      totalCost += log.approxCost;
    }
    if (log.nodeId && log.nodeId !== 'UNKNOWN') {
      activeNodes.add(log.nodeId);
    }
  }

  const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 100;

  return {
    requests: totalCalls,
    cost: parseFloat(totalCost.toFixed(5)),
    avgLatency: 0,
    activeNodesCount: activeNodes.size || 1,
    successRate: parseFloat(successRate.toFixed(1)),
    activeNodesList: Array.from(activeNodes)
  };
}
