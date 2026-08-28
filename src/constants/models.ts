export interface ModelOption {
  id: string;
  name: string;
}

export const OFFICIAL_GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-3.1-flash-lite', name: 'gemini-3.1-flash-lite (Fast & Reliable)' },
  { id: 'gemini-3.6-flash', name: 'gemini-3.6-flash (Balanced)' },
  { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
  { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro (Reasoning)' },
  { id: 'gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview' },
  { id: 'gemini-flash-latest', name: 'gemini-flash-latest' },
  { id: 'gemma-4-26b-a4b-it', name: 'gemma-4-26b-a4b-it (Groq)' },
  { id: 'gemma-4-31b-it', name: 'gemma-4-31b-it (Groq)' }
];

