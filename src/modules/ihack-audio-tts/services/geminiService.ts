

import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { AudioAnalysis, ProductionAnalysisResult, ViralStrategy } from '../../../../types';
import { blobToBase64, decodeAudioData, concatenateAudioBuffers } from './audioUtils';
import { MODELS } from '../../../../constants';
import { getNeuralKey, markKeyExhausted } from './keyRegistry';
import { logApiRequest } from './apiLoggerService';

/**
 * Smart wrapper to handle API calls with automatic failover for "Free Tier" keys.
 */
async function callNeuralNode<T>(task: 'AUDIO' | 'SCRIPT' | 'FORENSIC', operation: (ai: GoogleGenAI) => Promise<T>): Promise<{ result: T; nodeId: string }> {
  let { key, nodeId } = getNeuralKey(task);
  let ai = new GoogleGenAI({ apiKey: key });

  try {
    const result = await operation(ai);
    return { result, nodeId };
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('quota')) {
      markKeyExhausted(key);
      const failover = getNeuralKey(task);
      const backupAi = new GoogleGenAI({ apiKey: failover.key });
      const result = await operation(backupAi);
      return { result, nodeId: failover.nodeId };
    }
    throw error;
  }
}

export const analyzeAudioProduction = async (
  file: File,
  context: string,
  perspective: string,
  productionType: 'RAW' | 'FINAL',
  synthesisDurationSec?: number,
  modelId: string = MODELS.TEXT_FLASH
): Promise<ProductionAnalysisResult & { activeNode: string }> => {
  const base64Data = await blobToBase64(file);
  const prompt = `
    Act as a Senior Production Analyst for Audible Originals.
    Perform a forensic audit on this audio production.
    Context: ${context}
    Perspective: ${perspective}
    Type: ${productionType}
  `;

  try {
    const { result, nodeId } = await callNeuralNode<GenerateContentResponse>('FORENSIC', (ai) => 
      ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: prompt }
          ],
        },
        config: {
          temperature: 0.9,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ratings: {
                type: Type.OBJECT,
                properties: {
                  Scripting: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, confidence_band_percent: { type: Type.STRING } } },
                  Technical: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, confidence_band_percent: { type: Type.STRING } } },
                  Vocal: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, confidence_band_percent: { type: Type.STRING } } },
                  Marketability: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, confidence_band_percent: { type: Type.STRING } } }
                }
              },
              realityCheck: { type: Type.STRING },
              conversionChance: { type: Type.STRING },
              nichePosition: { type: Type.STRING },
              productionQuality: { type: Type.STRING },
              voicePerformance: { type: Type.STRING },
              soundDesign: { type: Type.STRING },
              listenerEngagement: { type: Type.STRING },
              globalBenchmarking: { type: Type.STRING },
              recommendations: { type: Type.STRING },
              predictiveReport: { type: Type.STRING },
              estimatedMarketValue: { type: Type.STRING }
            }
          }
        }
      })
    );
    
    const text = result.text;
    if (!text) throw new Error("Analysis failed: Empty response.");
    
    logApiRequest(
      `Forensic AI Production Audit (${file.name || 'render.wav'})`,
      modelId,
      'TEXT',
      {
        charsIn: prompt.length + Math.round(file.size / 2.5),
        charsOut: text.length,
        nodeId,
        status: 'SUCCESS'
      }
    );

    return { ...JSON.parse(text), activeNode: nodeId };
  } catch (error: any) {
    logApiRequest(
      `Forensic AI Production Audit (${file.name || 'render.wav'})`,
      modelId,
      'TEXT',
      {
        charsIn: prompt.length + Math.round(file.size / 2.5),
        charsOut: 0,
        nodeId: 'FAILOVER',
        status: 'FAILED',
        error: error.message || String(error)
      }
    );
    throw error;
  }
};

// --- CORE SYNTHESIS WRAPPERS (INTERNAL) ---

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

function extractTranscriptAndDirectives(rawText: string): { transcript: string; directives: string } {
  if (!rawText) return { transcript: '', directives: '' };
  
  const transcriptRegex = /(?:#{1,4}\s*TRANSCRIPT|-?\s*#{1,4}\s*TRANSCRIPT|TRANSCRIPT:|\[\s*SCRIPT START\s*\]|SCRIPT START:|\[\s*TRANSCRIPT\s*\])/i;
  const match = rawText.match(transcriptRegex);
  
  if (match && match.index !== undefined) {
    const directives = rawText.substring(0, match.index).trim();
    let transcript = rawText.substring(match.index + match[0].length).trim();
    // Clean up any repeated delimiter headers like another [SCRIPT START]
    transcript = transcript.replace(/^(?:\[\s*SCRIPT START\s*\]|SCRIPT START:|={3,})\s*/i, '').trim();
    return { transcript, directives };
  }
  
  return { transcript: rawText.trim(), directives: '' };
}

const synthesizePromptRaw = async (
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

      logApiRequest(
        `Audio Synthesis Chunk (${promptText.substring(0, 45).replace(/[\r\n]+/g, ' ')}...)`,
        modelId,
        'AUDIO',
        {
          charsIn: promptText.length,
          audioDurationSec: Math.round(decoded.duration),
          nodeId: activeNode,
          status: 'SUCCESS'
        }
      );

      return decoded;

    } catch (error: any) {
      lastError = error;
      markKeyExhausted(key);
      console.warn(`[TTS Node ${activeNode} Failover] Model: ${modelId}, Error: ${error.message || String(error)}. Retrying next node...`);
    }
  }

  logApiRequest(
    `Audio Synthesis Chunk (${promptText.substring(0, 40).replace(/[\r\n]+/g, ' ')}...)`,
    modelId,
    'AUDIO',
    {
      charsIn: promptText.length,
      audioDurationSec: 0,
      nodeId: activeNode,
      status: 'FAILED',
      error: lastError?.message || String(lastError)
    }
  );

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
      const ctx = new OfflineAudioContext(1, 1, 48000); // Return empty if text is just spaces
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
3. DO NOT add conversational intros (e.g. "Sure, here is your audio"), outros, or extra ad-libbed words.
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
      const ctx = new OfflineAudioContext(1, 1, 48000); // Return empty if text is just spaces
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
    // Sync voice names in directives
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

export const optimizeScriptWithKineticTags = async (script: string, modelId: string = MODELS.TEXT_FLASH): Promise<{ text: string; nodeId: string }> => {
  const prompt = `Enhance the following script with kinetic tags like ((pause)), ((laughs)) for human realism. Do not change spoken words: ${script}`;
  try {
    const { result, nodeId } = await callNeuralNode<GenerateContentResponse>('SCRIPT', (ai) => 
      ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text: prompt }] }]
      })
    );
    const text = result.text || script;
    logApiRequest('Script Kinetic Realism Optimization', modelId, 'TEXT', {
      charsIn: prompt.length,
      charsOut: text.length,
      nodeId,
      status: 'SUCCESS'
    });
    return { text, nodeId };
  } catch (error: any) {
    logApiRequest('Script Kinetic Realism Optimization', modelId, 'TEXT', {
      charsIn: prompt.length,
      charsOut: 0,
      nodeId: 'FAILOVER',
      status: 'FAILED',
      error: error.message || String(error)
    });
    throw error;
  }
};

export const editCoverImage = async (imageFile: File, titleText: string): Promise<{ url: string; nodeId: string }> => {
  const base64Image = await blobToBase64(imageFile);
  const promptText = `Act as a professional graphic designer. Overlay the episode title "${titleText}" onto this podcast cover. Return the image with the text overlay.`;
  const mId = 'gemini-2.5-flash-image';
  try {
    const { result, nodeId } = await callNeuralNode<GenerateContentResponse>('FORENSIC', (ai) => 
      ai.models.generateContent({
        model: mId,
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: imageFile.type } },
            { text: promptText }
          ]
        }
      })
    );

    const parts = result.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const outUrl = `data:image/png;base64,${part.inlineData.data}`;
        logApiRequest('Graphic Composition Overlay (Cover Asset)', mId, 'IMAGE', {
          charsIn: Math.round(imageFile.size / 3) + promptText.length,
          charsOut: Math.round(outUrl.length / 1.3),
          nodeId,
          status: 'SUCCESS'
        });
        return { url: outUrl, nodeId };
      }
    }
    throw new Error("Neural composition failed to return an image.");
  } catch (error: any) {
    logApiRequest('Graphic Composition Overlay (Cover Asset)', mId, 'IMAGE', {
      charsIn: Math.round(imageFile.size / 3) + promptText.length,
      charsOut: 0,
      nodeId: 'FAILOVER',
      status: 'FAILED',
      error: error.message || String(error)
    });
    throw error;
  }
};

export const generateViralStrategy = async (
  script: string,
  userContext: string,
  auditScore: number | string,
  realityCheck: string
): Promise<ViralStrategy> => {
  const prompt = `Generate a viral LinkedIn post and Apple Podcast show notes for: "${userContext}". Content quality is rated: ${auditScore}. Reality texture: ${realityCheck}.`;
  const mId = MODELS.TEXT_FLASH;
  try {
    const { result, nodeId } = await callNeuralNode<GenerateContentResponse>('SCRIPT', (ai) => 
      ai.models.generateContent({
        model: mId,
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
      })
    );

    const text = result.text;
    if (!text) throw new Error("Viral strategy failed.");
    logApiRequest('Viral Launch Kit Engineering', mId, 'TEXT', {
      charsIn: prompt.length + script.length,
      charsOut: text.length,
      nodeId,
      status: 'SUCCESS'
    });
    return JSON.parse(text);
  } catch (error: any) {
    logApiRequest('Viral Launch Kit Engineering', mId, 'TEXT', {
      charsIn: prompt.length + script.length,
      charsOut: 0,
      nodeId: 'FAILOVER',
      status: 'FAILED',
      error: error.message || String(error)
    });
    throw error;
  }
};

export const downloadViralKit = (strategy: ViralStrategy, filename: string) => {
  const content = `TITLE: ${strategy.appleTitle}\n\nSUMMARY:\n${strategy.appleSummary}\n\nPOST:\n${strategy.linkedInPost}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-Launch-Kit.txt`;
  link.click();
};

export const analyzeMediaForPersona = async (file: File): Promise<AudioAnalysis> => { return { speakers: [] }; };

export const analyzeCharacterConcept = async (concept: string, modelId: string = MODELS.TEXT_FLASH) => {
  const prompt = `Act as an elite character architect. Analyze this concept and provide a deep vocal persona breakdown:\n${concept}`;
  const { result } = await callNeuralNode<GenerateContentResponse>('SCRIPT', (ai) =>
    ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] }
    })
  );
  return result.text || "";
};

export const sendRefinementMessage = async (messages: any[], modelId: string = MODELS.TEXT_FLASH) => {
  const prompt = `Refine this character persona based on the conversation history:\n${JSON.stringify(messages)}`;
  const { result } = await callNeuralNode<GenerateContentResponse>('SCRIPT', (ai) =>
    ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] }
    })
  );
  return result.text || "";
};

export const generateFinalPersona = async (messages: any[], modelId: string = MODELS.TEXT_FLASH): Promise<any> => {
  const prompt = `Generate final structured persona JSON with fields: name, description, systemInstruction from this refinement:\n${JSON.stringify(messages)}`;
  const { result } = await callNeuralNode<GenerateContentResponse>('SCRIPT', (ai) =>
    ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' }
    })
  );
  try {
    return JSON.parse(result.text || "{}");
  } catch {
    return {
      name: "Neural Persona",
      description: "AI-crafted neural voice persona",
      systemInstruction: result.text || "Speak with nuanced, lifelike inflection."
    };
  }
};