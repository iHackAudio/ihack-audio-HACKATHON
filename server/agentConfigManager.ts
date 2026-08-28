import * as fs from "fs";
import * as path from "path";
import { AGENT_A_SYSTEM_INSTRUCTION, AGENT_B_SYSTEM_INSTRUCTION, AGENT_C_SYSTEM_INSTRUCTION } from "./instruction";

const CONFIG_FILE = path.join(process.cwd(), "server", "agent_config.json");

export interface AgentConfig {
  enabled: boolean;
  systemInstruction: string;
  model: string;
}

export interface SystemConfig {
  agentA: AgentConfig;
  agentB: AgentConfig;
  agentC: AgentConfig;
  jarvis?: AgentConfig;
  writerA?: AgentConfig;
  writerB?: AgentConfig;
  writerC?: AgentConfig;
  allowAppMutation?: boolean;
  groqApiKey?: string;
  [key: string]: any;
}

const DEFAULT_CONFIG: SystemConfig = {
  agentA: {
    enabled: true,
    systemInstruction: AGENT_A_SYSTEM_INSTRUCTION,
    model: "gemini-3.1-flash-lite"
  },
  agentB: {
    enabled: true,
    systemInstruction: AGENT_B_SYSTEM_INSTRUCTION,
    model: "gemini-3.1-flash-lite"
  },
  agentC: {
    enabled: true,
    systemInstruction: AGENT_C_SYSTEM_INSTRUCTION,
    model: "gemma-4-31b-it"
  },
  jarvis: {
    enabled: true,
    systemInstruction: "",
    model: "gemini-3.1-flash-lite"
  },
  writerA: {
    enabled: true,
    systemInstruction: "",
    model: "gemini-3.1-flash-lite"
  },
  writerB: {
    enabled: true,
    systemInstruction: "",
    model: "gemini-3.1-flash-lite"
  },
  writerC: {
    enabled: true,
    systemInstruction: "",
    model: "gemma-4-31b-it"
  },
  allowAppMutation: true,
  groqApiKey: "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"
};

export function loadAgentConfigs(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return {
        agentA: { ...DEFAULT_CONFIG.agentA, ...data.agentA },
        agentB: { ...DEFAULT_CONFIG.agentB, ...data.agentB },
        agentC: { ...DEFAULT_CONFIG.agentC, ...(data.agentC || data.middleman) },
        jarvis: data.jarvis ? { ...DEFAULT_CONFIG.jarvis, ...data.jarvis } : DEFAULT_CONFIG.jarvis,
        writerA: data.writerA ? { ...DEFAULT_CONFIG.writerA, ...data.writerA } : DEFAULT_CONFIG.writerA,
        writerB: data.writerB ? { ...DEFAULT_CONFIG.writerB, ...data.writerB } : DEFAULT_CONFIG.writerB,
        writerC: data.writerC ? { ...DEFAULT_CONFIG.writerC, ...data.writerC } : DEFAULT_CONFIG.writerC,
        allowAppMutation: data.allowAppMutation !== undefined ? data.allowAppMutation : DEFAULT_CONFIG.allowAppMutation,
        groqApiKey: data.groqApiKey !== undefined ? data.groqApiKey : DEFAULT_CONFIG.groqApiKey,
        ...data
      };
    }
  } catch (err) {
    console.error("Failed to load agent configs:", err);
  }
  return DEFAULT_CONFIG;
}

export function saveAgentConfigs(config: SystemConfig) {
  try {
    const parentDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save agent configs:", err);
  }
}
