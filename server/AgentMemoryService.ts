import * as fs from "fs";
import * as path from "path";

export interface ChatMessage {
  role: string;
  content: string;
}

export class AgentMemoryService {
  private static getMemoryFilePath(): string {
    return path.join(process.cwd(), "workspace files", "SESSION.md");
  }

  static readSessionContext(): string {
    const filePath = this.getMemoryFilePath();
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
    return "";
  }

  static writeSessionContext(messages: ChatMessage[]): void {
    const filePath = this.getMemoryFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
    const formattedContent = `# Active Session Memory\n\n${content}`;
    fs.writeFileSync(filePath, formattedContent, "utf-8");
  }
}
