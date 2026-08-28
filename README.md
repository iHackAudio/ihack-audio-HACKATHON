## 🚀 Reproducible Setup & Testing

### Prerequisites
- Node.js v18+
- Python 3.10+
- Google Cloud account (free tier sufficient)
- Gemini API key (free tier)

### Environment Variables
Create a `.env` file in each stage's root directory:

```env
GEMINI_KEY_JARVIS=your_key_here
GEMINI_KEY_A=your_key_here
GEMINI_KEY_B=your_key_here
GEMINI_KEY_C=your_key_here
GOOGLE_CLOUD_PROJECT=your_project_id
```

### Stage 1 — StoryFlix
```bash
cd storyflix
npm install
npm run dev
# Open http://localhost:3000
# Enter any concept sentence → click Generate
```

### Stage 2 — JARVIS-AURA OS
```bash
cd jarvis-aura
npm install
npm run start
# Open http://localhost:3001
# Upload PDF or enter concept → select protocol1 → Run
```

### Stage 3 — JOJO Neural Studio
```bash
cd jojo-neural-studio
npm install
npm run dev
# Open http://localhost:3002
# Paste script → select voice profile → Synthesize
```

### Stage 4 — iHack Audio Analyzer
```bash
cd ihack-audio-analyzer
npm install
npm run dev
# Open http://localhost:3003
# Upload audio file → Run Full Analysis → Export Dossier
```

### Podcast Automation
```bash
cd podcast-automation
npm install
npm run dev
# Open http://localhost:3004
# Enter concept → select host voices (Echo/Noise) → Generate Episode
```

### Verify Google Cloud Deployment
All stages deployed on Google Cloud Run.
Live deployment URLs and Cloud Run dashboard screenshots
included in the demo video.

### Expected Output
- StoryFlix: JSON story bible + locked script
- JARVIS-AURA: Production-ready TTS script with phonetic guides
- JOJO: Downloadable WAV audio file
- Analyzer: PDF forensic dossier with compliance scores
- Podcast: Dual-speaker MP3 episode
