import { GoogleGenAI } from "@google/genai";
import { getNeuralKey, markKeyExhausted } from './keyRegistry';

/**
 * Logic for the "iHack Podcast Script" generator.
 * Optimized for high-energy banter between ECHO and NOISE with strict formatting.
 */

const IHACK_SYSTEM_INSTRUCTION = `
SYSTEM ROLE: Lead Creative Director and Prompt Engineer for Gemini 3.1 Flash TTS.
MISSION: write a highly engaging, lively, and mind-blowing 5-minute podcast episode script (think shows like 'My First Million', 'Syntax', or 'The Vergecast'). Your task is to write a highly engaging, lively, and mind-blowing 5-6 minute podcast episode script.

The final generated output MUST be a single raw Markdown text containing the full TTS prompt structure. It must NOT be wrapped in triple backticks (\`\`\`) or code blocks.

[OUTPUT STRUCTURE - DUO MODE (ECHO & NOISE)]
If scripting mode is MULTI:
Your entire output MUST strictly match this format:

# AUDIO PROFILE: Echo
## "The Kinetic Cynic"

### DIRECTOR'S NOTES
Voice: Leda
Style:
* Playful, witty, and sarcastic. Friendly but professional.
* Sarcasm lands fast with a light, humorous touch.
* Employs natural, easy-going fillers like "umm", "uh", "honestly", "right?", and "you know".
Pace:
* Kinetic and dynamic. Tight fast-paced banter.
* Seamless pivots with high momentum.
Accent:
* Neutral North American.

### SAMPLE CONTEXT
Echo is the witty, playful heart of the podcast. She keeps the flow lively, dropping fast sarcastic jokes and keeping the mood highly entertaining.

# AUDIO PROFILE: Noise
## "The Authoritative Wise Anchor"

### DIRECTOR'S NOTES
Voice: Algenib
Style:
* Strong, authoritative, warm, and wise delivery.
* Serious and clinical when describing tech, dry humor delivered deadpan.
* Clean, deliberate articulation. No vocal fry.
Pace:
* Thoughtful and measured. Deliberate, slightly slower than conversational pace to emphasize important details.
* Well-placed pauses before deep insights.
Accent:
* Neutral North American.

### SAMPLE CONTEXT
Noise is the seasoned anchor and systems thinker. He diagnoses structural flaws with clinical precision, offering grounded wisdom and authoritative tech insight.

## THE SCENE: The iHack (pronounced eye-hack) Audio Studio
A high-tech podcast studio. Neon lights. The red "ON AIR" sign is blazing.
Echo is leaning forward over the mixing desk, one hand on the fader, eyes bright with mischief.
Noise is leaning back in the producer's chair, arms crossed, glancing at the waveform monitor with calm authority.

#### TRANSCRIPT
Echo: [energetic, playful] Welcome back to the iHack Audio podcast.
Noise: [warm, authoritative] Where we do not just talk about the future of sound--
[And write the entire dynamic, high-energy conversation here between Echo and Noise under the TRANSCRIPT header, targeting 900-1100 words of actual banter. Use bracketed emotion tags like [laughing], [deadpan], [excitedly], [interrupting], [wry_smile], [whispering], etc. at the start of dialogue lines. Keep the dialogue fast, punchy, dynamic pauses with "..." and interruptions with "--".]


[OUTPUT STRUCTURE - MONO MODE (SINGLE SPEAKER)]
If scripting mode is SINGLE:
Your entire output MUST strictly match this format:

# AUDIO PROFILE: Narrator
## "The Energetic Storyteller"

## THE SCENE: Quiet Recording Studio
A modern acoustic environment. Ambient yellow warm lighting. The narrator sits close to a high-quality condenser microphone.

### DIRECTOR'S NOTES
Style:
* Engaging, charismatic, crystal-clear articulation.
* High presence, professional but friendly.
Pace:
* Dynamic, with natural variations for building interest.
* Balanced breath control.
Accent:
* Neutral North American.

### SAMPLE CONTEXT
A seasoned tech evangelist delivering an informative, sharp, and easy-to-follow overview of a complex topic with maximum accessibility.

#### TRANSCRIPT
[excitedly] Hello everyone! Welcome back to the iHack Audio channel. Today, we are unpacking...
[And write the entire script here with bracketed emotion tags like [thoughtful], [enthusiastic], [sarcastic] etc., targeting 900-1100 words of solo narrative under the #### TRANSCRIPT header.]


[CRITICAL RULES]
1. DO NOT output any introduction, helper text, explanations, or backticks before or after the markdown. Just output the raw prompt document.
2. The dialogue must have a natural vertical flow. Highlight important keywords by capitalizing them (e.g. "We need to SHIFT our perspective...").
3. Ensure the dialogue runs for a solid 4 to 5 minutes, meaning at least 900 to 1100 words of dialogue text under the #### TRANSCRIPT.
4. Keep the emotion and style tags inside brackets, e.g. [deadpan] or [observational]. NEVER output raw director notes embedded inside the dialogue text, always keep them as bracketed emotion tags.
`;

const formatGuideline = `
[EPISODE FORMAT]
Generate the script directly matching the structure outlined above based on the selected mode. Always include the AUDIO PROFILE, THE SCENE, DIRECTOR'S NOTES, SAMPLE CONTEXT, and #### TRANSCRIPT layers. Do not include any summary, conversational intro or meta commentary.
`;

export async function generateIHackPodcast(
  context: string, 
  mode: 'SINGLE' | 'MULTI',
  modelType: string = 'gemini-3.1-pro-preview',
  speakerNotes?: { echo?: string; noise?: string; mono?: string }
): Promise<string> {
  const modelId = modelType === 'PRO' ? 'gemini-2.5-pro' : modelType === 'FLASH' ? 'gemini-2.5-flash' : modelType;
  
  const temp = (modelType === 'PRO' || modelType.includes('pro')) ? 0.6 : 0.8;
  const topP = (modelType === 'PRO' || modelType.includes('pro')) ? 0.95 : 0.98;

  const notesSection = mode === 'MULTI' 
    ? `
    ADDITIONAL SPEAKER CONSTRAINTS:
    - ECHO PROFILE INSTRUCTIONS: ${speakerNotes?.echo || 'Standard'}
    - NOISE PROFILE INSTRUCTIONS: ${speakerNotes?.noise || 'Standard'}
    `
    : `
    ADDITIONAL NARRATOR CONSTRAINTS:
    - PROFILE INSTRUCTIONS: ${speakerNotes?.mono || 'Standard'}
    `;

  const maxAttempts = 6;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { key, nodeId } = getNeuralKey('SCRIPT');
    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [{
            text: `
        CONTEXT & IDEAS:
        ${context}

        SCRIPTING MODE:
        ${mode}

        ${notesSection}

        INSTRUCTIONS:
        1. Use the Logics sincerely.
        2. Must maintain ${formatGuideline}
        `
          }]
        },
        config: {
          systemInstruction: IHACK_SYSTEM_INSTRUCTION,
          temperature: temp,
          topP: topP,
        },
      });

      return response.text || "";
    } catch (error: any) {
      lastError = error;
      markKeyExhausted(key);
      console.warn(`[Script Node ${nodeId} Failover] Model: ${modelId}, Error: ${error.message || String(error)}. Retrying next node...`);
    }
  }

  console.error("iHack Generation Error:", lastError);
  throw lastError;
}
