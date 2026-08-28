
export const MODELS = {
  // Text Generation Models
  TEXT_FLASH: "gemini-3.1-flash-lite",
  TEXT_PRO: "gemini-3.1-pro-preview",

  // Audio Synthesis Models
  TTS_LITE: "gemini-3.1-flash-tts-preview",
  TTS_FLASH: "gemini-2.5-flash-preview-tts",
  TTS_PRO: "gemini-2.5-pro-preview-tts", 
};

export const JOJO_MODELS = [
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-latest",
  "gemini-pro-latest",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash-lite",
  "gemini-2.5-pro-preview-tts",
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it"
];

export const AVAILABLE_MODELS = JOJO_MODELS;

export const SAMPLE_TEXTS = [
  "Echo: ((excited)) Have you seen the new neural data? \nNoise: ((calm)) I have. It is quite... extraordinary.",
  "The silence in the room wasn't empty; it was heavy, pressed against the walls like a held breath.",
  "System initialization complete. Welcome to the neural interface."
];


 export const AVAILABLE_VOICES = [
  // Standard Live Voices
  'Achernar', 'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Aoede', 'Autonoe', 
  'Callirrhoe', 'Charon', 'Despina', 'Enceladus', 'Erinome', 'Fenrir', 
  'Gacrux', 'Iapetus', 'Kore', 'Laomedeia', 'Leda', 'Orus', 'Puck', 
  'Pulcherrima', 'Rasalgethi', 'Sadachbia', 'Sadaltager', 'Schedar', 
  'Sulafat', 'Umbriel', 'Vindemiatrix', 'Zephyr', 'Zubenelgenubi'
].sort();
