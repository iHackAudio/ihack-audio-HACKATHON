import fs from "fs-extra";
import path from "path";

export function getWorkspaceRoot(): string {
  try {
    const configFile = path.join(process.cwd(), "server", "agent_config.json");
    if (fs.existsSync(configFile)) {
      const data = fs.readJsonSync(configFile);
      if (data.allowAppMutation === true) {
        return process.cwd();
      }
    }
  } catch (err) {
    // Ignore and fallback
  }
  const defaultWorkspace = path.join(process.cwd(), "workspace files");
  fs.ensureDirSync(defaultWorkspace);
  return defaultWorkspace;
}

function getSafePath(relativePath: string): string {
  let root = getWorkspaceRoot();
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.startsWith("protocols/") || normalized === "protocols") {
    root = path.join(process.cwd(), "workspace files");
  }

  const fullPath = path.resolve(root, relativePath);
  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
    throw new Error("Access denied: Path outside permitted directory root.");
  }
  return fullPath;
}

export function isProtectedPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/").trim();
  const lower = normalized.toLowerCase();

  // Block path traversal
  if (lower === "" || lower.startsWith("..") || lower.includes("/../")) {
    return true;
  }

  // Root configuration and execution system files
  const protectedRootFiles = [
    "server.ts",
    "filesystem.ts",
    "tsconfig.json",
    "vite.config.ts",
    "package.json",
    "package-lock.json",
    "index.html",
    "metadata.json",
    "agents.md",
    "session.md",
    "memory.ts",
    "test-grep.cjs"
  ];
  
  if (protectedRootFiles.includes(lower)) {
    return true;
  }

  // Broad source code directories
  if (lower.startsWith("server/") || lower.startsWith("src/")) {
    // We allow configuration writing under server (handled strictly via system fs writing, not here)
    // But any filesystem API tool writes/deletes for chat cells to server/ or src/ are blocked
    return true;
  }

  return false;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export async function listFiles(relativeDir: string = "."): Promise<FileNode[]> {
  const fullPath = getSafePath(relativeDir);

  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    // Exclude heavy/build/confidential artifacts to prevent endless loops and stay fast
    const isExcluded = ["node_modules", "dist", ".git", "package-lock.json", "server/agent_config.json", "server/agent_memory.json"].includes(entry.name);
    if (isExcluded) continue;

    const entryRelativePath = path.join(relativeDir, entry.name);
    const node: FileNode = {
      name: entry.name,
      path: entryRelativePath,
      type: entry.isDirectory() ? "directory" : "file",
    };
    nodes.push(node);
  }
  
  return nodes;
}

export async function readFile(relativePath: string, encoding: "utf-8" | "base64" = "utf-8"): Promise<string> {
  const fullPath = getSafePath(relativePath);
  return await fs.readFile(fullPath, encoding);
}

export async function writeFile(relativePath: string, content: string, encoding: "utf-8" | "base64" = "utf-8"): Promise<void> {
  if (isProtectedPath(relativePath)) {
    throw new Error(`Core Shield Integrity Protocol Active: Writing to critical system file "${relativePath}" is blocked to prevent system corruption.`);
  }
  const fullPath = getSafePath(relativePath);
  await fs.ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, content, encoding);
}

export async function readAsTextAdvanced(relativePath: string): Promise<string> {
  const fullPath = getSafePath(relativePath);

  const ext = path.extname(relativePath).toLowerCase();

  if (ext === ".docx" || ext === ".doc") {
    const buffer = await fs.readFile(fullPath);
    // @ts-ignore
    const wordExtModule = await import("word-extractor");
    const WordExtractor = wordExtModule.default || wordExtModule;
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return doc.getBody();
  }

  if (ext === ".pdf") {
    const buffer = await fs.readFile(fullPath);
    // @ts-ignore
    const pdfModule = await import("pdf-parse");
    const pdf = (pdfModule as any).default || pdfModule;
    const data = await pdf(buffer);
    return data.text;
  }

  // Fallback to utf-8 for other types
  return await fs.readFile(fullPath, "utf-8");
}

export async function deletePath(relativePath: string): Promise<void> {
  if (isProtectedPath(relativePath)) {
    throw new Error(`Core Shield Integrity Protocol Active: Deletion of critical system path "${relativePath}" is blocked at filesystem root.`);
  }
  const fullPath = getSafePath(relativePath);
  await fs.remove(fullPath);
}

export async function createDirectory(relativePath: string): Promise<void> {
  if (isProtectedPath(relativePath)) {
    throw new Error(`Core Shield Integrity Protocol Active: Creating directory inside protected path "${relativePath}" is blocked.`);
  }
  const fullPath = getSafePath(relativePath);
  await fs.ensureDir(fullPath);
}
