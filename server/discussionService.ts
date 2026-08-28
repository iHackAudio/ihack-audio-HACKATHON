import { GoogleGenAI } from "@google/genai";
import { StoryBible } from "../src/types/storyBible.ts";
import { ParameterLockItem, DiscussionThinkingTrace, DiscussionMessage, DiscussionPhase } from "../src/types/discussion.ts";
import { generateContentWithFallback } from "./aiProviderService.ts";
import { loadSkill } from "./geminiService.ts";

function getGeminiApiKey(): string {
  return process.env.GEMINI_KEY_JARVIS || process.env.GEMINI_API_KEY || "";
}

export interface DiscussionChatRequest {
  userMessage: string;
  currentPhase: DiscussionPhase;
  discussionHistory: Array<{ sender: 'user' | 'ai'; text: string; phase?: number }>;
  storyBible: StoryBible;
  locksMap: Record<string, ParameterLockItem>;
}

export interface DiscussionChatResponse {
  message: DiscussionMessage;
  updatedBible?: StoryBible;
}

/**
 * Builds the comprehensive prompt for Discussion Mode.
 * Forces the AI to think from the user's perspective, analyze subtext,
 * honor locked story parameters, and actively engage in the Lock Negotiation Loop:
 * - Ask, note down, suggest parameters
 * - If user agrees ("Yes"), lock the parameter
 * - If user disagrees ("No"), ask why, provide 3 distinct creative alternatives/options, and discuss until "Yes"!
 */
export function buildDiscussionPrompt(
  userMessage: string,
  currentPhase: DiscussionPhase,
  discussionHistory: Array<{ sender: 'user' | 'ai'; text: string; phase?: number }>,
  storyBible: StoryBible,
  locksMap: Record<string, ParameterLockItem>
): string {
  // Load Oscar & Scripting skills for subtextual and atmospheric depth
  const oscarSkill = loadSkill("oscar-cinematic-storyteller.md");
  const scriptingSkill = loadSkill("SCRIPTING_SKILL.md");

  // Collect active locked parameters
  const lockedItems = Object.values(locksMap).filter(item => item.isLocked);
  const lockedSummary = lockedItems.length > 0
    ? lockedItems.map(item => `  - [LOCKED 🔒] ${item.label} (${item.key}): "${item.value}"`).join("\n")
    : "  - No parameters explicitly locked yet. All story areas are currently open for fluid discussion.";

  const unlockedItems = Object.values(locksMap).filter(item => !item.isLocked);
  const unlockedSummary = unlockedItems.length > 0
    ? unlockedItems.map(item => `  - [FLUID 🔓] ${item.label} (${item.key}): "${item.value || 'Not set'}"`).join("\n")
    : "  - All parameters are locked.";

  // Collect current Story Bible state summary
  const bibleSummary = `
Story Bible Context:
- Title: "${storyBible.concept?.title || 'Untitled Story'}"
- Logline/Hook: "${storyBible.concept?.logline || storyBible.concept?.hook || 'Not set'}"
- Tone & Genre: "${storyBible.concept?.tone || 'Not set'}" / "${storyBible.concept?.genre || 'Not set'}"
- Theme: "${storyBible.phase1Intake?.theme || 'Not set'}"
- Characters: ${storyBible.characterProfiles?.map(c => `${c.name} (${c.role}, Age: ${c.age}, Voice: ${c.vocalProfile})`).join("; ") || "None"}
- Locations: ${storyBible.locations?.map(l => `${l.name} (${l.acoustics})`).join("; ") || "None"}
- Scene Matrix Entries: ${storyBible.sceneIdeaMatrix?.length || 0} scenes created.
- Active Phase Locks: Phase1=${storyBible.phaseLocks?.phase1}, Phase2=${storyBible.phaseLocks?.phase2}, Phase3=${storyBible.phaseLocks?.phase3}, Phase4=${storyBible.phaseLocks?.phase4}
`;

  // History snippet
  const recentHistory = discussionHistory.slice(-8).map(h => `${h.sender.toUpperCase()}: ${h.text}`).join("\n");

  const phaseNames: Record<DiscussionPhase, string> = {
    1: "Phase 1: Concept, Intake & Story Premise",
    2: "Phase 2: Personas, Character Psychology & Voice Bibles",
    3: "Phase 3: Scene Idea Matrix, Twists & Dramatic Wants",
    4: "Phase 4: CPSD Blueprint & Raw Script Drafts",
    5: "Phase 5: Cinematic Script Engine & Dialogue Polish"
  };

  return `
You are J.A.R.V.I.S. Story Architect operating in **INTELLIGENT DISCUSSION MODE WITH STORY BIBLE LOCKING SYSTEM**.
You think deeply from the user's artistic perspective before formulating thoughts.

CURRENT DISCUSSION FOCUS: ${phaseNames[currentPhase]} (Phase ${currentPhase})

======================================================================
1. STORY BIBLE LOCKING SYSTEM STATE
======================================================================
LOCKED PARAMETERS (MANDATORY CONSTRAINTS - DO NOT CONTRADICT OR REVERT THESE):
${lockedSummary}

UNLOCKED / FLUID PARAMETERS (OPEN FOR DISCUSSION & LOCK PROPOSALS):
${unlockedSummary}

CURRENT STORY BIBLE SNAPSHOT:
${bibleSummary}

======================================================================
2. INTERACTIVE LOCK NEGOTIATION PROTOCOL
======================================================================
Your job is to guide the user in locking down clear story parameters for Phase ${currentPhase}.
Rules:
1. **Suggest & Note Down**: Proactively propose 1-3 specific parameter candidate locks (e.g., Logline, Tone, Character Motivation, Voice Register, Scene Twist, Theme) based on the discussion.
2. **If User Disagrees / Says "No"**:
   - Ask "Why does this option not fit your vision?"
   - Offer 3 distinct creative alternatives/branches (e.g. Option A: Darker psychological angle, Option B: High-stakes thriller twist, Option C: Intimate character-driven drama).
   - Continue discussing and refining options until the user says "YES" and locks it!
3. **If User Agrees / Says "Yes"**:
   - Confirm and record the lock into "proposedLocks" with status="accepted" and isLocked=true.

======================================================================
3. CINEMATIC & SUBTEXTUAL SKILLS GUIDANCE
======================================================================
${oscarSkill ? "OSCAR SKILL SNIPPET: Focus on subtext, sensory grounds, voice registers (Shield, Whiplash, Leak, Stone), and emotional stakes." : ""}
${scriptingSkill ? "SCRIPTING SKILL SNIPPET: Maintain tight dramatic beats, unsaid tension beneath dialogue, and character motivations." : ""}

======================================================================
4. RECENT DISCUSSION CONVERSATION
======================================================================
${recentHistory || "Beginning of discussion."}

USER'S LATEST MESSAGE:
"${userMessage}"

======================================================================
5. REQUIRED JSON RESPONSE FORMAT
======================================================================
Respond strictly in VALID JSON with this exact structure:

{
  "thinkingTrace": {
    "userPerspectiveAnalysis": "Detailed analysis of the user's artistic perspective, desires, or hesitation.",
    "subtextAndUnstatedNeeds": "Underlying dramatic subtext and emotional stakes.",
    "storyBibleLocksCheck": "Verification against locked parameters vs fluid parameters.",
    "dramaticAndNarrativeReasoning": "Narrative strategy, pacing, and character arc logic."
  },
  "discussionResponse": "Your rich, engaging, subtextually intelligent markdown conversation back to the user. Present your thoughts, ask probing questions, and clearly outline any proposed parameter locks or alternative options.",
  "proposedLocks": [
    {
      "key": "concept.tone",
      "label": "Story Tone & Atmosphere",
      "value": "Gothic Psychological Mystery with Melancholic Subtext",
      "isLocked": false,
      "category": "phase1_concept",
      "reason": "Based on user discussion regarding atmosphere",
      "alternatives": [
        "High-Contrast Neo-Noir Thriller",
        "Raw Realistic Drama with Psychological Tension",
        "Ethereal Supernatural Mystery"
      ],
      "status": "pending"
    }
  ],
  "suggestedBibleUpdates": {
    "concept": {
      "tone": "Gothic Psychological Mystery with Melancholic Subtext"
    }
  }
}

Return ONLY valid JSON.
`;
}

/**
 * Runs the Subtextual Discussion with Gemini 3.6 Flash.
 */
export async function runSubtextDiscussion(payload: DiscussionChatRequest): Promise<DiscussionChatResponse> {
  const { userMessage, currentPhase, discussionHistory, storyBible, locksMap } = payload;
  const prompt = buildDiscussionPrompt(userMessage, currentPhase, discussionHistory, storyBible, locksMap);

  const apiKey = getGeminiApiKey();
  let rawResponseText = "";

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });
      rawResponseText = response.text || "";
    } catch (e: any) {
      console.warn("[DiscussionService] Direct gemini-3.6-flash failed, falling back to fallback engine:", e?.message);
      rawResponseText = await generateContentWithFallback(prompt, "jarvis", "gemini-3.1-flash-lite", 0.7);
    }
  } else {
    rawResponseText = await generateContentWithFallback(prompt, "jarvis", "gemini-3.1-flash-lite", 0.7);
  }

  // Parse JSON response
  let parsed: any = null;
  try {
    const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(rawResponseText);
    }
  } catch (err) {
    console.warn("[DiscussionService] JSON parse failed, creating structured fallback response.");
    parsed = {
      thinkingTrace: {
        userPerspectiveAnalysis: `The user is exploring creative directions in Phase ${currentPhase}: "${userMessage.slice(0, 80)}..."`,
        subtextAndUnstatedNeeds: "Analyzing narrative mood, thematic stakes, and underlying subtext.",
        storyBibleLocksCheck: "Holding all locked parameters firm while providing creative room for unlocked elements.",
        dramaticAndNarrativeReasoning: "Evaluating character psychology, emotional pacing, and scene conflict."
      },
      discussionResponse: rawResponseText || "I've analyzed your creative direction. Let's refine the story beats together while respecting our locked Story Bible constraints.",
      proposedLocks: [
        {
          key: `phase${currentPhase}.focus_parameter`,
          label: `Phase ${currentPhase} Parameter Candidate`,
          value: userMessage.slice(0, 100),
          isLocked: false,
          category: `phase${currentPhase}_concept` as any,
          reason: "Suggested from discussion",
          alternatives: [
            "Alternative Option A: Heightened dramatic conflict",
            "Alternative Option B: Subdued psychological tension",
            "Alternative Option C: Character-focused emotional turn"
          ],
          status: "pending"
        }
      ],
      suggestedBibleUpdates: {}
    };
  }

  const thinkingTrace: DiscussionThinkingTrace = {
    userPerspectiveAnalysis: parsed?.thinkingTrace?.userPerspectiveAnalysis || "Analyzed user perspective and creative intent.",
    subtextAndUnstatedNeeds: parsed?.thinkingTrace?.subtextAndUnstatedNeeds || "Parsed underlying dramatic subtext and emotional stakes.",
    storyBibleLocksCheck: parsed?.thinkingTrace?.storyBibleLocksCheck || "Verified compliance with locked Story Bible parameters.",
    dramaticAndNarrativeReasoning: parsed?.thinkingTrace?.dramaticAndNarrativeReasoning || "Evaluated dramatic structure and character voice alignment."
  };

  const message: DiscussionMessage = {
    id: `disc_msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    sender: 'ai',
    text: parsed?.discussionResponse || "Let me propose key parameters for us to discuss and lock into our Story Bible.",
    timestamp: Date.now(),
    phase: currentPhase,
    thinkingTrace,
    proposedLocks: Array.isArray(parsed?.proposedLocks) ? parsed.proposedLocks : [],
    suggestedBibleUpdates: parsed?.suggestedBibleUpdates || {},
    isThinkingOpen: true
  };

  return { message };
}
