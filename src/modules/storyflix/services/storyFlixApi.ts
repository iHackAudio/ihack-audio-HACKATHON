import { StoryFlixBible, CharacterPersona, SceneMatrix3x3Result, BibleScene } from '../types/storyFlix';

export async function fetchStoryBible(): Promise<StoryFlixBible | null> {
  try {
    const res = await fetch('/api/bible/get');
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch Story Bible from server:', error);
  }
  return null;
}

export async function updateStoryBible(
  updates: Partial<StoryFlixBible>,
  actionName: string,
  actionDetails: string
): Promise<StoryFlixBible | null> {
  try {
    const res = await fetch('/api/bible/update-phase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, actionName, actionDetails })
    });
    if (res.ok) {
      const data = await res.json();
      return data.bible || null;
    }
  } catch (error) {
    console.error('Failed to update Story Bible:', error);
  }
  return null;
}

export async function analyzeCoreIdea(params: {
  theme: string;
  charactersOverview: string;
  storylineOverview: string;
  format: string;
  genreVibe: string;
}) {
  const res = await fetch('/api/pipeline/phase1-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Failed to analyze core story idea.');
  }
  return await res.json();
}

export async function extractPersonas(params: {
  charactersOverview: string;
  storylineOverview: string;
  genreVibe: string;
}): Promise<CharacterPersona[]> {
  const res = await fetch('/api/persona/extract-characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Failed to extract character personas.');
  }
  const data = await res.json();
  const rawList = data.characters || [];
  return rawList.map((c: any, idx: number) => ({
    id: c.id || `char_${Date.now()}_${idx}`,
    name: c.name || `Character ${idx + 1}`,
    role: c.role || (idx === 0 ? 'protagonist' : 'supporting'),
    age: c.age || '30s',
    vocalProfile: c.vocalProfile || 'Resonant & Clear (en-US)',
    voiceId: c.voiceId || (idx % 2 === 0 ? 'Kore' : 'Charon'),
    background: c.background || '',
    speechQuirks: c.speechQuirks || '',
    motivations: c.motivations || '',
    isLocked: true
  }));
}

export async function uploadForgeScan(file: File, modelId: string = 'gemini-3.6-flash') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('modelId', modelId);

  const res = await fetch('/api/persona/forge-scan', {
    method: 'POST',
    body: formData
  });

  const rawText = await res.text();
  try {
    const data = JSON.parse(rawText);
    if (!res.ok) {
      throw new Error(data.error || 'Forge scan failed');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Invalid server response for biometric scan.');
  }
}

export async function generate3x3SceneMatrix(params: {
  pathType: 'no_plan' | 'have_plan' | 'custom_builder';
  userPlan?: string;
  conceptSummary: string;
  customFocus?: string;
}): Promise<SceneMatrix3x3Result> {
  const res = await fetch('/api/pipeline/scene-matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Failed to generate 3x3 scene matrix.');
  }
  return await res.json();
}

export async function chatWithSceneDirector(params: {
  userMessage: string;
  chatHistory: Array<{ sender: 'user' | 'assistant'; text: string }>;
  currentCustomScene: any;
}) {
  const res = await fetch('/api/pipeline/custom-scene-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Director chat failed.');
  }
  return await res.json();
}

export async function generateCpsdAndProse(params: {
  approvedScene: Partial<BibleScene>;
  customFocus?: string;
}) {
  const res = await fetch('/api/pipeline/phase4-generate-cpsd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Failed to generate CPSD and narrative prose.');
  }
  return await res.json() as {
    cpsdDocument: string;
    cleanNarrativeProse: string;
    screenplayScript: string;
  };
}

export async function refineCpsdWithJarvis(params: {
  userInstruction: string;
  cpsdDocument: string;
  cleanNarrativeProse: string;
  screenplayScript: string;
  currentScene: Partial<BibleScene>;
  chatHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}) {
  const res = await fetch('/api/pipeline/cpsd-refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error('Failed to refine CPSD with JARVIS.');
  }
  return await res.json() as {
    reply: string;
    cpsdDocument: string;
    cleanNarrativeProse: string;
    screenplayScript: string;
  };
}

export async function runStoryBibleCritique() {
  const res = await fetch('/api/bible/critique', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to run Story Bible critique.');
  }
  return await res.json();
}

export async function importStoryBibleData(jsonString: string) {
  const res = await fetch('/api/bible/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: jsonString })
  });
  if (!res.ok) {
    throw new Error('Failed to import Story Bible data.');
  }
  return await res.json();
}

export function compileCpsdMarkdown(bible: StoryFlixBible): string {
  const { concept, characterProfiles, scenes } = bible;
  let md = `# CHARACTER-PLOT-SETTING DOSSIER (CPSD) & STORY BIBLE\n`;
  md += `**Title:** ${concept.title || 'Untitled Project'}\n`;
  md += `**Genre & Vibe:** ${concept.genre || 'Cinematic Drama'} | **Format:** ${concept.format || 'Full-Cast Audio Drama'}\n`;
  md += `**Version:** v${bible.version || 1} | **Last Synchronized:** ${new Date(bible.updatedAt).toLocaleString()}\n\n`;
  md += `---\n\n`;

  md += `## 1. CORE STORY IDEA & WORLD RULES\n`;
  md += `### Hook / Logline\n> "${concept.hook || 'No logline entered yet.'}"\n\n`;
  md += `### Narrative Synopsis\n${concept.summary || 'No summary defined.'}\n\n`;

  if (concept.corePremiseAndWorld && concept.corePremiseAndWorld.length > 0) {
    md += `### Core Premise & Worldbuilding\n`;
    concept.corePremiseAndWorld.forEach(item => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (concept.keyConflictPillars && concept.keyConflictPillars.length > 0) {
    md += `### Key Conflict Pillars\n`;
    concept.keyConflictPillars.forEach(item => {
      md += `- ⚡ ${item}\n`;
    });
    md += `\n`;
  }

  if (concept.thematicMotifs && concept.thematicMotifs.length > 0) {
    md += `### Thematic Motifs\n`;
    concept.thematicMotifs.forEach(item => {
      md += `- 🎨 ${item}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;

  md += `## 2. CHARACTER PERSONAS & VOCAL PROFILES\n`;
  if (!characterProfiles || characterProfiles.length === 0) {
    md += `*No character personas extracted yet.*\n\n`;
  } else {
    characterProfiles.forEach(char => {
      md += `### ${char.name} (${char.role.toUpperCase()})\n`;
      md += `- **Age:** ${char.age || 'Unknown'}\n`;
      md += `- **Gemini Voice ID:** \`${char.voiceId}\` | **Vocal Tone:** ${char.vocalProfile}\n`;
      md += `- **Backstory:** ${char.background || 'N/A'}\n`;
      md += `- **Speech Quirks:** ${char.speechQuirks || 'N/A'}\n`;
      md += `- **Core Motivations:** ${char.motivations || 'N/A'}\n\n`;
    });
  }

  md += `---\n\n`;

  md += `## 3. SCENES & CPSD BLUEPRINT PROGRESSION\n`;
  if (!scenes || scenes.length === 0) {
    md += `*No scenes locked yet. Run the 3x3 Scene Matrix to draft scenes.*\n\n`;
  } else {
    scenes.forEach(sc => {
      md += `### Scene ${sc.sceneNumber}: ${sc.title}\n`;
      md += `- **Location / Atmosphere:** ${sc.location || 'Primary Setting'}\n`;
      md += `- **Cast in Scene:** ${sc.charactersInScene?.join(', ') || 'Ensemble'}\n`;
      md += `- **Dramatic Goal:** ${sc.dramaticWant || 'N/A'}\n`;
      md += `- **Subtext & Tension:** ${sc.subtextAndTension || 'N/A'}\n`;
      if (sc.twistOrHook) md += `- **Twist / Escalation:** ${sc.twistOrHook}\n`;
      if (sc.keyDialogueBeats && sc.keyDialogueBeats.length > 0) {
        md += `- **Dialogue Beats:**\n`;
        sc.keyDialogueBeats.forEach(b => {
          md += `  - "${b}"\n`;
        });
      }
      if (sc.cpsdDocument) {
        md += `\n#### CPSD Blueprint\n\`\`\`\n${sc.cpsdDocument}\n\`\`\`\n`;
      }
      if (sc.rawProse) {
        md += `\n#### Raw Narrative Prose (~800 words)\n${sc.rawProse}\n\n`;
      }
      md += `\n`;
    });
  }

  return md;
}
