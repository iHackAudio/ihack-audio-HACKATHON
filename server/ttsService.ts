import { Communicate } from "edge-tts-universal";
import fs from "fs";
import path from "path";
import { Type } from "@google/genai";

export const speechSynthesizerTool = {
  name: "synthesizeSpeech",
  description: "Converts a textual response or narration script into a physical MP3 audio file using Microsoft Edge Neural Voices (e.g., 'en-US-AvaNeural', 'en-US-AndrewNeural', 'en-GB-SoniaNeural', 'ja-JP-NanamiNeural').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      script: {
        type: Type.STRING,
        description: "The clean textual content or dialogue sentence to convert to audio."
      },
      voice: {
        type: Type.STRING,
        description: "The preferred Edge Neural voice configuration identifier (e.g., 'en-US-AvaNeural', 'en-US-AndrewNeural', 'en-GB-SoniaNeural')."
      },
      outputFileName: {
        type: Type.STRING,
        description: "The slug name for the output audio file (e.g., 'response_turn_1.mp3')."
      }
    },
    required: ["script", "voice", "outputFileName"]
  }
};

export interface SynthesizeOptions {
  script: string;
  voice?: string;
  outputFileName?: string;
}

export async function executeEdgeTts(options: SynthesizeOptions): Promise<{
  status: "success" | "failed";
  message?: string;
  audioUrl?: string;
  savedTo?: string;
  fileSize?: number;
  error?: string;
}> {
  try {
    const voice = options.voice || "en-US-AvaNeural";
    const script = options.script;
    let outputFileName = options.outputFileName || `speech_${Date.now()}.mp3`;
    if (!outputFileName.endsWith(".mp3")) {
      outputFileName += ".mp3";
    }

    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const finalPath = path.join(outputDir, outputFileName);
    const communicate = new Communicate(script, { voice });
    const audioChunks: Buffer[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        audioChunks.push(chunk.data as Buffer);
      }
    }

    const audioBuffer = Buffer.concat(audioChunks);
    fs.writeFileSync(finalPath, audioBuffer);

    const audioUrl = `/api/audio/${encodeURIComponent(outputFileName)}`;

    return {
      status: "success",
      message: `Audio successfully generated via Microsoft Edge Neural Synthesis (${voice}).`,
      audioUrl,
      savedTo: finalPath,
      fileSize: audioBuffer.length
    };
  } catch (err: any) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
