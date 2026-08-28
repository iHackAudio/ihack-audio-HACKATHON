import fs from "fs";
import path from "path";
import { getProjectDirectory, getActiveProjectTitle, sanitizeTitle } from "./storyBibleManager.ts";

function getQuestionnairePath(): string {
  const title = getActiveProjectTitle() || "Untitled Story";
  const sanitized = sanitizeTitle(title);
  const projectDir = getProjectDirectory(title);
  return path.join(projectDir, `${sanitized} questionnaire.json`);
}


export interface QuestionnaireState {
  step: number;
  completed: boolean;
  updatedAt: number;
  answers: {
    title?: string;
    genre?: string;
    hook?: string;
    summary?: string;
    speakerMode?: 'single' | 'multi';
    characterCount?: string;
    characterNames?: string;
    speechQuirks?: string;
    voiceId?: string;
    macroPlot?: string;
    climax?: string;
    resolution?: string;
    sceneObjectives?: string;
    location?: string;
    atmosphere?: string;
    targetEmotion?: string;
    tone?: string;
    audioAtmosphere?: string;
    maxWordsPerScene?: number;
    additionalNotes?: string;
  };
}

export function getDefaultQuestionnaire(): QuestionnaireState {
  return {
    step: 1,
    completed: false,
    updatedAt: Date.now(),
    answers: {
      title: "",
      genre: "",
      hook: "",
      summary: "",
      speakerMode: undefined,
      characterCount: "",
      characterNames: "",
      speechQuirks: "",
      voiceId: "",
      macroPlot: "",
      climax: "",
      resolution: "",
      sceneObjectives: "",
      location: "",
      atmosphere: "",
      targetEmotion: "",
      tone: "",
      audioAtmosphere: "",
      maxWordsPerScene: undefined,
      additionalNotes: ""
    }
  };
}

export function loadQuestionnaire(): QuestionnaireState {
  const filePath = getQuestionnairePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("[QuestionnaireManager] Read error, creating default:", e);
    }
  }

  // Check un-prefixed in project folder
  const title = getActiveProjectTitle() || "Untitled Story";
  const projectDir = getProjectDirectory(title);
  const unPrefixedPath = path.join(projectDir, "questionnaire.json");
  if (fs.existsSync(unPrefixedPath)) {
    try {
      const raw = fs.readFileSync(unPrefixedPath, "utf-8");
      const data = JSON.parse(raw);
      saveQuestionnaire(data);
      return data;
    } catch (e) {
      // ignore
    }
  }

  // Check root fallback
  const rootFallback = path.join(process.cwd(), "workspace files", "questionnaire.json");
  if (fs.existsSync(rootFallback)) {
    try {
      const raw = fs.readFileSync(rootFallback, "utf-8");
      const data = JSON.parse(raw);
      saveQuestionnaire(data);
      return data;
    } catch (e) {
      // ignore
    }
  }
  const defaultState = getDefaultQuestionnaire();
  saveQuestionnaire(defaultState);
  return defaultState;
}

export function saveQuestionnaire(state: QuestionnaireState): QuestionnaireState {
  const filePath = getQuestionnairePath();
  const updated: QuestionnaireState = {
    ...state,
    updatedAt: Date.now()
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}
