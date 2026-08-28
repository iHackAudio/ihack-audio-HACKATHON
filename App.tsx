import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { 
  Play, Pause, X, Maximize2, Wand2, Mic, Settings, VolumeX, ShieldCheck, Cpu, Database, 
  Terminal, Activity, Hexagon, ArrowRight, Save, Trash2, RotateCcw, Box, Plus,
  Radio, Zap, Layers, Upload, Download, Copy, Share2, Sparkles, Check, FileText, ListVideo, 
  History, AudioLines, FileAudio, Video, Loader2, BarChart3, AlertCircle, Fingerprint, Coins, ShieldAlert, FileCode2, ArrowLeft, Headphones, RadioReceiver, Globe2, Waves, Network,
  PanelLeftClose, PanelLeftOpen, Film, BookOpen
} from 'lucide-react';
import { Button } from './components/Button';
import { Header } from './components/Header';
import { InteractiveHeader } from './components/InteractiveHeader';
import { InteractiveSpaceBackground } from './components/InteractiveSpaceBackground';
import { RealtimeMasteringPanel } from './components/RealtimeMasteringPanel';
import { ResizableTextarea } from './components/ResizableTextarea';
import { VoiceAssistantWidget } from './components/VoiceAssistantWidget';
import { CollaborativeWorkspace } from './components/CollaborativeWorkspace';
import StoryStudioApp from './components/StoryStudioApp';
import { StoryFlixApp } from './src/modules/storyflix';
import JarvisAuraApp from './components/JarvisAuraApp';
import ForensicDossierApp from './components/ForensicDossierApp';
import { getApiLogs, clearApiLogs, downloadLogsAsJson, getLedgerStats, logApiRequest } from './services/apiLoggerService';
import {
  saveAudioToBackup,
  saveMetadataToBackup,
  getBackupByKey,
  wipeBackupSuite
} from './services/backupService';
import { ViewState, ProcessingStatus } from './types';
import { auphonicService } from './services/auphonicService';
import { generateIHackPodcast } from './services/iHackPodcastService';
import { synthesizeSpeech, synthesizeMultiSpeaker } from './services/geminiService';
import { audioBufferToWav } from './services/audioUtils';
import { Toast } from './components/Toast';
import { MedicalScriptPanel } from './components/MedicalScriptPanel';
import { JarvisConsole } from './components/JarvisConsole';
import { JojoSettingsPanel } from './components/JojoSettingsPanel';
import { AVAILABLE_VOICES, MODELS, JOJO_MODELS } from './constants';

const PRESET_TEMPLATES = [
  {
    "name": "Young Academic",
    "directorNotes": "You are world-class narrative voice actor. Read the full # TRANSCRIPT following the directors note and accent.\n\nAudio Profile: A 25-year-old woman with a Cultivated Australian accent. High-medium pitched, clear, and slightly rapid but controlled. Features a bright, intellectual baseline weighed down by anxiety and physical exhaustion.\n\nDirector's note:\nStyle: Initially defensive, sharp, and highly intellectualized, masking fear with medical jargon. Gradually transitions into a quiet, fragile vulnerability.\nPace: Quick and analytical; faltering, hesitant, and hushed when recounting the personal impact.\nAccent: Cultivated Australian (RP-leaning).\nNarrative Rules: PRONOUNCE medical terms with clinical, authoritative precision. Soften voice over time.\n\nScene: A quiet study or library environment.\n\nSample Context: Explanation of symptoms of joint hypermobility and autonomic dysfunction repeatedly dismissed as \"academic stress\".\n\n- ## TRANSCRIPT",
    "context": "A personal narrative about struggling with joint hypermobility and dysautonomia, and the experience of having physical symptoms dismissed as performance anxiety by medical professionals. Keep it under 2 minutes."
  },
  {
    "name": "High-Functioning Pro",
    "directorNotes": "You are world-class narrative voice actor. Read the full # TRANSCRIPT following the directors note and accent.\n\nAudio Profile: A 37-year-old woman with a Cultivated Australian accent. Lower-middle pitched, crisp, and commanding. Corporate articulateness layered over deep-seated, weary frustration.\n\nDirector's note:\nStyle: Pragmatic, analytical, and slightly cynical. Shifting from a detached, professional briefing style to quiet disbelief and raw, understated grief.\nPace: Steady and rapid-fire when presenting facts; slowing to heavy, weighted pauses.\nAccent: Cultivated Australian (RP-leaning).\nNarrative Rules: Emphasize medical terms with clinical precision. Soften voice when discussing personal humiliation.\n\nScene: An office or formal interview room.\n\nSample Context: Describing a ten-year struggle to get an accurate diagnosis for endometriosis, dismissed as \"low pain tolerance.\"\n\n- ## TRANSCRIPT",
    "context": "A compelling narrative about the 10-year painful journey to be correctly diagnosed with endometriosis, reflecting on the lost years and systemic medical gaslighting."
  },
  {
    "name": "Stoic Matriarch",
    "directorNotes": "You are world-class narrative voice actor. Read the full # TRANSCRIPT following the directors note and accent.\n\nAudio Profile: A 65-year-old woman with a Cultivated Australian accent. Warm, lower-register voice with a slight, natural rasp. Mature, dignified warmth undercut by a quiet, trembling fatigue.\n\nDirector's note:\nStyle: Polished, polite, and stoic at first. Gradually breaking down into a soft, trembling vulnerability and deep grief.\nPace: Measured, deliberately slow, and dignified; dropping into a breathy, fragile whisper.\nAccent: Cultivated Australian (RP-leaning).\nNarrative Rules: Authoritative delivery of medical terms. Allow the voice to become breathier and slow down progressively.\n\nScene: A quiet, sunlit living room.\n\nSample Context: Recounting atypical cardiac symptoms dismissed as \"menopausal anxiety\" leading to a near-fatal event.\n\n- ## TRANSCRIPT",
    "context": "An older woman's emotional recounting of surviving a severe cardiac event after her symptoms were repeatedly dismissed by specialists as mere menopausal anxiety. Focus on the emotional toll and the danger of ageist or sexist medical assumptions."
  },
  {
    "name": "Dr. Liang",
    "directorNotes": "You are world-class narrative voice actor. Read the full # TRANSCRIPT following the directors note and accent.\n\nAudio Profile:\nA professional and empathetic male voice with a clear Educated Australian accent. The delivery is deliberate, measured, and informative, making it highly suitable for medical or health-related audiobooks. The tone is serious but compassionate, directly addressing the listener with understanding.\n\nDirector's note:\nStyle: A refined calm and authoritative senior medical professional with a smooth Educated Australian accent.\nPace: Maintain a steady, smooth pace that allows to understand complex medical things with ease for any patient and human. use micro-pauses before and after complex medical terms or acronyms to aid listener retention. \nAccent: Educated Australian accent.\n\nScene:\nThe acoustic environment is an intimate, high-end medical consulting room.\n\nSample Context:\nan auditory environment that feels like a private consultation or a late-night mentoring session in a warmly lit, wood-paneled office.\n\nPerformance Rules:\n - Texts inside tags [ ] are acting and performing metadata. DO NOT READ ALOUD. \n- Use ... for pause .\n- Text inside { } is phonetic pronunciation guidance for the medical term that IMMEDIATELY FOLLOWS it. use those phonetics to shape the pronunciation of the next word in Australian accent. Do not rush, do not emphasize, let it land smooth and calm.\nTo ensure the correct Australian cadence and non-rhotic pronunciation of medical terms, guide the engine to read these words with the following values:\n*   Adenomyosis: add-eh-no-my-OH-sis (non-rhotic, soft 'd', secondary stress on 'add', primary stress on 'OH').\n*   Hysterectomy: hiss-teh-REC-tuh-mee (soft Australian neutral 'teh', no hard rhotic 'r').\n*   Laparoscopies: lap-ah-ROS-co-pees (the 'a' in lap is flat, 'ros' is short and crisp).\n*   Curette: cue-RET (equal stress, slightly elongated 'ret').\n*   Ablations: uh-BLAY-shunz (soft 'uh' onset).\n*   Heterogeneous: het-er-o-GEE-nee-us (soft 'er', non-rhotic, sounds like *het-uh-oh-GEE-nee-uhs* in Australian speech).\n*   Sarcomas: sah-CO-muhz (fully non-rhotic; do not pronounce the 'r' in sar).\n*   Pathologist: puh-THOL-uh-jist (stress on 'THOL').\n*   Transvaginal: trans-vuh-JY-nuhl (flat Australian 'a', in 'trans').\n\n- ## TRANSCRIPT",
    "context": "A compassionate and clear medical explanation of Adenomyosis, outlining its symptoms and treatments, spoken directly to a patient to reassure and inform them."
  },
  {
    "name": "Dr. Brown",
    "directorNotes": " You are world-class narrative voice actor. Read the full # TRANSCRIPT following the directors note and accent.\n\nAudio Profile: A Mature, academic, and compassionate physician with clear Educated Australian accent. The delivery is deliberate, measured, and informative, making it highly suitable for medical or health-related audiobooks.\n\nDirector's note:\n- Texts inside tags [ ] and (( )) are acting and performing metadata. DO NOT READ ALOUD.\n- Accent: Cultivated/Distinguished Australian. Soft-edged, polished, and authoritative, avoiding \"Broad\" slang in favor of high-register academic articulation.\n- Tone & Texture: The voice features a warm, gravelly lower-register resonance—the sound of a seasoned professional. It is clean and studio-perfect, possessing a \"confessional intimacy\" as if the speaker is confiding in a trusted colleague.\n- Cadence: Measured and deliberate. Prioritize professional clarity by utilizing rhythmic, steady pacing. Use brief, thoughtful pauses after key diagnostic or empathetic revelations to allow the weight of the information to land.\n\nPerformance Style:\nPhonetic Medical Terms for Australian Accent.\n\nScene:\nThe acoustic environment is an intimate, high-end medical consulting room discussing and answering questions of another doctor.\n\nSample Context:\nA friendly natural conversation between doctors. The listener must feel safe, respected, and guided by a veteran specialist. We will achieve this through a \"smooth controlled\" texture, utilizing the natural cadence of a General Australian accent to project both authority and warmth.\n\n- ## TRANSCRIPT",
    "context": "A friendly, professional clinical audit of hysterectomy metrics and adenomyosis histological markers with a fellow specialist."
  },
  {
    "name": "Custom Research Analyst",
    "mode": "SINGLE",
    "directorNotes": "Audio Profile: A 32-year-old lead analyst with articulate delivery.",
    "voice": "Zephyr",
    "context": "Deep tech analysis on AI hardware."
  }
];

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [toast, setToast] = useState<string | null>(null);

  // Live Jojo Stats
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [ledgerMetrics, setLedgerMetrics] = useState({ requests: 0, cost: 0.0, avgLatency: 0 });

  // Custom Template Manager State
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('custom_director_templates');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
          setCustomTemplates(prev => {
            const merged = [...prev];
            data.templates.forEach((st: any) => {
              if (!merged.some(p => p.name.toLowerCase() === st.name.toLowerCase())) {
                merged.push(st);
              }
            });
            try {
              localStorage.setItem('custom_director_templates', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      setToast('Please enter a template name.');
      return;
    }
    const nameExists = PRESET_TEMPLATES.some(t => t.name.toLowerCase() === newTemplateName.trim().toLowerCase()) ||
                       customTemplates.some(t => t.name.toLowerCase() === newTemplateName.trim().toLowerCase());
    if (nameExists) {
      setToast('A template with this name already exists.');
      return;
    }

    const newTpl: any = {
      name: newTemplateName.trim(),
      mode: podcastMode,
      directorNotes: directorNotes,
      directorNotesEcho: directorNotesEcho,
      directorNotesNoise: directorNotesNoise,
      duoEchoVoice: duoEchoVoice,
      duoNoiseVoice: duoNoiseVoice,
      voice: selectedVoice,
      context: podcastContext
    };

    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('custom_director_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTpl)
      });
      setToast(`Template "${newTpl.name}" saved & hardcoded into app!`);
    } catch (e) {
      setToast(`Template "${newTpl.name}" saved successfully!`);
    }

    setSelectedTemplateKey(newTpl.name);
    setNewTemplateName('');
    setIsAddingTemplate(false);
  };

  const handleDeleteTemplate = async (nameToDelete: string) => {
    const updated = customTemplates.filter(t => t.name !== nameToDelete);
    setCustomTemplates(updated);
    try {
      localStorage.setItem('custom_director_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      await fetch('/api/templates/' + encodeURIComponent(nameToDelete), {
        method: 'DELETE'
      });
    } catch (e) {
      console.error(e);
    }

    setToast(`Template "${nameToDelete}" deleted.`);
    if (selectedTemplateKey === nameToDelete) {
      setSelectedTemplateKey('');
    }
  };

  // Neural Architect & Script Auto-pilot
  const [podcastMode, setPodcastMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [podcastContext, setPodcastContext] = useState('');
  const [sceneSetup, setSceneSetup] = useState('');
  const [topicContext, setTopicContext] = useState('');
  const [directorNotes, setDirectorNotes] = useState('');
  const [directorNotesEcho, setDirectorNotesEcho] = useState(`# AUDIO PROFILE: Echo
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
Echo is the witty, playful heart of the podcast. She keeps the flow lively, dropping fast sarcastic jokes and keeping the mood highly entertaining.`);
  const [directorNotesNoise, setDirectorNotesNoise] = useState(`# AUDIO PROFILE: Noise
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
Noise is the seasoned anchor and systems thinker. He diagnoses structural flaws with clinical precision, offering grounded wisdom and authoritative tech insight.`);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [duoEchoVoice, setDuoEchoVoice] = useState('Leda');
  const [duoNoiseVoice, setDuoNoiseVoice] = useState('Algenib');
  const [ttsModel, setTtsModel] = useState<'LITE' | 'FLASH' | 'PRO'>('FLASH');
  const [scriptingModel, setScriptingModel] = useState<string>(JOJO_MODELS[JOJO_MODELS.indexOf('gemini-3.1-pro-preview')] || JOJO_MODELS[0]);
  const [jojoApiKey, setJojoApiKey] = useState<string>('');
  const [jojoJsonProtocol, setJojoJsonProtocol] = useState<boolean>(false);
  const [jojoSystemInstruction, setJojoSystemInstruction] = useState<string>(`You are JOJO — orchestrator, conductor, trusted intelligence. Precise, professional, and capable.
  
### DIRECT SCRIPT ASSISTANCE
- Use update_script to rewrite or edit manuscripts when asked.
- Maintain format integrity.
- Use dry British wit when in the JOJO Console.`);

  // Collaborative Workspace
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState<{id: string, sender: 'jojo'|'user', text: string, finished?: boolean}[]>([]);
  const [discussionContextText, setDiscussionContextText] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPlayerDismissed, setIsPlayerDismissed] = useState(false);
  const [showIgniteConfirm, setShowIgniteConfirm] = useState(false);

  const audioPlayed = useRef(false);

  // Audio Intro Logic
  useEffect(() => {
    if (audioPlayed.current) return;
    audioPlayed.current = true;
    // Play randomly 1 to 4 on load
    const randomNum = Math.floor(Math.random() * 4) + 1;
    const introAudio = new Audio(`/app_intro_${randomNum}.wav`);
    introAudio.volume = 0.5;
    introAudio.play().catch(e => console.log('Autoplay blocked:', e));
  }, []);

  const resultRef = useRef<HTMLDivElement>(null);

  // AUPHONIC CREDENTIALS
  const [auphonicUsername, setAuphonicUsername] = useState('Shah15');
  const [auphonicPassword, setAuphonicPassword] = useState('Fifa2016@@');

  // STUDIO GENERATION LOGIC
  const [file, setFile] = useState<File | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SCRIPT GENERATION & SYNTHESIS
  const [scriptText, setScriptText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // SONIC FORGE
  const [forgeMode, setForgeMode] = useState<'CLOUD' | 'LIVE_LAB'>('CLOUD');
  
  // VISUALIZER
  // Sync state to Voice Assistant telemetry
  useEffect(() => {
    const detail = {
      currentView: view,
      podcastMode,
      ttsModel,
      forgeMode,
      selectedVoice,
      duoEchoVoice,
      duoNoiseVoice,
      isLedgerOpen,
      isWorkspaceOpen,
      scriptTextSnapshot: scriptText.substring(0, 1500),
      contextBoardSnapshot: discussionContextText.substring(0, 1000)
    };
    window.dispatchEvent(new CustomEvent('app-telemetry', { detail }));
  }, [view, podcastMode, ttsModel, forgeMode, selectedVoice, duoEchoVoice, duoNoiseVoice, isLedgerOpen, isWorkspaceOpen, scriptText, discussionContextText]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    if (podcastContext || scriptText || audioUrl) {
      setHasUnsavedChanges(true);
    }
  }, [podcastContext, scriptText, audioUrl]);

  const handleApplyInstructions = (args: any) => {
    if (args.podcastContext) setPodcastContext(args.podcastContext);
    if (args.scene) setSceneSetup(args.scene);
    if (args.context) setTopicContext(args.context);
    if (args.directorNote) setDirectorNotes(args.directorNote);
    if (args.singleSpeakerNote) setScriptText((prev) => prev ? prev + '\n\n' + args.singleSpeakerNote : args.singleSpeakerNote);
    if (args.speaker1Note) setScriptText((prev) => prev ? prev + '\n\n[SPEAKER 1]: ' + args.speaker1Note : '[SPEAKER 1]: ' + args.speaker1Note);
    if (args.speaker2Note) setScriptText((prev) => prev ? prev + '\n\n[SPEAKER 2]: ' + args.speaker2Note : '[SPEAKER 2]: ' + args.speaker2Note);
    if (args.podcastMode) setPodcastMode(args.podcastMode as any);
    
    // Add success toast
    setToast('Notes applied successfully by Jojo.');

    logApiRequest(
      `Jojo updated podcast constraints`,
      'gemini-live-assistant',
      'TEXT',
      {
        charsIn: JSON.stringify(args).length,
        charsOut: 0,
        nodeId: 'VOICE_ASSISTANT',
        status: 'SUCCESS'
      }
    );
  };

  const handleUpdateDiscussionContext = (args: any) => {
    if (args.fullRewriteText) {
       setDiscussionContextText(args.fullRewriteText);
    } else if (args.textToAppend) {
       setDiscussionContextText(prev => prev ? prev + "\n" + args.textToAppend : args.textToAppend);
    }
    setToast('Context Board updated.');
  };

  const handleTransferDiscussionContext = (args: any) => {
    if (args.podcastContext) {
      setPodcastContext(args.podcastContext);
      setToast('Context Transferred to Architect.');
    }
  };

  const handleAppControlAction = (args: any) => {
    let actionsTaken: string[] = [];

    if (args.targetView && ViewState[args.targetView as keyof typeof ViewState]) {
      setView(args.targetView as ViewState);
      actionsTaken.push(`Switched View: ${args.targetView}`);
    }
    if (args.ttsModel && (args.ttsModel === 'LITE' || args.ttsModel === 'FLASH' || args.ttsModel === 'PRO')) {
      setTtsModel(args.ttsModel);
      actionsTaken.push(`Changed Model: ${args.ttsModel}`);
    }
    if (args.podcastMode && (args.podcastMode === 'SINGLE' || args.podcastMode === 'MULTI')) {
      setPodcastMode(args.podcastMode);
      actionsTaken.push(`Changed Mode: ${args.podcastMode}`);
    }
    if (args.forgeMode && (args.forgeMode === 'CLOUD' || args.forgeMode === 'LIVE_LAB')) {
      setForgeMode(args.forgeMode);
      actionsTaken.push(`Set Forge: ${args.forgeMode}`);
    }
    if (args.selectedVoice) {
      setSelectedVoice(args.selectedVoice);
      actionsTaken.push(`Set Mono Voice: ${args.selectedVoice}`);
    }
    if (args.duoEchoVoice) {
      setDuoEchoVoice(args.duoEchoVoice);
      actionsTaken.push(`Set Duo Voice 1: ${args.duoEchoVoice}`);
    }
    if (args.duoNoiseVoice) {
      setDuoNoiseVoice(args.duoNoiseVoice);
      actionsTaken.push(`Set Duo Voice 2: ${args.duoNoiseVoice}`);
    }
    if (args.scriptText) {
      setScriptText(args.scriptText);
      actionsTaken.push(`Updated Script Text`);
    }
    if (args.triggerAutoPilot) {
      actionsTaken.push(`Triggered Auto-Pilot Synthesis`);
      setTimeout(() => {
        handleAutoPilot();
      }, 500);
    }
    if (args.triggerIgnitePipeline) {
      actionsTaken.push(`Requested Audio Generation Synthesis - Pending User Approval`);
      setShowIgniteConfirm(true);
    }
    if (typeof args.toggleLedger === 'boolean') {
      setIsLedgerOpen(args.toggleLedger);
      actionsTaken.push(`${args.toggleLedger ? 'Opened' : 'Closed'} Ledger`);
    }
    if (typeof args.toggleWorkspace === 'boolean') {
      setIsWorkspaceOpen(args.toggleWorkspace);
      actionsTaken.push(`${args.toggleWorkspace ? 'Opened' : 'Closed'} Workspace`);
    }
    if (args.isSidebarCollapsed !== undefined) {
      setIsSidebarCollapsed(args.isSidebarCollapsed);
      actionsTaken.push(`${args.isSidebarCollapsed ? 'Minimized' : 'Expanded'} Director Panel`);
    }

    if (args.purgeBackup) {
      handleWipeBackup();
      actionsTaken.push(`Purged Recovered Session`);
    }

    if (actionsTaken.length > 0) {
      logApiRequest(
        `Jojo Command: ${actionsTaken.join(', ')}`,
        'gemini-live-assistant',
        'TEXT',
        {
          charsIn: 0,
          charsOut: 0,
          nodeId: 'VOICE_ASSISTANT',
          status: 'SUCCESS'
        }
      );
    }
  };

  const handleLiveTranscription = (message: any) => {
     setDiscussionMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.sender === message.sender && !last.finished) {
           return [
             ...prev.slice(0, prev.length - 1),
             { ...last, text: last.text + message.text, finished: message.finished }
           ];
        }
        return [...prev, { id: Date.now() + Math.random().toString(), sender: message.sender, text: message.text, finished: message.finished }];
     });
  };

  const handleSendMessage = (text: string) => {
     setDiscussionMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text, finished: true }]);
     window.dispatchEvent(new CustomEvent('app-send-text', { detail: { text } }));
  };

  useEffect(() => {
    setLogsList(getApiLogs());
    setLedgerMetrics(getLedgerStats());

    const onLogAdded = () => {
      setLogsList(getApiLogs());
      setLedgerMetrics(getLedgerStats());
    };
    
    window.addEventListener('api-log-added', onLogAdded);
    
    // Check for backups on initial load
    getBackupByKey('metadata').then((metadata: any) => {
      if (metadata) {
        setPodcastContext(metadata.podcastContext || '');
        setScriptText(metadata.scriptText || '');
        if (metadata.ttsModel) setTtsModel(metadata.ttsModel);
        if (metadata.podcastMode) setPodcastMode(metadata.podcastMode);
        
        // Load audio if exists
        getBackupByKey('generatedAudio').then((audioBlob: any) => {
           if (audioBlob) {
             const url = URL.createObjectURL(audioBlob as Blob);
             setAudioUrl(url);
             setIsRestored(true);
             setToast('Restored previous unsaved session successfully.');
           }
        });
      }
    });

    return () => {
       window.removeEventListener('api-log-added', onLogAdded);
    }
  }, []);

  const handleWipeBackup = async () => {
     await wipeBackupSuite();
     setPodcastContext('');
     setScriptText('');
     setAudioUrl(null);
     setIsRestored(false);
     setToast('Neural backup purged.');
  };

  const handleClearLogs = () => {
    clearApiLogs();
    setLogsList([]);
    setLedgerMetrics(getLedgerStats());
  };

  const handleDownloadLogs = () => {
    downloadLogsAsJson();
  };

  const handleAutoPilot = async () => {
    setStatus(ProcessingStatus.GENERATING_SCRIPT);
    setErrorMsg(null);
    
    try {
      const generatedScript = await generateIHackPodcast(
        podcastContext,
        podcastMode,
        scriptingModel,
        {
           echo: directorNotesEcho,
           noise: directorNotesNoise,
           mono: directorNotes
        }
      );

      setScriptText(generatedScript);

      // Auto-save backup values immediately
      await saveMetadataToBackup({
         podcastContext,
         scriptText: generatedScript,
         podcastMode,
         ttsModel,
         scriptingModel,
         timestamp: new Date().toISOString()
      } as any).catch(e => console.error("Backup save failed", e));

      setToast('Script generated successfully.');
      setStatus(ProcessingStatus.IDLE);

    } catch (e: any) {
      setErrorMsg(`Script Generation Error: ${e.message}`);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleIgnitePipeline = async (scriptOverride?: string) => {
    setIsPlayerDismissed(false);
    const scriptToUse = scriptOverride || scriptText;
    if (!scriptToUse) {
       setErrorMsg("No script available to synthesize.");
       setStatus(ProcessingStatus.ERROR);
       return;
    }

    setStatus(ProcessingStatus.SYNTHESIZING);
    setErrorMsg(null);

    try {
      const modelIdToUse = ttsModel === 'PRO' ? MODELS.TTS_PRO : (ttsModel === 'LITE' ? MODELS.TTS_LITE : MODELS.TTS_FLASH);
      let audioBlob;
      if (podcastMode === 'SINGLE') {
         const resp = await synthesizeSpeech(scriptToUse, selectedVoice, directorNotes, sceneSetup, topicContext, modelIdToUse);
         audioBlob = audioBufferToWav(resp);
      } else {
         const resp = await synthesizeMultiSpeaker(scriptToUse, duoEchoVoice, duoNoiseVoice, directorNotesEcho, directorNotesNoise, sceneSetup, topicContext, modelIdToUse);
         audioBlob = audioBufferToWav(resp);
      }
      
      const fileUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(fileUrl);
      
      // Save Backup
      await saveAudioToBackup('generatedAudio', audioBlob);
      await saveMetadataToBackup({
         podcastContext,
         scriptText: scriptToUse,
         podcastMode,
         ttsModel,
         scriptingModel,
         timestamp: new Date().toISOString()
      } as any).catch(e => console.error("Backup save failed", e));

      setToast('Audio synthesized successfully.');
      setStatus(ProcessingStatus.COMPLETE);

    } catch (e: any) {
      setErrorMsg(`Synthesis Error: ${e.message}`);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleDirectPipeline = async () => {
    setIsPlayerDismissed(false);
    if (!podcastContext && !topicContext) {
      setErrorMsg("Please provide discussion topic or context first.");
      setStatus(ProcessingStatus.ERROR);
      return;
    }

    setStatus(ProcessingStatus.GENERATING_SCRIPT);
    setErrorMsg(null);
    setToast('Starting Direct Automation Pipeline...');

    try {
      // Step 1: Script Generation
      const generatedScript = await generateIHackPodcast(
        podcastContext,
        podcastMode,
        scriptingModel,
        {
           echo: directorNotesEcho,
           noise: directorNotesNoise,
           mono: directorNotes
        }
      );

      setScriptText(generatedScript);

      // Save intermediate progress
      await saveMetadataToBackup({
         podcastContext,
         scriptText: generatedScript,
         podcastMode,
         ttsModel,
         scriptingModel,
         timestamp: new Date().toISOString()
      } as any).catch(e => console.error("Backup save failed", e));

      setToast('Script generated! Directing to Audio Generation...');

      // Step 2: Auto-trigger Speech Synthesis
      setStatus(ProcessingStatus.SYNTHESIZING);
      const modelIdToUse = ttsModel === 'PRO' ? MODELS.TTS_PRO : (ttsModel === 'LITE' ? MODELS.TTS_LITE : MODELS.TTS_FLASH);
      
      let audioBlob;
      if (podcastMode === 'SINGLE') {
         const resp = await synthesizeSpeech(generatedScript, selectedVoice, directorNotes, sceneSetup, topicContext, modelIdToUse);
         audioBlob = audioBufferToWav(resp);
      } else {
         const resp = await synthesizeMultiSpeaker(generatedScript, duoEchoVoice, duoNoiseVoice, directorNotesEcho, directorNotesNoise, sceneSetup, topicContext, modelIdToUse);
         audioBlob = audioBufferToWav(resp);
      }
      
      const fileUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(fileUrl);
      
      // Save Backup
      await saveAudioToBackup('generatedAudio', audioBlob);
      await saveMetadataToBackup({
         podcastContext,
         scriptText: generatedScript,
         podcastMode,
         ttsModel,
         scriptingModel,
         timestamp: new Date().toISOString()
      } as any).catch(e => console.error("Backup save failed", e));

      setToast('One-Button Pipeline Complete! Your podcast is ready.');
      setStatus(ProcessingStatus.COMPLETE);

    } catch (e: any) {
      setErrorMsg(`Pipeline Automation Error: ${e.message}`);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  // -----------------------------------------
  // RENDER SECTIONS
  // -----------------------------------------

  const renderHome = () => (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center max-w-[1600px] mx-auto p-8 md:p-12 text-center animate-fadeIn relative">
      <InteractiveSpaceBackground />
      <div className="background-glow opacity-30" />
      
      <InteractiveHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1500px] mb-12">
        {[
          { 
            id: ViewState.STORY_STUDIO, 
            stage: "1",
            name: "Story Studio", 
            subtitle: "1. Raw Idea to Story Bible",
            desc: "Idea generation, Story Bible locking, multi-agent scene tournaments & raw narrative creation.", 
            icon: <Film />, 
            color: "text-purple-400", 
            glow: "rgba(168,85,247,0.4)",
            subLinks: [
              { label: "Story Bible", target: ViewState.STORY_STUDIO },
              { label: "Scene Matrix", target: ViewState.STORY_STUDIO },
              { label: "Phase 5 Script", target: ViewState.STORY_STUDIO },
              { label: "Subtext Studio", target: ViewState.STORY_STUDIO }
            ]
          },
          { 
            id: ViewState.JARVIS_AURA, 
            stage: "2",
            name: "Jarvis Scripting", 
            subtitle: "2. Scripting & Agent Refinement",
            desc: "Script orchestration, multi-agent dialogue, JOJO workspace console & protocol execution.", 
            icon: <Terminal />, 
            color: "text-sky-400", 
            glow: "rgba(56,189,248,0.4)",
            subLinks: [
              { label: "Agent Chat", target: ViewState.JARVIS_AURA },
              { label: "JOJO Console", target: ViewState.JARVIS_CONSOLE },
              { label: "Protocol Engine", target: ViewState.JARVIS_AURA },
              { label: "Telemetry Log", target: ViewState.JARVIS_AURA }
            ]
          },
          { 
            id: ViewState.QUICK_LAB, 
            stage: "3",
            name: "iHack Audio TTS", 
            subtitle: "3. Neural Speech Synthesis",
            desc: "Neural studio speech synthesis, voice casting, director notes tuning & Sonic Forge mastering.", 
            icon: <Headphones />, 
            color: "text-emerald-400", 
            glow: "rgba(16,185,129,0.4)",
            subLinks: [
              { label: "Quick Lab", target: ViewState.QUICK_LAB },
              { label: "Studio Synthesis", target: ViewState.STUDIO_SYNTHESIS },
              { label: "Sonic Forge", target: ViewState.SONIC_FORGE },
              { label: "Medical Lab", target: ViewState.MEDICAL_SCRIPT }
            ]
          },
          { 
            id: ViewState.FORENSIC_DOSSIER, 
            stage: "4",
            name: "Audio Analyzer", 
            subtitle: "4. Forensic Audit & QA",
            desc: "EBU R128 / ACX loudness compliance, acoustic signatures, narrator audit & client delivery.", 
            icon: <BarChart3 />, 
            color: "text-cyan-400", 
            glow: "rgba(6,182,212,0.4)",
            subLinks: [
              { label: "Forensic Dossier", target: ViewState.FORENSIC_DOSSIER },
              { label: "Client Delivery", target: ViewState.FORENSIC_DOSSIER },
              { label: "Acoustic Audit", target: ViewState.FORENSIC_DOSSIER },
              { label: "Compliance QA", target: ViewState.FORENSIC_DOSSIER }
            ]
          },
        ].map(m => (
          <div 
            key={m.id} 
            style={{ 
                '--tw-shadow-color': m.glow,
                borderColor: m.glow.replace('0.4', '0.15')
            } as any}
            className="group bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/90 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_20px_40px_var(--tw-shadow-color)] relative overflow-hidden text-left"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg ${m.color} bg-white/10 flex items-center justify-center font-mono font-black text-xs border border-white/10`}>
                    {m.stage}
                  </span>
                  <div className={`${m.color} p-2.5 rounded-2xl bg-white/5 border border-white/10 transform group-hover:scale-110 transition-transform duration-500`}>
                    {React.cloneElement(m.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
                  </div>
                </div>
                <button
                  onClick={() => setView(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1 cursor-pointer`}
                >
                  Launch Stage <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <h3 className="text-xl font-black tracking-tight text-white mb-1">{m.name}</h3>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-3 ${m.color}`}>{m.subtitle}</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">{m.desc}</p>
            </div>

            {/* Quick Sub-Links */}
            <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              {m.subLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => setView(link.target)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-left truncate flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-emerald-500">›</span> {link.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Neural Settings Section on Home Page */}
      <div className="w-full max-w-[1400px] mt-8 text-left animate-slideUp">
         <div className="flex items-center gap-4 mb-8 pl-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-3">
               <Cpu className="w-5 h-5 text-indigo-400" />
               <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Neural Settings</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
         </div>
         <JojoSettingsPanel 
            selectedModel={scriptingModel}
            onModelChange={setScriptingModel}
            apiKey={jojoApiKey}
            onApiKeyChange={setJojoApiKey}
            systemInstruction={jojoSystemInstruction}
            onSystemInstructionChange={setJojoSystemInstruction}
            jsonProtocol={jojoJsonProtocol}
            onJsonProtocolChange={setJojoJsonProtocol}
            onApply={() => {
               setToast("Neural Core Synchronized Successfully");
               localStorage.setItem('jojo_config', JSON.stringify({
                  model: scriptingModel,
                  apiKey: jojoApiKey,
                  instruction: jojoSystemInstruction,
                  jsonProtocol: jojoJsonProtocol
               }));
            }}
            onReset={() => {
               setScriptingModel(JOJO_MODELS[JOJO_MODELS.indexOf('gemini-3.1-pro-preview')] || JOJO_MODELS[0]);
               setJojoApiKey('');
               setJojoJsonProtocol(false);
               setJojoSystemInstruction(`You are JOJO — orchestrator, conductor, trusted intelligence. Precise, professional, and capable.
  
### DIRECT SCRIPT ASSISTANCE
- Use update_script to rewrite or edit manuscripts when asked.
- Maintain format integrity.
- Use dry British wit when in the JOJO Console.`);
               setToast("Neural Settings Reset to Baseline");
            }}
         />
      </div>
      
      {/* Recovery Notice if backup exists */}

      {isRestored && (
         <div className="mt-12 inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full text-sm animate-slideUp">
           <Database className="w-4 h-4" />
           <span className="font-medium">Previous unsaved session recovered. Check Neural Architect/Studio.</span>
           <button onClick={handleWipeBackup} className="ml-2 hover:bg-emerald-500/20 p-1 rounded-full transition-colors">
             <X className="w-4 h-4" />
           </button>
         </div>
      )}
    </div>
  );

  const renderNeuralArchitectOrStudio = (isStudio: boolean) => {
    const isPlayerVisible = (audioUrl || status === ProcessingStatus.SYNTHESIZING) && !isPlayerDismissed;
    const title = isStudio ? "Neural Studio" : "Neural Architect";
    const color = isStudio ? "pink" : "emerald";
    
    // Theme colors mapping
    const textAccentClass = isStudio ? "text-pink-500/80" : "text-emerald-500/80";
    const textAccentLightClass = isStudio ? "text-pink-400" : "text-emerald-400";
    const bgAccentClass = isStudio ? "bg-pink-500" : "bg-emerald-500";
    const bgAccentHoverClass = isStudio ? "hover:bg-pink-400" : "hover:bg-emerald-400";
    const selectBorderAccentClass = isStudio ? "focus:border-pink-500" : "focus:border-emerald-500";
    const shadowAccentClass = isStudio ? "shadow-pink-500/30" : "shadow-emerald-500/30";
    
    return (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn">
       <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <Button onClick={() => setView(ViewState.HOME)} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0" />
        <h2 className="text-3xl font-black">{title}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {!isSidebarCollapsed && (
          <div className="lg:col-span-4 flex flex-col gap-6 w-full animate-fadeIn group/sidebar">
           <div className="glass-panel p-8 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-2xl border border-white/5 flex flex-col gap-8 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar shadow-2xl shadow-black/40">
              
              <div className="flex flex-col gap-2">
                 <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentClass} mb-1 block`}>Production Mode</label>
                 <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 flex items-center">
                    <button onClick={() => setPodcastMode('SINGLE')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'SINGLE' ? `${bgAccentClass} text-slate-950 shadow-lg ${shadowAccentClass} scale-100` : `text-slate-500 ${isStudio ? 'hover:text-pink-400' : 'hover:text-emerald-400'} scale-95 opacity-60`}`}>Solo</button>
                    <button onClick={() => setPodcastMode('MULTI')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${podcastMode === 'MULTI' ? `${bgAccentClass} text-slate-950 shadow-lg ${shadowAccentClass} scale-100` : `text-slate-500 ${isStudio ? 'hover:text-pink-400' : 'hover:text-emerald-400'} scale-95 opacity-60`}`}>Duo</button>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 block">Quick Templates</label>
                    <button
                      onClick={() => setIsAddingTemplate(!isAddingTemplate)}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" /> Save Custom
                    </button>
                 </div>

                 {isAddingTemplate && (
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 flex flex-col gap-2 mb-2 animate-fadeIn">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">Save current notes & context</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Template name..."
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTemplate();
                          }}
                        />
                        <button
                          onClick={handleSaveTemplate}
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingTemplate(false);
                            setNewTemplateName('');
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-700 hover:text-white transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                 )}

                 <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                       <select
                         value={selectedTemplateKey}
                         onChange={(e) => {
                           const val = e.target.value;
                           setSelectedTemplateKey(val);
                           if (!val) return;
                           
                           const found: any = PRESET_TEMPLATES.find(t => t.name === val) || customTemplates.find(t => t.name === val);
                           if (found) {
                             if (found.mode) {
                               setPodcastMode(found.mode);
                             } else {
                               setPodcastMode('SINGLE');
                             }
                             if (found.directorNotes) setDirectorNotes(found.directorNotes);
                             if (found.directorNotesEcho) setDirectorNotesEcho(found.directorNotesEcho);
                             if (found.directorNotesNoise) setDirectorNotesNoise(found.directorNotesNoise);
                             if (found.duoEchoVoice) setDuoEchoVoice(found.duoEchoVoice);
                             if (found.duoNoiseVoice) setDuoNoiseVoice(found.duoNoiseVoice);
                             if (found.voice) setSelectedVoice(found.voice);
                             if (found.context) setPodcastContext(found.context);
                             setToast(`Applied "${found.name}" template.`);
                           }
                         }}
                         className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 focus:border-amber-500 outline-none appearance-none cursor-pointer"
                       >
                         <option value="">Select a template...</option>
                         <optgroup label="Preset Templates">
                           {PRESET_TEMPLATES.map(t => (
                             <option key={t.name} value={t.name}>{t.name}</option>
                           ))}
                         </optgroup>
                         {customTemplates.length > 0 && (
                           <optgroup label="Custom Templates">
                             {customTemplates.map(t => (
                               <option key={t.name} value={t.name}>{t.name}</option>
                             ))}
                           </optgroup>
                         )}
                       </select>
                       <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                           <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                         </svg>
                       </div>
                    </div>
                    {customTemplates.some(t => t.name === selectedTemplateKey) && (
                      <button
                        onClick={() => handleDeleteTemplate(selectedTemplateKey)}
                        className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shrink-0"
                        title="Delete this template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                   <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentClass}`}>TTS Engine</label>
                   <span className="text-[9px] font-mono text-indigo-400 font-bold">
                     {ttsModel === 'PRO' ? 'gemini-2.5-pro-preview-tts' : ttsModel === 'FLASH' ? 'gemini-2.5-flash-preview-tts' : 'gemini-3.1-flash-tts-preview'}
                   </span>
                 </div>
                 <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1">
                    <button title="gemini-3.1-flash-tts-preview" onClick={() => setTtsModel('LITE')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'LITE' ? `${bgAccentClass} text-slate-950` : 'text-slate-500 hover:text-slate-300'}`}>3.1 Flash</button>
                    <button title="gemini-2.5-flash-preview-tts" onClick={() => setTtsModel('FLASH')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'FLASH' ? `${bgAccentClass} ${isStudio ? 'text-slate-300' : 'text-slate-950'}` : 'text-slate-500 hover:text-slate-300'}`}>2.5 Flash</button>
                    <button title="gemini-2.5-pro-preview-tts" onClick={() => setTtsModel('PRO')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${ttsModel === 'PRO' ? `${bgAccentClass} text-slate-950` : 'text-slate-500 hover:text-slate-300'}`}>2.5 Pro TTS</button>
                 </div>
              </div>

              {podcastMode === 'SINGLE' ? (
                <div className="space-y-6">
                   <div>
                      <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${textAccentLightClass} mb-3 block`}>Neural Voice Preset</label>
                      <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className={`w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 ${selectBorderAccentClass} outline-none appearance-none cursor-pointer`}>
                        {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                   </div>
                   <ResizableTextarea label="Director's Note" color={color} icon={<Wand2 className={`w-4 h-4 text-${color}-500`} />} value={directorNotes} onChange={setDirectorNotes} minHeight="350px" placeholder="Combined Director's Note: Audio Profile, Scene, Context..." />
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 mb-3 block flex items-center gap-2"><Headphones className="w-3.5 h-3.5"/> Echo Voice</label>
                        <select value={duoEchoVoice} onChange={e => setDuoEchoVoice(e.target.value)} className="w-full bg-slate-950 border border-sky-500/20 rounded-2xl p-4 text-sm text-sky-100 focus:border-sky-500 outline-none appearance-none cursor-pointer">
                          {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-3 block flex items-center gap-2"><RadioReceiver className="w-3.5 h-3.5"/> Noise Voice</label>
                        <select value={duoNoiseVoice} onChange={e => setDuoNoiseVoice(e.target.value)} className="w-full bg-slate-950 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-100 focus:border-rose-500 outline-none appearance-none cursor-pointer">
                          {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                   </div>
                   <ResizableTextarea label="Director's Note: Echo" color={color} icon={<Wand2 className="w-4 h-4 text-sky-400" />} value={directorNotesEcho} onChange={setDirectorNotesEcho} minHeight="250px" placeholder="Audio Profile, Scene, and Context for Echo..." />
                   <ResizableTextarea label="Director's Note: Noise" color={color} icon={<Wand2 className="w-4 h-4 text-rose-400" />} value={directorNotesNoise} onChange={setDirectorNotesNoise} minHeight="250px" placeholder="Audio Profile, Scene, and Context for Noise..." />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6 relative`}>
             <div className={`glass-panel rounded-[2rem] bg-slate-900/40 border border-white/5 flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ${isPlayerVisible ? 'min-h-[350px]' : 'min-h-[1000px]'}`}>

                <div className="border-b border-white/5 bg-slate-950/50 flex flex-wrap items-center justify-between px-6 py-4 gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                     <FileCode2 className="w-5 h-5 text-slate-400" />
                     <span className="font-mono text-sm tracking-wide text-slate-300 font-bold uppercase">Manual Synthesis Editor</span>
                      <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`ml-3 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer group/btn ${isSidebarCollapsed ? `bg-${color}-500/10 text-${color}-400 border-${color}-500/30` : `bg-slate-900 text-slate-400 hover:text-${color}-400 hover:bg-slate-800`}`}
                        title={isSidebarCollapsed ? "Show Director Panel" : "Hide Director Panel"}
                      >
                        {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{isSidebarCollapsed ? "Open Director" : "Focus Editor"}</span>
                      </button>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button onClick={() => handleIgnitePipeline()} disabled={!scriptText || status === ProcessingStatus.SYNTHESIZING} isLoading={status === ProcessingStatus.SYNTHESIZING} className={`bg-gradient-to-r ${isStudio ? 'from-pink-600 to-purple-600' : 'from-emerald-600 to-teal-600'} text-white shadow-lg ${isStudio ? 'shadow-pink-900/20' : 'shadow-emerald-900/20'} px-6 h-10 rounded-xl text-xs font-black uppercase flex items-center gap-1.5`} size="xs" icon={<Sparkles className="w-3.5 h-3.5" />}>Audio Generation</Button>
                     
                     {audioUrl && isPlayerDismissed && (
                       <Button onClick={() => setIsPlayerDismissed(false)} className={`bg-${color}-600/20 border border-${color}-500/30 text-${color}-400 hover:bg-${color}-500/30 rounded-xl h-10 px-4 text-xs font-black uppercase flex items-center gap-1.5`} size="xs" icon={<Headphones className="w-3.5 h-3.5" />}>Show Player</Button>
                     )}
                     <Button onClick={() => setScriptText('')} className="bg-slate-800 hover:bg-rose-500/25 border border-white/5 text-slate-300 hover:text-rose-300 rounded-xl h-10 px-4 text-xs font-black uppercase flex items-center gap-1.5" size="xs" icon={<Trash2 className="w-3.5 h-3.5" />}>Clear</Button>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col bg-[#020617]/50 relative">
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Enter raw dialogue text to synthesize directly..."
                    style={{ resize: 'vertical' }} className={`flex-1 w-full bg-transparent text-slate-300 resize-y outline-none font-mono text-sm leading-8 custom-scrollbar relative z-10 transition-all duration-300 ${isPlayerVisible ? 'min-h-[220px]' : 'min-h-[800px]'}`}
                  />
                  <div className="absolute bottom-6 left-6 right-6 pointer-events-none bg-gradient-to-t from-[#020617] to-transparent h-12" />
                </div>
                
                <div className="h-12 border-t border-white/5 bg-slate-950/40 flex-shrink-0 flex items-center justify-between px-6">
                   <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900/50 border border-white/5 px-3 py-1 rounded-md">
                      Tokens: {Math.round(scriptText.length / 4)}
                   </span>
                </div>

             </div>

             {(audioUrl || status === ProcessingStatus.SYNTHESIZING) && !isPlayerDismissed && (
                <div className="h-40 glass-panel rounded-[2rem] bg-slate-900/40 border border-white/5 p-6 flex items-center justify-between relative overflow-hidden animate-fadeIn">
                   <button 
                     onClick={() => setIsPlayerDismissed(true)} 
                     className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-slate-950/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 transition-all cursor-pointer"
                     title="Hide Audio Player"
                   >
                     <X className="w-3.5 h-3.5" />
                   </button>

                   <div className={`absolute top-0 right-0 w-64 h-64 bg-${color}-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
                   
                   <div className="flex flex-col gap-2 relative z-10">
                      <h3 className="font-black text-lg tracking-wide flex items-center gap-2">
                        <AudioLines className={`w-5 h-5 text-${color}-400`} />
                        Mastered Artifact
                      </h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm">
                        Final processed audio output from the Ignite Manual pipeline will appear here.
                      </p>
                   </div>

                   <div className="w-[600px] h-full bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center relative p-4 z-10 shadow-inner">
                       {audioUrl ? (
                         <div className="w-full flex items-center gap-6 animate-fadeIn">
                           <Button 
                             icon={<Download className="w-4 h-4" />} 
                             className={`bg-${color}-500 hover:bg-${color}-400 text-slate-950 font-black px-4 rounded-xl shadow-lg ${shadowAccentClass} h-12`}
                             onClick={() => {
                               const a = document.createElement('a');
                               a.href = audioUrl;
                               a.download = `synthesis_${Date.now()}.wav`;
                               a.click();
                             }}
                           >
                              Save
                           </Button>
                           <audio controls src={audioUrl} className="w-full h-10 outline-none rounded-2xl opacity-90 grayscale contrast-125" />
                         </div>
                       ) : status === ProcessingStatus.SYNTHESIZING ? (
                          <div className={`flex items-center gap-4 text-${color}-500 font-mono text-sm tracking-widest uppercase items-center animate-pulse`}>
                             <Loader2 className="w-5 h-5 animate-spin" />
                             <span>Streaming Speech Context...</span>
                          </div>
                       ) : (
                         <div className="text-slate-600 text-sm font-medium tracking-wide">Awaiting pipeline execution...</div>
                       )}
                   </div>
                </div>
             )}
             </div>
        </div>
      </div>
    );
  };

  const renderNeuralArchitect = () => renderNeuralArchitectOrStudio(false);
  const renderStudioSynthesis = () => renderNeuralArchitectOrStudio(true);const renderSonicForge = () => (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn">
      <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <Button onClick={() => setView(ViewState.HOME)} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0" />
        <h2 className="text-3xl font-black">Sonic Forge</h2>
      </div>

      <div className="max-w-4xl mx-auto mb-12 flex justify-center">
        <div className="bg-slate-900/60 border border-white/5 p-2 rounded-2xl flex gap-2 w-full max-w-md shadow-2xl backdrop-blur-xl">
           <button onClick={() => setForgeMode('CLOUD')} className={`flex-1 flex gap-2 items-center justify-center py-3 rounded-xl transition-all ${forgeMode === 'CLOUD' ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-slate-950 font-bold' : 'text-slate-400 hover:text-cyan-400 font-medium'}`}>
             <Globe2 className="w-4 h-4" /> Cloud Mastering
           </button>
           <button onClick={() => setForgeMode('LIVE_LAB')} className={`flex-1 flex gap-2 items-center justify-center py-3 rounded-xl transition-all ${forgeMode === 'LIVE_LAB' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-400 font-medium'}`}>
             <Activity className="w-4 h-4" /> Live Lab
           </button>
        </div>
      </div>

      {forgeMode === 'CLOUD' ? (
         <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto mt-12 animate-fadeIn">
            <div className="glass-panel p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-8 overflow-y-auto custom-scrollbar">
               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                     <Waves className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-4 mb-2 tracking-wide text-white">Auphonic Cloud Engine</h3>
                  <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-bold tracking-widest">Automatic loudness normalization, noise reduction, and intelligent leveling via Auphonic Cloud API.</p>
               </div>

               <div className="border-2 border-dashed border-cyan-500/30 rounded-3xl p-12 text-center bg-cyan-500/5 transition-colors hover:bg-cyan-500/10 cursor-pointer group">
                  <Upload className="w-16 h-16 text-cyan-400/50 group-hover:text-cyan-400 mx-auto mb-6 transition-colors duration-300" />
                  <p className="text-lg font-medium text-slate-300 group-hover:text-white transition-colors duration-300">Drop raw audio file or click to select</p>
                  <p className="text-xs text-slate-500 mt-2 font-mono">WAV, MP3, FLAC supported</p>
               </div>
               
               <div className="flex justify-center mt-8">
                 <Button className="bg-cyan-600 hover:bg-cyan-500 px-12 rounded-full h-14 text-white shadow-lg shadow-cyan-900/20" icon={<Wand2 className="w-5 h-5"/>} glowColor="cyan">
                   Process Audio Track
                 </Button>
               </div>
            </div>
         </div>
      ) : (
         <RealtimeMasteringPanel />
      )}
    </div>
  );

  const renderMedicalScriptLab = () => (
    <MedicalScriptPanel 
      scriptText={scriptText}
      setScriptText={setScriptText}
      onGoBack={() => setView(ViewState.HOME)}
      logApiRequest={logApiRequest}
      setToast={(msg) => setToast(msg)}
      selectedModel={scriptingModel}
      setSelectedModel={setScriptingModel}
      podcastMode={podcastMode}
      setPodcastMode={setPodcastMode}
    />
  );

  const renderJarvisConsole = () => (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn">
       <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <Button onClick={() => setView(ViewState.HOME)} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0" />
        <h2 className="text-3xl font-black font-sans">JOJO Core</h2>
        <div className="flex-1" />
        <Button onClick={() => setView(ViewState.JOJO_ENGINE)} icon={<Settings />} className="bg-slate-900 border border-white/5 text-[10px] font-black uppercase px-6">Neural Config</Button>
      </div>
      <JarvisConsole 
         scriptingModel={scriptingModel}
         jojoApiKey={jojoApiKey}
         jojoSystemInstruction={jojoSystemInstruction}
         jojoJsonProtocol={jojoJsonProtocol}
      />
    </div>
  );

  const renderJojoEngine = () => (
    <div className="max-w-[1920px] mx-auto p-6 animate-fadeIn">
       <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <Button onClick={() => setView(ViewState.JARVIS_CONSOLE)} icon={<ArrowLeft />} className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl p-0" />
        <h2 className="text-3xl font-black font-sans">Neural Settings</h2>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <JojoSettingsPanel 
          selectedModel={scriptingModel}
          onModelChange={setScriptingModel}
          apiKey={jojoApiKey}
          onApiKeyChange={setJojoApiKey}
          systemInstruction={jojoSystemInstruction}
          onSystemInstructionChange={setJojoSystemInstruction}
          jsonProtocol={jojoJsonProtocol}
          onJsonProtocolChange={setJojoJsonProtocol}
          onApply={() => {
            setToast("Neural Protocols Updated Successfully.");
            setView(ViewState.JARVIS_CONSOLE);
          }}
          onReset={() => {
            setScriptingModel("gemini-3.1-pro-preview");
            setJojoApiKey("");
            setJojoSystemInstruction(`You are JOJO — orchestrator, conductor, trusted intelligence. Precise, professional, and capable.`);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 overflow-y-auto custom-scrollbar relative">
      
      {/* Global Navbar */}
      <Header 
        currentView={view}
        onSelectView={setView}
        auphonicUsername={auphonicUsername}
        setAuphonicUsername={setAuphonicUsername}
        auphonicPassword={auphonicPassword}
        setAuphonicPassword={setAuphonicPassword}
        onOpenLedger={() => setIsLedgerOpen(true)}
        ledgerMetrics={ledgerMetrics}
        hasUnsavedChanges={hasUnsavedChanges}
        onWipeBackup={handleWipeBackup}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      
      <VoiceAssistantWidget 
        onApplyInstructions={handleApplyInstructions} 
        onAppControl={handleAppControlAction} 
        onUpdateContext={handleUpdateDiscussionContext}
        onTransferContext={handleTransferDiscussionContext}
        onTranscribe={handleLiveTranscription}
        onToggleWorkspace={() => setIsWorkspaceOpen(prev => !prev)}
        selectedModel={scriptingModel}
        apiKey={jojoApiKey}
        systemInstruction={jojoSystemInstruction}
      />
      
      <CollaborativeWorkspace 
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        messages={discussionMessages}
        contextBoardText={discussionContextText}
        setContextBoardText={setDiscussionContextText}
        onSendMessage={handleSendMessage}
        onTransferToMain={() => {
          handleTransferDiscussionContext({ podcastContext: discussionContextText });
          setIsWorkspaceOpen(false);
          setView(ViewState.QUICK_LAB);
        }}
      />

      {showIgniteConfirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/20 p-8 rounded-[2rem] max-w-lg w-full shadow-2xl flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Ignite Neural Pipeline</h3>
                <p className="text-[9px] uppercase tracking-wider text-amber-500/80 font-bold mt-0.5 animate-pulse">Synthesis Confirmation Required</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              JARVIS (Jojo) is requesting to execute full audio synthesis. This action compiles the script and transfers direct execution control to the neural audio synthesis engine.
            </p>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-white/5 font-mono text-[10px]">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 uppercase font-bold tracking-wider">Engine:</span>
                <span className="text-indigo-400 font-extrabold">{ttsModel === 'PRO' ? 'P2 (Pro)' : (ttsModel === 'FLASH' ? 'F2 (Flash)' : 'F3 (Lite)')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 uppercase font-bold tracking-wider">Model Quality:</span>
                <span className="text-pink-400 font-extrabold">{ttsModel}</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2 border-t border-white/5 pt-3">
                <span className="text-slate-500 uppercase font-bold tracking-wider">Production Mode:</span>
                <span className="text-cyan-400 font-extrabold">{podcastMode === 'SINGLE' ? 'Solo Speaker (Mono)' : 'Duo Podcast (Duo)'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowIgniteConfirm(false);
                  logApiRequest(
                    `Ignite pipeline canceled by user`,
                    'gemini-live-assistant',
                    'TEXT',
                    { charsIn: 0, charsOut: 0, nodeId: 'VOICE_ASSISTANT', status: 'FAILED' }
                  );
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 py-3 rounded-xl uppercase text-[10px] font-black tracking-widest transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button 
                onClick={() => {
                  setShowIgniteConfirm(false);
                  handleIgnitePipeline();
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-slate-950 hover:text-slate-950 font-black py-3 rounded-xl uppercase text-[10px] tracking-widest shadow-xl shadow-pink-500/20 transition-all cursor-pointer"
              >
                Approve & Ignite
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-8">
        {view === ViewState.HOME && renderHome()}
        {view === ViewState.QUICK_LAB && renderNeuralArchitect()}
        {view === ViewState.STUDIO_SYNTHESIS && renderStudioSynthesis()}
        {view === ViewState.SONIC_FORGE && renderSonicForge()}
        {view === ViewState.MEDICAL_SCRIPT && renderMedicalScriptLab()}
        {view === ViewState.JARVIS_CONSOLE && renderJarvisConsole()}
        {view === ViewState.JOJO_ENGINE && renderJojoEngine()}
        {view === ViewState.STORY_STUDIO && (
          <div className="h-[calc(100vh-64px)] w-full">
            <StoryFlixApp />
          </div>
        )}
        {view === ViewState.JARVIS_AURA && (
          <JarvisAuraApp onBackToHub={() => setView(ViewState.HOME)} />
        )}
        {view === ViewState.FORENSIC_DOSSIER && (
          <ForensicDossierApp onBackToHub={() => setView(ViewState.HOME)} />
        )}
      </main>

      {/* Ledger Slide-over Drawer overlay */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsLedgerOpen(false)} />
          
          {/* Drawer Content Body */}
          <div className="relative w-full max-w-2xl h-full bg-slate-950 border-l border-white/10 shadow-2xl flex flex-col z-10 animate-slideLeft overflow-hidden">
            
            {/* Header section with borders and neon indicator */}
            <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <Coins className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                   <h2 className="text-lg font-black tracking-widest uppercase">Nexus Ledger</h2>
                   <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5 whitespace-nowrap">Immutable API Activity Log & Cost Analytics</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownloadLogs} className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setIsLedgerOpen(false)} className="p-2.5 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all border border-transparent">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="p-6 border-b border-white/10 bg-slate-900/30 grid grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-500"/> Total Calls</span>
                <span className="text-2xl font-black font-mono text-cyan-400 shadow-cyan-500/50">{ledgerMetrics.requests}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Terminal className="w-3 h-3 text-emerald-500"/> Token Burn</span>
                 <span className="text-2xl font-black font-mono text-emerald-400">${(ledgerMetrics?.cost || 0).toFixed(4)}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500"/> Avg Latency</span>
                 <span className="text-2xl font-black font-mono text-amber-400">{ledgerMetrics.avgLatency}ms</span>
              </div>
            </div>

            {/* Logs List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {logsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500/50">
                  <Terminal className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-mono text-sm uppercase tracking-widest">No API activity recorded yet.</p>
                </div>
              ) : (
                logsList.map((log) => (
                  <div key={log.id} className="bg-slate-900/80 border border-slate-700/50 p-5 rounded-2xl font-mono text-xs text-slate-300 shadow-xl">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          {log.status}
                        </span>
                        <span className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[11px]">{log.purpose}</span>
                      </div>
                      <span className="text-slate-500 text-[10px] font-medium tracking-wide">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] opacity-80 font-medium tracking-wide bg-slate-950/50 p-4 rounded-xl border border-white/5">
                      <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Engine</span> <span className="text-indigo-300 font-black">{log.model}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Tokens In</span> <span className="text-sky-300 font-black">{log.charsIn.toLocaleString()}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Tokens Out</span> <span className="text-purple-300 font-black">{log.charsOut.toLocaleString()}</span></div>
                      {typeof log.approxCost === 'number' && (
                        <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Cost</span> <span className="text-emerald-400 font-black">${log.approxCost.toFixed(6)}</span></div>
                      )}
                      <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Node ID</span> <span className="text-slate-400 font-black truncate">{log.nodeId}</span></div>
                      {log.audioDurationSec > 0 && (
                        <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase tracking-widest font-bold">Audio Duration</span> <span className="text-amber-300 font-black">{log.audioDurationSec}s</span></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Drawer Footer */}
            {logsList.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-slate-900/50 flex justify-end">
                <Button onClick={handleClearLogs} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold border-rose-500/20" size="sm" icon={<Trash2 className="w-4 h-4"/>}>
                  Purge Ledger
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
