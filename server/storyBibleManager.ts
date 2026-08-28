import fs from "fs";
import path from "path";
import type { StoryBible } from "../src/types/storyBible.ts";
import { createDefaultStoryBible, storyBibleToMarkdown } from "../src/types/storyBible.ts";

function getWorkspaceRoot(): string {
  const defaultWorkspace = path.join(process.cwd(), "workspace files");
  if (!fs.existsSync(defaultWorkspace)) {
    fs.mkdirSync(defaultWorkspace, { recursive: true });
  }
  return defaultWorkspace;
}

export function sanitizeTitle(title?: string): string {
  if (!title || !title.trim()) return "Untitled Story";
  const cleaned = title
    .replace(/[:/\\?%*|"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Untitled Story";
}

export function getActiveProjectTitle(): string | null {
  const activePath = path.join(getWorkspaceRoot(), "active_project.json");
  if (fs.existsSync(activePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(activePath, "utf-8"));
      return data.title || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function setActiveProjectTitle(title: string): void {
  const activePath = path.join(getWorkspaceRoot(), "active_project.json");
  try {
    fs.writeFileSync(activePath, JSON.stringify({ title, updatedAt: Date.now() }, null, 2), "utf-8");
  } catch (e) {
    console.error("[StoryBibleManager] Failed to write active_project.json:", e);
  }
}

export function getProjectDirectory(targetTitle?: string): string {
  const title = targetTitle || getActiveProjectTitle() || "Untitled Story";
  const sanitized = sanitizeTitle(title);
  const projectsDir = path.join(getWorkspaceRoot(), "projects");
  const projectFolder = path.join(projectsDir, sanitized);
  
  if (!fs.existsSync(projectFolder)) {
    fs.mkdirSync(projectFolder, { recursive: true });
  }
  return projectFolder;
}

export function getStoryBibleJsonPath(targetTitle?: string): string {
  const title = targetTitle || getActiveProjectTitle() || "Untitled Story";
  const sanitized = sanitizeTitle(title);
  return path.join(getProjectDirectory(title), `${sanitized} story_bible.json`);
}

export function getStoryBibleMarkdownPath(targetTitle?: string): string {
  const title = targetTitle || getActiveProjectTitle() || "Untitled Story";
  const sanitized = sanitizeTitle(title);
  return path.join(getProjectDirectory(title), `${sanitized} STORY_BIBLE.md`);
}

export function loadStoryBible(targetTitle?: string): StoryBible {
  const title = targetTitle || getActiveProjectTitle();
  const projectJsonPath = getStoryBibleJsonPath(title || undefined);

  if (fs.existsSync(projectJsonPath)) {
    try {
      const raw = fs.readFileSync(projectJsonPath, "utf-8");
      return JSON.parse(raw) as StoryBible;
    } catch (e) {
      console.error(`[StoryBibleManager] Failed to read ${projectJsonPath}:`, e);
    }
  }

  // Fallback to un-prefixed story_bible.json inside project folder
  if (title) {
    const projectFolder = getProjectDirectory(title);
    const unPrefixedJsonPath = path.join(projectFolder, "story_bible.json");
    if (fs.existsSync(unPrefixedJsonPath)) {
      try {
        const raw = fs.readFileSync(unPrefixedJsonPath, "utf-8");
        const bible = JSON.parse(raw) as StoryBible;
        saveStoryBible(bible);
        return bible;
      } catch (e) {
        console.error(`[StoryBibleManager] Failed to read ${unPrefixedJsonPath}:`, e);
      }
    }

    // Check for loose title-prefixed legacy files in root workspace files or BIBLES folder
    const sanitized = sanitizeTitle(title);
    const legacyTitleJsonPath = path.join(getWorkspaceRoot(), `${sanitized} story_bible.json`);
    const biblesTitleJsonPath = path.join(getWorkspaceRoot(), "BIBLES", `${sanitized} story_bible.json`);

    for (const checkPath of [legacyTitleJsonPath, biblesTitleJsonPath]) {
      if (fs.existsSync(checkPath)) {
        try {
          const raw = fs.readFileSync(checkPath, "utf-8");
          const bible = JSON.parse(raw) as StoryBible;
          saveStoryBible(bible); // Migrates into projects/ & BIBLES/ folders
          return bible;
        } catch (e) {
          console.error(`[StoryBibleManager] Failed to read ${checkPath}:`, e);
        }
      }
    }
  }

  // Fallback to generic story_bible.json in root
  const genericJsonPath = path.join(getWorkspaceRoot(), "story_bible.json");
  if (fs.existsSync(genericJsonPath)) {
    try {
      const raw = fs.readFileSync(genericJsonPath, "utf-8");
      const bible = JSON.parse(raw) as StoryBible;
      if (bible.concept?.title) {
        setActiveProjectTitle(bible.concept.title);
      }
      saveStoryBible(bible); // Migrates into projects/ folder
      return bible;
    } catch (e) {
      console.error("[StoryBibleManager] Failed to read generic story_bible.json:", e);
    }
  }

  // Create default if absent
  const defaultBible = createDefaultStoryBible();
  saveStoryBible(defaultBible);
  return defaultBible;
}

export function saveStoryBible(bible: StoryBible): StoryBible {
  const title = bible.concept?.title || "Untitled Story";
  const sanitized = sanitizeTitle(title);
  const projectFolder = getProjectDirectory(title);

  const updatedBible: StoryBible = {
    ...bible,
    version: (bible.version || 0) + 1,
    updatedAt: Date.now()
  };

  setActiveProjectTitle(title);

  const projectJsonPath = path.join(projectFolder, `${sanitized} story_bible.json`);
  const projectMdPath = path.join(projectFolder, `${sanitized} STORY_BIBLE.md`);

  // Write into project folder with title prefix
  fs.writeFileSync(projectJsonPath, JSON.stringify(updatedBible, null, 2), "utf-8");

  const mdContent = storyBibleToMarkdown(updatedBible);
  fs.writeFileSync(projectMdPath, mdContent, "utf-8");

  // Keep workspace files/BIBLES folder synced for consistent module access
  try {
    const biblesFolder = path.join(getWorkspaceRoot(), "BIBLES");
    if (!fs.existsSync(biblesFolder)) {
      fs.mkdirSync(biblesFolder, { recursive: true });
    }
    const biblesMdPath = path.join(biblesFolder, `${sanitized} STORY_BIBLE.md`);
    fs.writeFileSync(biblesMdPath, mdContent, "utf-8");
  } catch (e) {
    console.error("[StoryBibleManager] Failed to sync to BIBLES folder:", e);
  }

  // Export individual scene files
  if (updatedBible.scenes && updatedBible.scenes.length > 0) {
    const scenesFolder = path.join(projectFolder, "Scenes");
    if (!fs.existsSync(scenesFolder)) {
      fs.mkdirSync(scenesFolder, { recursive: true });
    }

    updatedBible.scenes.forEach(scene => {
      const sceneTitleSanitized = sanitizeTitle(scene.title || `Scene_${scene.sceneNumber}`);
      const sceneNumberStr = String(scene.sceneNumber).padStart(2, '0');
      const sceneFileName = `${sceneNumberStr}_${sceneTitleSanitized}.md`;
      const sceneFilePath = path.join(scenesFolder, sceneFileName);

      let sceneMdContent = `# ${scene.title || `Scene ${scene.sceneNumber}`}\n\n`;
      if (scene.location) sceneMdContent += `**Location:** ${scene.location}\n`;
      if (scene.charactersInScene && scene.charactersInScene.length > 0) {
        sceneMdContent += `**Characters:** ${scene.charactersInScene.join(", ")}\n`;
      }
      sceneMdContent += `**Status:** ${scene.status || "draft"}\n\n`;
      
      sceneMdContent += `## Summary\n${scene.summary || "No summary provided."}\n\n`;
      if (scene.dramaticWant) sceneMdContent += `**Dramatic Want / Goal:** ${scene.dramaticWant}\n\n`;
      if (scene.subtextAndTension) sceneMdContent += `**Subtext & Tension:** ${scene.subtextAndTension}\n\n`;
      if (scene.keyDialogueBeats && scene.keyDialogueBeats.length > 0) {
        sceneMdContent += `**Key Dialogue Beats:**\n${scene.keyDialogueBeats.map(b => `- "${b}"`).join('\n')}\n\n`;
      }
      if (scene.twistOrHook) sceneMdContent += `**Twist / Hook:** ${scene.twistOrHook}\n\n`;
      if (scene.emotionalTurningPoint) sceneMdContent += `**Emotional Turning Point:** ${scene.emotionalTurningPoint}\n\n`;
      if (scene.agentSource) sceneMdContent += `**Matrix Source:** ${scene.agentSource}\n\n`;

      if (scene.cpsdDocument) {
        sceneMdContent += `## CPSD Document\n\n${scene.cpsdDocument}\n\n`;
      }
      if (scene.rawProse && (!scene.cpsdDocument || !scene.cpsdDocument.includes(scene.rawProse.slice(0, 40)))) {
        sceneMdContent += `## Narrative Prose\n\n${scene.rawProse}\n\n`;
      }
      if (scene.scriptContent) {
        sceneMdContent += `## Screenplay Script\n\n${scene.scriptContent}\n\n`;
      }

      fs.writeFileSync(sceneFilePath, sceneMdContent, "utf-8");
    });
  }

  return updatedBible;
}

export function getStoryBibleMarkdown(targetTitle?: string): string {
  const mdPath = getStoryBibleMarkdownPath(targetTitle);
  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, "utf-8");
  }
  const bible = loadStoryBible(targetTitle);
  return storyBibleToMarkdown(bible);
}

export function resetStoryBible(initialTitle?: string): StoryBible {
  const defaultBible = createDefaultStoryBible();
  if (initialTitle) {
    defaultBible.concept.title = initialTitle;
  }
  return saveStoryBible(defaultBible);
}

export function listWorkspaceProjects(): Array<{ title: string; folder: string; jsonPath: string; mdPath: string; updatedAt: number }> {
  const root = getWorkspaceRoot();
  const projectsDir = path.join(root, "projects");
  const projects: Array<{ title: string; folder: string; jsonPath: string; mdPath: string; updatedAt: number }> = [];

  if (fs.existsSync(projectsDir)) {
    const folders = fs.readdirSync(projectsDir, { withFileTypes: true });
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const dirPath = path.join(projectsDir, folder.name);
        const filesInDir = fs.readdirSync(dirPath);
        const jsonFile = filesInDir.find(f => f.endsWith("story_bible.json"));
        const mdFile = filesInDir.find(f => f.endsWith("STORY_BIBLE.md"));

        if (jsonFile) {
          const jsonPath = path.join(dirPath, jsonFile);
          const mdPath = mdFile ? path.join(dirPath, mdFile) : path.join(dirPath, `${folder.name} STORY_BIBLE.md`);
          try {
            const raw = fs.readFileSync(jsonPath, "utf-8");
            const parsed = JSON.parse(raw);
            projects.push({
              title: parsed.concept?.title || folder.name,
              folder: folder.name,
              jsonPath,
              mdPath,
              updatedAt: parsed.updatedAt || 0
            });
          } catch (e) {
            // ignore corrupt json
          }
        }
      }
    }
  }

  return projects;
}

export function importStoryBibleData(input: string | any): StoryBible {
  let parsed: any;
  if (typeof input === "string") {
    parsed = JSON.parse(input);
  } else {
    parsed = input;
  }

  const defaultBible = createDefaultStoryBible();
  const mergedBible: StoryBible = {
    ...defaultBible,
    ...parsed,
    concept: { ...defaultBible.concept, ...(parsed.concept || {}) },
    storyline: { ...defaultBible.storyline, ...(parsed.storyline || {}) },
    speakers: { ...defaultBible.speakers, ...(parsed.speakers || {}) },
    sceneConstraints: { ...defaultBible.sceneConstraints, ...(parsed.sceneConstraints || {}) },
    audioProductionSettings: { ...defaultBible.audioProductionSettings, ...(parsed.audioProductionSettings || {}) },
    characterProfiles: parsed.characterProfiles || defaultBible.characterProfiles,
    locations: parsed.locations || defaultBible.locations,
    timeline: parsed.timeline || defaultBible.timeline,
    storyRules: parsed.storyRules || defaultBible.storyRules,
    scenes: parsed.scenes || defaultBible.scenes,
    version: (parsed.version || 0) + 1,
    updatedAt: Date.now()
  };

  return saveStoryBible(mergedBible);
}


