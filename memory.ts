import fs from "fs-extra";
import path from "path";

const MEMORY_PATH = path.join(process.cwd(), "memory.json");
const SESSION_MD_PATH = path.join(process.cwd(), "SESSION.md");

export interface MemoryData {
  session_id: string;
  messages: any[];
  files_summary: string[];
  decisions: string[];
  ai_outputs: string[];
}

export async function loadMemory(): Promise<MemoryData> {
  if (await fs.pathExists(MEMORY_PATH)) {
    return await fs.readJson(MEMORY_PATH);
  }
  return {
    session_id: Date.now().toString(),
    messages: [],
    files_summary: [],
    decisions: [],
    ai_outputs: []
  };
}

export async function saveMemory(data: MemoryData): Promise<void> {
  await fs.writeJson(MEMORY_PATH, data, { spaces: 2 });
}

export async function updateSessionMd(summary: string): Promise<void> {
  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toLocaleTimeString();
  const entry = `\n### [${date} ${time}] Update\n${summary}\n`;
  
  if (await fs.pathExists(SESSION_MD_PATH)) {
    await fs.appendFile(SESSION_MD_PATH, entry);
  } else {
    await fs.writeFile(SESSION_MD_PATH, `# J.A.R.V.I.S. Session Log\n${entry}`);
  }
}
