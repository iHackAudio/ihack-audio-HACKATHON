export interface Concept {
  title: string;
  hook: string;
  summary: string;
  genre: string;
  targetEmotion: string;
  tone: string;
  targetAudience: string;
  logline?: string;
  format?: string;
  genreVibe?: string;
  corePremiseAndWorld?: string[];
  keyConflictPillars?: string[];
  thematicMotifs?: string[];
  emotionalArcAndStakes?: string[];
  narrativeMilestones?: string[];
}

export interface Phase1Intake {
  theme: string;
  charactersOverview: string;
  storylineOverview: string;
  format: string;
  genreVibe: string;
  aiSuggestions: string[];
  checkedSuggestions: string[];
  userRevisionNotes: string;
  isLocked: boolean;
}

export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
}

export interface Storyline {
  macroPlotArc: string;
  chapterBreakdown: ChapterOutline[];
  keyTwists: string[];
  climax: string;
  resolution: string;
}

export interface SpeakersConfig {
  mode: 'single' | 'multi';
  narratorVoiceProfile: string;
  narratorVoiceId: string; // e.g. "Kore", "Aoede", "Orpheus"
  voiceAssignments: Record<string, string>; // characterId -> Gemini TTS voice ID ('Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Aoede', 'Orpheus')
}

export interface BiometricScanData {
  gender?: string;
  accent?: string;
  tone?: string;
  audioProfile?: string;
  styleDescription?: string;
  pace?: string;
  scene?: string;
  context?: string;
}

export interface ArchitectPromptData {
  personaName?: string;
  baseVoice?: string;
  systemPrompt?: string;
  voiceSettingNotes?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  age: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'narrator';
  vocalProfile: string; // pitch, accent, tone
  voiceId: string; // Edge TTS voice identifier
  background: string;
  speechQuirks: string;
  motivations: string;
  isLocked?: boolean;
  biometricScan?: BiometricScanData;
  architectPrompt?: ArchitectPromptData;
}

export interface LocationProfile {
  id: string;
  name: string;
  description: string;
  lighting: string;
  acoustics: string; // acoustic feel for audio narration (echoey, cramped, muffled)
  emotionalTension: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  period: string;
  description: string;
}

export interface SceneConstraint {
  maxWordsPerScene: number;
  pacing: 'slow' | 'moderate' | 'fast' | 'dynamic';
  toneNotes: string;
}

export interface AudioProductionSettings {
  audioFormat: string; // e.g. "mp3", "wav"
  speechRate: string; // e.g. "+0%", "+10%"
  pitch: string; // e.g. "+0Hz", "-2Hz"
  defaultNarratorVoice: string;
  backgroundAtmosphere: string;
}

export interface SceneIdeaItem {
  id: string;
  agent: 'Agent A' | 'Agent B' | 'Agent C (Twisted)';
  title: string;
  summary: string;
  twistOrHook?: string;
  dramaticWant?: string;
  subtextAndTension?: string;
  keyDialogueBeats?: string[];
  emotionalTurningPoint?: string;
}

export interface DiscussionMessage {
  id: string;
  sender: 'user' | 'agentC';
  text: string;
  timestamp: number;
}

export interface SceneIdeaMatrixEntry {
  sceneNumber: number;
  title: string;
  summary?: string;
  userPlan?: string;
  agentA_ideas: SceneIdeaItem[];
  agentB_ideas: SceneIdeaItem[];
  agentC_ideas: SceneIdeaItem[];
  selectedIdea?: SceneIdeaItem;
  discussionNotes: DiscussionMessage[];
  isLocked: boolean;
}

export interface BibleScene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  charactersInScene: string[];
  rawProse: string;
  cpsdDocument?: string;
  proseVersions?: {
    writerA?: string;
    writerB?: string;
    writerC?: string;
  };
  summary: string;
  dramaticWant?: string;
  subtextAndTension?: string;
  keyDialogueBeats?: string[];
  twistOrHook?: string;
  emotionalTurningPoint?: string;
  agentSource?: string;
  selectedIdea?: SceneIdeaItem;
  status: 'draft' | 'approved' | 'in_review' | 'scripted';
  isScripted?: boolean;
  scriptContent?: string;
  scriptVersions?: {
    slotA?: { writer: string; script: string };
    slotB?: { writer: string; script: string };
    slotC?: { writer: string; script: string };
    jarvis?: { writer: string; script: string };
  };
  jarvisScore?: number;
  jarvisFeedback?: string;
  updatedAt: number;
  emotionalBeat?: string;
  openingTone?: string;
}

export interface RevisionLogEntry {
  id: string;
  timestamp: number;
  phase: 'Phase 1: Concept' | 'Phase 2: Personas' | 'Phase 3: Scene Matrix' | 'Phase 4: Scripting';
  action: string;
  details: string;
}

export interface StoryBible {
  version: number;
  updatedAt: number;
  phaseLocks: {
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
    phase4: boolean;
  };
  phase1Intake: Phase1Intake;
  concept: Concept;
  storyline: Storyline;
  speakers: SpeakersConfig;
  characterLimitPerScene: number;
  characterProfiles: CharacterProfile[];
  locations: LocationProfile[];
  timeline: TimelineEvent[];
  storyRules: string[];
  sceneConstraints: SceneConstraint;
  audioProductionSettings: AudioProductionSettings;
  sceneIdeaMatrix: SceneIdeaMatrixEntry[];
  scenes: BibleScene[];
  revisionHistory: RevisionLogEntry[];
}

export function createDefaultStoryBible(): StoryBible {
  return {
    version: 1,
    updatedAt: Date.now(),
    phaseLocks: {
      phase1: false,
      phase2: false,
      phase3: false,
      phase4: false
    },
    phase1Intake: {
      theme: "",
      charactersOverview: "",
      storylineOverview: "",
      format: "",
      genreVibe: "",
      aiSuggestions: [],
      checkedSuggestions: [],
      userRevisionNotes: "",
      isLocked: false
    },
    concept: {
      title: "",
      hook: "",
      summary: "",
      genre: "",
      targetEmotion: "",
      tone: "",
      targetAudience: ""
    },
    storyline: {
      macroPlotArc: "",
      chapterBreakdown: [],
      keyTwists: [],
      climax: "",
      resolution: ""
    },
    speakers: {
      mode: "multi",
      narratorVoiceProfile: "",
      narratorVoiceId: "",
      voiceAssignments: {}
    },
    characterLimitPerScene: 1200,
    characterProfiles: [],
    locations: [],
    timeline: [],
    storyRules: [],
    sceneConstraints: {
      maxWordsPerScene: 800,
      pacing: "moderate",
      toneNotes: ""
    },
    audioProductionSettings: {
      audioFormat: "mp3",
      speechRate: "+0%",
      pitch: "+0Hz",
      defaultNarratorVoice: "",
      backgroundAtmosphere: ""
    },
    sceneIdeaMatrix: [],
    scenes: [],
    revisionHistory: []
  };
}

export function storyBibleToMarkdown(bible: StoryBible): string {
  const { concept, storyline, speakers, characterProfiles, locations, timeline, storyRules, sceneConstraints, audioProductionSettings, scenes } = bible;

  const safeChapters = Array.isArray(storyline?.chapterBreakdown) ? storyline.chapterBreakdown : [];
  const safeTwists = Array.isArray(storyline?.keyTwists) ? storyline.keyTwists : [];
  const safeChars = Array.isArray(characterProfiles) ? characterProfiles : [];
  const safeLocs = Array.isArray(locations) ? locations : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const safeRules = Array.isArray(storyRules) ? storyRules : [];
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  return `# STORY BIBLE: ${concept?.title || "Untitled Project"}
*Last Updated: ${new Date(bible.updatedAt || Date.now()).toLocaleString()} | Version: ${bible.version || 1}*

---

## 1. PROJECT CONCEPT
- **Title**: ${concept?.title || ""}
- **Genre**: ${concept?.genreVibe || concept?.genre || ""}
- **Hook / Logline**: ${concept?.logline || concept?.hook || ""}
- **Format**: ${concept?.format || "Audio Drama"}
- **Target Emotion**: ${concept?.targetEmotion || ""}
- **Tone**: ${concept?.tone || ""}
- **Target Audience**: ${concept?.targetAudience || ""}

### Narrative Summary
${concept?.summary || ""}

---

## 2. STORYLINE & MACRO STRUCTURE
- **Plot Arc**: ${storyline?.macroPlotArc || ""}
- **Climax**: ${storyline?.climax || ""}
- **Resolution**: ${storyline?.resolution || ""}

### Chapter Breakdown
${safeChapters.map(ch => `#### Chapter ${ch.chapterNumber}: ${ch.title}
- **Summary**: ${ch.summary}
- **Key Events**:
${Array.isArray(ch.keyEvents) ? ch.keyEvents.map(e => `  - ${e}`).join('\n') : "  - None defined"}
`).join('\n') || "No chapters defined."}

### Key Twists
${safeTwists.map(t => `- ${t}`).join('\n') || "- None defined"}

---

## 3. SPEAKER & VOICE CONFIGURATION
- **Speaker Mode**: ${speakers?.mode === 'multi' ? 'Multi-Speaker Audio Drama' : 'Single-Narrator Reading'}
- **Narrator Voice Profile**: ${speakers?.narratorVoiceProfile || ""}
- **Default Narrator Voice ID**: \`${speakers?.narratorVoiceId || ""}\`

### Voice Allocations
${Object.entries(speakers?.voiceAssignments || {}).map(([charId, vId]) => {
  const charName = safeChars.find(c => c.id === charId)?.name || charId;
  return `- **${charName}**: \`${vId}\``;
}).join('\n') || "- Default narrator voice applied to all characters"}

---

## 4. CHARACTER PROFILES
${safeChars.map(c => `### ${c.name} (${(c.role || "").toUpperCase()})
- **Age**: ${c.age}
- **Vocal Profile**: ${c.vocalProfile}
- **Voice ID**: \`${c.voiceId}\`
- **Background**: ${c.background}
- **Speech Quirks**: ${c.speechQuirks}
- **Internal Motivations**: ${c.motivations}
`).join('\n') || "No characters added."}

---

## 5. LOCATIONS & ACOUSTIC ENVIRONMENTS
${safeLocs.map(l => `### ${l.name}
- **Description**: ${l.description}
- **Lighting**: ${l.lighting}
- **Acoustic Profile**: ${l.acoustics}
- **Emotional Tension**: ${l.emotionalTension}
`).join('\n') || "No locations defined."}

---

## 6. TIMELINE & CHRONOLOGY
${safeTimeline.map(t => `- **[${t.period}] ${t.title}**: ${t.description}`).join('\n') || "No timeline events."}

---

## 7. STORY RULES & WORLD LAWS
${safeRules.map(r => `- ${r}`).join('\n') || "- No specific story rules."}

---

## 8. SCENE CONSTRAINTS & PRODUCTION
- **Max Words/Characters per Scene**: ${sceneConstraints?.maxWordsPerScene || 800}
- **Pacing Standard**: ${sceneConstraints?.pacing || "balanced"}
- **Tone Notes**: ${sceneConstraints?.toneNotes || ""}
- **Target Audio Format**: ${audioProductionSettings?.audioFormat || "mp3"}
- **Speech Rate**: ${audioProductionSettings?.speechRate || "0%"}
- **Pitch**: ${audioProductionSettings?.pitch || "0Hz"}
- **Background Atmosphere**: ${audioProductionSettings?.backgroundAtmosphere || ""}

---

## 9. SCENES & PROGRESS TRACKER
${safeScenes.map(s => {
  let md = `### Scene ${s.sceneNumber}: ${s.title} [${(s.status || "").toUpperCase()}]\n`;
  if (s.location) md += `- **Location**: ${s.location}\n`;
  if (s.charactersInScene && s.charactersInScene.length > 0) {
    md += `- **Characters**: ${Array.isArray(s.charactersInScene) ? s.charactersInScene.join(', ') : s.charactersInScene}\n`;
  }
  if (s.summary) md += `- **Summary**: ${s.summary}\n`;
  if (s.dramaticWant) md += `- **Dramatic Want / Goal**: ${s.dramaticWant}\n`;
  if (s.subtextAndTension) md += `- **Subtext & Tension**: ${s.subtextAndTension}\n`;
  if (s.keyDialogueBeats && s.keyDialogueBeats.length > 0) {
    md += `- **Key Dialogue Beats**:\n${s.keyDialogueBeats.map(b => `  - "${b}"`).join('\n')}\n`;
  }
  if (s.twistOrHook) md += `- **Twist / Hook**: ${s.twistOrHook}\n`;
  if (s.emotionalTurningPoint) md += `- **Emotional Turning Point**: ${s.emotionalTurningPoint}\n`;
  if (s.agentSource) md += `- **Matrix Source**: ${s.agentSource}\n`;
  if (s.jarvisScore) md += `- **JARVIS Score**: ${s.jarvisScore}/10\n`;
  if (s.jarvisFeedback) md += `- **JARVIS Notes**: ${s.jarvisFeedback}\n`;
  
  if (s.cpsdDocument) {
    md += `\n#### Cinematic Prose Scene Document (CPSD Blueprint)\n${s.cpsdDocument}\n`;
  }

  if (s.rawProse && (!s.cpsdDocument || !s.cpsdDocument.includes(s.rawProse.slice(0, 40)))) {
    md += `\n#### Raw Narrative Prose (Master)\n${s.rawProse}\n`;
  }

  if (s.scriptContent) {
    md += `\n#### Screenplay Script & Production Notes\n${s.scriptContent}\n`;
  }

  if (s.proseVersions) {
    md += `\n#### Prose Drafts\n`;
    if (s.proseVersions.writerA) md += `<details><summary>Writer A</summary>\n\n${s.proseVersions.writerA}\n</details>\n`;
    if (s.proseVersions.writerB) md += `<details><summary>Writer B</summary>\n\n${s.proseVersions.writerB}\n</details>\n`;
    if (s.proseVersions.writerC) md += `<details><summary>Writer C</summary>\n\n${s.proseVersions.writerC}\n</details>\n`;
  }

  return md;
}).join('\n---\n\n') || "No scenes logged."}

${Array.isArray(bible.sceneIdeaMatrix) && bible.sceneIdeaMatrix.length > 0 ? `
---

## 10. SCENE MATRIX & CONCEPTUAL IDEAS
${bible.sceneIdeaMatrix.map(m => `
### Scene ${m.sceneNumber}: ${m.title}
${m.selectedIdea ? `**Selected Idea [${m.selectedIdea.agent}]:** ${m.selectedIdea.title}
- **Summary:** ${m.selectedIdea.summary}
- **Dramatic Want:** ${m.selectedIdea.dramaticWant || 'N/A'}
- **Subtext & Tension:** ${m.selectedIdea.subtextAndTension || 'N/A'}
- **Key Dialogue Beats:** ${m.selectedIdea.keyDialogueBeats?.join(' | ') || 'N/A'}
- **Twist / Hook:** ${m.selectedIdea.twistOrHook || 'N/A'}
- **Emotional Turning Point:** ${m.selectedIdea.emotionalTurningPoint || 'N/A'}
` : 'No idea selected.'}
`).join('\n')}` : ''}
`;
}
