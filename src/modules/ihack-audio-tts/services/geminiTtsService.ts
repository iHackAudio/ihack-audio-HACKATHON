import { GoogleGenAI } from "@google/genai";
import { decodeAudioData, concatenateAudioBuffers } from './audioUtils';
import { getNeuralKey, markKeyExhausted } from './keyRegistry';

export function concatAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const valid = buffers.filter(b => b && b.length > 0);
  if (valid.length === 0) {
    const ctx = new OfflineAudioContext(1, 1, 48000);
    return ctx.createBuffer(1, 1, 48000);
  }
  if (valid.length === 1) return valid[0];

  const channels = valid[0].numberOfChannels;
  const sampleRate = valid[0].sampleRate;
  const totalSamples = valid.reduce((acc, b) => acc + b.length, 0);

  const ctx = new OfflineAudioContext(channels, totalSamples, sampleRate);
  const out = ctx.createBuffer(channels, totalSamples, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const outData = out.getChannelData(ch);
    let offset = 0;
    for (const b of valid) {
      const srcData = b.getChannelData(Math.min(ch, b.numberOfChannels - 1));
      outData.set(srcData, offset);
      offset += b.length;
    }
  }

  return out;
}

export function chunkTextForTTS(text: string, maxChars: number = 850): string[] {
  if (!text || text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if ((currentChunk + '\n\n' + paragraph).length <= maxChars) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (paragraph.length > maxChars) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraph];
        let sentenceChunk = '';
        for (const s of sentences) {
          if ((sentenceChunk + s).length <= maxChars) {
            sentenceChunk += s;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk);
            sentenceChunk = s;
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk;
        else currentChunk = '';
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [text];
}

export function extractTranscriptAndDirectives(rawText: string): { transcript: string; directives: string } {
  if (!rawText) return { transcript: '', directives: '' };
  
  const transcriptRegex = /(?:#{1,4}\s*TRANSCRIPT|-?\s*#{1,4}\s*TRANSCRIPT|TRANSCRIPT:|\[\s*SCRIPT START\s*\]|SCRIPT START:|\[\s*TRANSCRIPT\s*\])/i;
  const match = rawText.match(transcriptRegex);
  
  if (match && match.index !== undefined) {
    const directives = rawText.substring(0, match.index).trim();
    let transcript = rawText.substring(match.index + match[0].length).trim();
    transcript = transcript.replace(/^(?:\[\s*SCRIPT START\s*\]|SCRIPT START:|={3,})\s*/i, '').trim();
    return { transcript, directives };
  }
  
  return { transcript: rawText.trim(), directives: '' };
}

export const synthesizePromptRaw = async (
  promptText: string,
  speechConfig: any,
  modelId: string,
  systemInstruction?: string,
  onNodeAcquired?: (id: string) => void
): Promise<AudioBuffer> => {
  const maxAttempts = 6;
  let lastError: any = null;
  let activeNode = '1A';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { key, nodeId } = getNeuralKey('AUDIO');
    activeNode = nodeId;
    if (onNodeAcquired) onNodeAcquired(nodeId);

    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const configObj: any = {
        responseModalities: ["AUDIO"],
        speechConfig,
        maxOutputTokens: 8192
      };
      
      let finalPromptText = promptText;
      if (systemInstruction) {
        finalPromptText = `${systemInstruction}\n\n[SCRIPT START]\n${promptText}`;
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text: finalPromptText }] }],
        config: configObj
      });

      const bytesArray: Uint8Array[] = [];
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        const base64Audio = part.inlineData?.data;
        if (base64Audio) {
          const binaryString = window.atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          bytesArray.push(bytes);
        }
      }

      if (bytesArray.length === 0) {
        throw new Error("TTS synthesis returned empty audio data.");
      }

      const totalLength = bytesArray.reduce((acc, a) => acc + a.length, 0);
      const allBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of bytesArray) {
        allBytes.set(arr, offset);
        offset += arr.length;
      }

      const decoded = await decodeAudioData(allBytes.buffer, 24000);
      return decoded;

    } catch (error: any) {
      lastError = error;
      markKeyExhausted(key);
      console.warn(`[TTS Node ${activeNode} Failover] Model: ${modelId}, Error: ${error.message || String(error)}. Retrying next node...`);
    }
  }

  throw new Error(`Audio Engine Capacity Full or Failed on model ${modelId}: ${lastError?.message || String(lastError)}`);
};

export const synthesizeSpeech = async (
  text: string, 
  baseVoiceName: string, 
  singleSpeakerNote: string,
  scene: string,
  context: string,
  modelId: string,
  onNodeAcquired?: (id: string) => void
): Promise<AudioBuffer> => {

  if (!text || !text.trim()) {
      const ctx = new OfflineAudioContext(1, 1, 48000);
      return ctx.createBuffer(1, 1, 48000);
  }

  const { transcript, directives } = extractTranscriptAndDirectives(text);

  const metadataHeader = directives || `AUDIO PROFILE & VOICE: ${baseVoiceName}
THE SCENE: ${scene || 'High-Fidelity Audio Studio'}
DIRECTOR'S NOTES: ${singleSpeakerNote}
SAMPLE CONTEXT: ${context}`;

  const systemInstruction = `You are a world-class voice actor and neural text-to-speech engine.

MISSION:
Perform and synthesize ONLY the exact script text provided in the user prompt.

PERFORMANCE DIRECTIVES & AUDIO PROFILE:
${metadataHeader}

STRICT ANTI-HALLUCINATION RULES:
1. Speak ONLY the exact script text provided in the user prompt.
2. DO NOT read aloud metadata headers, section titles ("AUDIO PROFILE", "DIRECTOR NOTES", "TRANSCRIPT"), or bracketed acting tags (e.g. [laughs], [sighs], [excited]). Perform the vocal emotion instead of pronouncing tag words.
3. DO NOT add conversational intros, outros, or extra ad-libbed words.
4. Execute the voice profile, emotional tone, pace, accent, and director notes with clinical precision.`;

  const speechConfig = {
    voiceConfig: { 
      prebuiltVoiceConfig: { voiceName: baseVoiceName } 
    } 
  };

  return await synthesizePromptRaw(transcript, speechConfig, modelId, systemInstruction, onNodeAcquired);
};

export const synthesizeMultiSpeaker = async (
  script: string,
  echoVoiceName: string,
  noiseVoiceName: string,
  speaker1Note: string,
  speaker2Note: string,
  scene: string,
  context: string,
  modelId: string,
  onNodeAcquired?: (id: string) => void
): Promise<AudioBuffer> => {

  if (!script || !script.trim()) {
      const ctx = new OfflineAudioContext(1, 1, 48000);
      return ctx.createBuffer(1, 1, 48000);
  }

  const { transcript, directives } = extractTranscriptAndDirectives(script);

  let metadataHeader = directives;
  if (!metadataHeader) {
    metadataHeader = `AUDIO PROFILE: Echo
Voice: ${echoVoiceName}
DIRECTOR'S NOTES: ${speaker1Note}

AUDIO PROFILE: Noise
Voice: ${noiseVoiceName}
DIRECTOR'S NOTES: ${speaker2Note}

THE SCENE: ${scene || 'High-Fidelity Audio Studio'}
SAMPLE CONTEXT: ${context}`;
  } else {
    metadataHeader = metadataHeader.replace(/Voice:\s*[a-zA-Z]+/g, (m, offset) => {
      const noiseIdx = metadataHeader.indexOf('Noise');
      if (noiseIdx !== -1 && offset > noiseIdx) {
        return `Voice: ${noiseVoiceName}`;
      }
      return `Voice: ${echoVoiceName}`;
    });
  }

  const systemInstruction = `You are an expert multi-speaker audio drama voice actor and neural text-to-speech engine.

MISSION:
Perform and synthesize ONLY the multi-speaker dialogue provided in the user prompt verbatim for Echo and Noise.

PERFORMANCE DIRECTIVES & SPEAKER PROFILES:
${metadataHeader}

STRICT ANTI-HALLUCINATION RULES:
1. Speak ONLY the dialogue provided in the user prompt. Do NOT read aloud section headers, profile names, or bracketed emotion tags (e.g. [excited], [deadpan], [interrupting]). Express the vocal emotion instead of speaking the bracketed words.
2. DO NOT add conversational intros, outros, commentary, or unscripted dialogue.
3. Switch seamlessly between speaker voices according to speaker assignments, executing their respective accents, tones, and director notes.`;

  const speechConfig = {
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        { speaker: 'Echo', voiceConfig: { prebuiltVoiceConfig: { voiceName: echoVoiceName } } },
        { speaker: 'Noise', voiceConfig: { prebuiltVoiceConfig: { voiceName: noiseVoiceName } } }
      ]
    }
  };

  return await synthesizePromptRaw(transcript, speechConfig, modelId, systemInstruction, onNodeAcquired);
};
