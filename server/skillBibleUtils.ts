// server/skillBibleUtils.ts
import * as fs from "fs";
import * as path from "path";

const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");

export interface DiscoveredFile {
  fileName: string;
  filePath: string;
  content: string;
}

export function discoverSkillFile(): DiscoveredFile | null {
  const possiblePaths = [
    path.join(WORKSPACE_DIR, "SKILLS"),
    path.join(process.cwd(), "workspace files", "SKILLS"),
    WORKSPACE_DIR
  ];

  for (const dirPath of possiblePaths) {
    if (!fs.existsSync(dirPath)) continue;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".md") && !file.toLowerCase().includes("readme")) {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isFile()) {
            const content = fs.readFileSync(fullPath, "utf-8");
            return { fileName: file, filePath: fullPath, content };
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

export function discoverBibleFile(): DiscoveredFile | null {
  const searchDirs = [
    path.join(WORKSPACE_DIR, "BIBLES"),
    path.join(WORKSPACE_DIR, "projects"),
    path.join(process.cwd(), "workspace files", "BIBLES"),
    path.join(process.cwd(), "workspace files", "projects"),
    WORKSPACE_DIR
  ];

  for (const dirPath of searchDirs) {
    if (!fs.existsSync(dirPath)) continue;
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isFile() && (item.name.endsWith(".md") || item.name.endsWith(".txt")) && !item.name.toLowerCase().includes("readme")) {
          const fullPath = path.join(dirPath, item.name);
          const content = fs.readFileSync(fullPath, "utf-8");
          return { fileName: item.name, filePath: fullPath, content };
        } else if (item.isDirectory()) {
          const subDir = path.join(dirPath, item.name);
          const subItems = fs.readdirSync(subDir);
          for (const subItem of subItems) {
            if ((subItem.endsWith(".md") || subItem.endsWith(".txt")) && !subItem.toLowerCase().includes("readme")) {
              const fullPath = path.join(subDir, subItem);
              if (fs.statSync(fullPath).isFile()) {
                const content = fs.readFileSync(fullPath, "utf-8");
                return { fileName: subItem, filePath: fullPath, content };
              }
            }
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

export function parseSkillSections(skillContent: string) {
  const allAgentsMatch = skillContent.match(/##\s+ALL AGENTS\s*[\r\n]+```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const allAgents = allAgentsMatch ? allAgentsMatch[1].trim() : "";

  const agentAMatch = skillContent.match(/##\s+AGENT:\s*AGENT A[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentA = agentAMatch ? agentAMatch[1].trim() : "";

  const agentBMatch = skillContent.match(/##\s+AGENT:\s*AGENT B[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentB = agentBMatch ? agentBMatch[1].trim() : "";

  const agentCMatch = skillContent.match(/##\s+AGENT:\s*AGENT C[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const agentC = agentCMatch ? agentCMatch[1].trim() : "";

  const jarvisMatch = skillContent.match(/##\s+AGENT:\s*JARVIS[\s\S]*?```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const jarvis = jarvisMatch ? jarvisMatch[1].trim() : "";

  const globalRulesMatch = skillContent.match(/##\s+GLOBAL RULES and OUTPUT FORMAT\s*[\r\n]+```(?:[a-z]*[\r\n]+)?([\s\S]*?)```/i);
  const globalRules = globalRulesMatch ? globalRulesMatch[1].trim() : "";

  return { allAgents, agentA, agentB, agentC, jarvis, globalRules };
}

export function extractStoryTitle(bibleContent: string, bibleFileName?: string): string {
  if (bibleContent) {
    const titleMatch = bibleContent.match(/-\s*\*\*Title\*\*\s*:\s*([^\r\n]+)/i);
    if (titleMatch && titleMatch[1].trim()) {
      return titleMatch[1].trim();
    }
    const headerMatch = bibleContent.match(/^#\s*(?:STORY BIBLE\s*:\s*)?([^\r\n]+)/im);
    if (headerMatch && headerMatch[1].trim()) {
      return headerMatch[1].trim();
    }
  }
  if (bibleFileName) {
    return bibleFileName.replace(/\.md$/i, "").replace(/_/g, " ");
  }
  return "Untitled_Story";
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[:\\/\*\?"<>\|]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export function parseBibleSections(bibleContent: string) {
  const conceptMatch = bibleContent.match(/##\s*1\.\s*PROJECT CONCEPT[\s\S]*?\n([\s\S]*?)(?=\n##\s*2\.|\n##\s*[0-9]|$)/i);
  const projectConcept = conceptMatch ? conceptMatch[1].trim() : "";

  const summaryMatch = bibleContent.match(/###\s*Narrative Summary[\s\S]*?\n([\s\S]*?)(?=\n###|\n##|$)/i);
  const narrativeSummary = summaryMatch ? summaryMatch[1].trim() : "";

  const cpsdMatch = bibleContent.match(/####?\s*Cinematic Prose Scene Document[\s\S]*?\n([\s\S]*?)(?=\n####?\s*Raw Prose|\n###?|\n##?|$)/i);
  const cpsdBlueprint = cpsdMatch ? cpsdMatch[1].trim() : "";

  const rawProseMatch = bibleContent.match(/####?\s*Raw Prose[\s\S]*?\n([\s\S]*?)(?=\n###?|\n##?|$)/i);
  const rawProse = rawProseMatch ? rawProseMatch[1].trim() : bibleContent;

  const charactersMatch = bibleContent.match(/##\s*4\.\s*CHARACTER PROFILES[\s\S]*?\n([\s\S]*?)(?=\n##\s*5\.|\n##\s*[0-9]|$)/i);
  const characterProfiles = charactersMatch ? charactersMatch[1].trim() : "";

  return { projectConcept, narrativeSummary, cpsdBlueprint, rawProse, characterProfiles };
}

export function listAllSkillFiles(): { fileName: string; relativePath: string; skills: { num: number; title: string }[] }[] {
  const skillsDir = path.join(WORKSPACE_DIR, "SKILLS");
  if (!fs.existsSync(skillsDir)) return [];
  const files = fs.readdirSync(skillsDir);
  const result = [];

  for (const file of files) {
    if (file.endsWith(".md") && !file.toLowerCase().includes("readme")) {
      const fullPath = path.join(skillsDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      
      const skillRegex = /#\s*SKILL\s*(\d+)\s*—?\s*([^\r\n]*)/gi;
      const skills = [];
      let match;
      while ((match = skillRegex.exec(content)) !== null) {
        skills.push({
          num: parseInt(match[1], 10),
          title: match[2].trim()
        });
      }

      result.push({
        fileName: file,
        relativePath: `SKILLS/${file}`,
        skills
      });
    }
  }
  return result;
}

export function listAllBibleFiles(): { fileName: string; relativePath: string; title: string }[] {
  const searchDirs = [
    { dirPath: path.join(WORKSPACE_DIR, "BIBLES"), prefix: "BIBLES" },
    { dirPath: path.join(WORKSPACE_DIR, "projects"), prefix: "projects" }
  ];

  const result: { fileName: string; relativePath: string; title: string }[] = [];
  const seenPaths = new Set<string>();

  for (const { dirPath, prefix } of searchDirs) {
    if (!fs.existsSync(dirPath)) continue;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          if ((entry.name.endsWith(".md") || entry.name.endsWith(".txt")) && !entry.name.toLowerCase().includes("readme")) {
            const fullPath = path.join(dirPath, entry.name);
            if (seenPaths.has(fullPath)) continue;
            seenPaths.add(fullPath);

            const content = fs.readFileSync(fullPath, "utf-8");
            const title = extractStoryTitle(content, entry.name);

            result.push({
              fileName: entry.name,
              relativePath: `${prefix}/${entry.name}`,
              title
            });
          }
        } else if (entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);
          const subFiles = fs.readdirSync(subDirPath);
          for (const subFile of subFiles) {
            if ((subFile.endsWith(".md") || subFile.endsWith(".txt")) && !subFile.toLowerCase().includes("readme")) {
              const fullPath = path.join(subDirPath, subFile);
              if (seenPaths.has(fullPath)) continue;
              seenPaths.add(fullPath);

              const content = fs.readFileSync(fullPath, "utf-8");
              const title = extractStoryTitle(content, subFile);

              result.push({
                fileName: subFile,
                relativePath: `${prefix}/${entry.name}/${subFile}`,
                title
              });
            }
          }
        }
      }
    } catch (e) {}
  }
  return result;
}
