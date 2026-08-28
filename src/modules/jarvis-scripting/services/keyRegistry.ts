
/**
 * iHack Neural Key Registry
 * Rotates across dedicated API keys for TTS, Scripting, and Forensics.
 * Includes automatic round-robin and failover logic when rate limits (429) occur.
 */

const KEY_POOL = [
  "AIzaSyByylmb9CEkOVOc_EJBrtvreuAmhKi3vWY",
  "AIzaSyDgMZD72FPHL0hkI48sF-3AWH9UUxQX5Go",
  "AIzaSyAF3d-4dqN2e9luW3pPAxD2jHQ1y4lS1sU",
  "AIzaSyDtEC1fWWpOtiWid9JlJpKIn0kNaZ5frYg",
  "AQ.Ab8RN6IoGT6azWvfPcoHiglj34fUHw54o-7ma7WMBIfmwoJOFQ",
  "AIzaSyDJG7y0hbHKYKskjMLcEqCuDjwCv7YNi9c"
];

export type NeuralTask = 'AUDIO' | 'SCRIPT' | 'FORENSIC';
export type NodeId = '1A' | '2A' | '3A' | '4A' | '5A' | '6A';

// Track exhausted keys in current session
const exhaustedKeys = new Set<string>();
let keyIndex = 0;

/**
 * Returns an available key from the pool, rotating round-robin across unexhausted keys.
 */
export function getNeuralKey(task: NeuralTask): { key: string; nodeId: NodeId } {
  // Filter out exhausted keys
  const availableKeys = KEY_POOL.filter(k => !exhaustedKeys.has(k));

  if (availableKeys.length > 0) {
    // Pick next key in round-robin fashion from available keys
    const chosenKey = availableKeys[keyIndex % availableKeys.length];
    keyIndex = (keyIndex + 1) % availableKeys.length;
    const originalIndex = KEY_POOL.indexOf(chosenKey);
    const nodeId = `${originalIndex + 1}A` as NodeId;
    return { key: chosenKey, nodeId };
  }

  // If all pool keys are marked exhausted, reset exhaustion list and try first key or env key
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (envKey && !exhaustedKeys.has(envKey)) {
    return { key: envKey, nodeId: '1A' };
  }

  // Clear exhausted set as last resort to allow retry after potential quota reset period
  exhaustedKeys.clear();
  return { key: KEY_POOL[0], nodeId: '1A' };
}

/**
 * Marks a key as exhausted (hit rate limit 429).
 */
export function markKeyExhausted(key: string) {
  exhaustedKeys.add(key);
  console.warn(`[Neural Registry] Key ${key.substring(0, 10)}... exhausted. Failover activated.`);
}

/**
 * Checks if a specific Node ID is down.
 */
export function isNodeDown(nodeId: NodeId): boolean {
  const index = parseInt(nodeId.replace('A', ''), 10) - 1;
  const key = KEY_POOL[index];
  return key ? exhaustedKeys.has(key) : false;
}

