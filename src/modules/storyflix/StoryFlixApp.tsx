import React, { useState, useEffect } from 'react';
import { StoryFlixStep, StoryFlixBible, createInitialStoryFlixBible, ConceptData, CharacterPersona, BibleScene, SceneMatrix3x3Result } from './types/storyFlix';
import { StoryFlixHeader } from './components/StoryFlixHeader';
import { CoreIdeaStudio } from './components/CoreIdeaStudio';
import { PersonaExtractor } from './components/PersonaExtractor';
import { SceneMatrix3x3 } from './components/SceneMatrix3x3';
import { CpsdDocumentStudio } from './components/CpsdDocumentStudio';
import { CpsdStoryBibleViewer } from './components/CpsdStoryBibleViewer';
import { fetchStoryBible, updateStoryBible, compileCpsdMarkdown } from './services/storyFlixApi';

export const StoryFlixApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StoryFlixStep>('core_idea');
  const [bible, setBible] = useState<StoryFlixBible>(createInitialStoryFlixBible());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [activeSceneForCpsd, setActiveSceneForCpsd] = useState<BibleScene | null>(null);

  useEffect(() => {
    loadInitialBible();

    const handleExternalBibleUpdate = () => {
      loadInitialBible();
    };

    window.addEventListener('story_bible_updated', handleExternalBibleUpdate);
    return () => {
      window.removeEventListener('story_bible_updated', handleExternalBibleUpdate);
    };
  }, []);

  const loadInitialBible = async () => {
    const serverBible = await fetchStoryBible();
    if (serverBible && serverBible.concept) {
      setBible({
        version: serverBible.version || 1,
        updatedAt: serverBible.updatedAt || Date.now(),
        concept: serverBible.concept,
        characterProfiles: (serverBible.characterProfiles || []).map((c: any) => ({
          ...c,
          voiceId: c.voiceId || 'Kore'
        })),
        scenes: (serverBible.scenes || []).map((s: any) => ({
          ...s,
          rawProse: s.rawProse || s.scriptContent || ''
        })),
        sceneIdeaMatrix: serverBible.sceneIdeaMatrix || [],
        revisionHistory: serverBible.revisionHistory || []
      });
    }
  };

  const syncBibleUpdates = async (updates: Partial<StoryFlixBible>, actionName: string, actionDetails: string) => {
    setIsSyncing(true);
    const updatedVersion = (bible.version || 1) + 1;
    const newLog = {
      id: `rev_${Date.now()}`,
      timestamp: Date.now(),
      step: currentStep,
      action: actionName,
      details: actionDetails
    };

    const newBibleState: StoryFlixBible = {
      ...bible,
      ...updates,
      version: updatedVersion,
      updatedAt: Date.now(),
      revisionHistory: [newLog, ...(bible.revisionHistory || [])]
    };

    setBible(newBibleState);

    try {
      await updateStoryBible(updates, actionName, actionDetails);
      window.dispatchEvent(new CustomEvent('story_bible_updated', { detail: newBibleState }));
    } catch (e) {
      console.error('Failed to sync Story Bible with backend:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateConcept = async (concept: ConceptData, actionDetails: string) => {
    await syncBibleUpdates({ concept }, 'Updated Core Story Idea', actionDetails);
  };

  const handleUpdatePersonas = async (characterProfiles: CharacterPersona[], actionDetails: string) => {
    await syncBibleUpdates({ characterProfiles }, 'Updated Character Personas', actionDetails);
  };

  const handleLockSceneToBible = async (scene: BibleScene, matrixResult: SceneMatrix3x3Result) => {
    const existingScenes = bible.scenes.filter(s => s.sceneNumber !== scene.sceneNumber);
    const updatedScenes = [...existingScenes, scene].sort((a, b) => a.sceneNumber - b.sceneNumber);

    const existingMatrix = (bible.sceneIdeaMatrix || []).filter(m => m.sceneNumber !== matrixResult.sceneNumber);
    const updatedMatrix = [...existingMatrix, matrixResult].sort((a, b) => a.sceneNumber - b.sceneNumber);

    await syncBibleUpdates(
      { scenes: updatedScenes, sceneIdeaMatrix: updatedMatrix },
      `Locked Scene ${scene.sceneNumber}: ${scene.title}`,
      `Appended scene blueprint and narrative prose to CPSD Story Bible.`
    );
  };

  const handleBatchAddScenes = async (newScenes: BibleScene[]) => {
    const updatedScenes = [...bible.scenes, ...newScenes];
    await syncBibleUpdates(
      { scenes: updatedScenes },
      `Added ${newScenes.length} scenes to Story Bible`,
      `Batch updated CPSD scenes.`
    );
  };

  const handleSaveScene = async (scene: BibleScene, actionName: string, actionDetails: string) => {
    const existingScenes = bible.scenes.filter(s => s.sceneNumber !== scene.sceneNumber);
    const updatedScenes = [...existingScenes, scene].sort((a, b) => a.sceneNumber - b.sceneNumber);

    await syncBibleUpdates(
      { scenes: updatedScenes },
      actionName,
      actionDetails
    );
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(bible, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyflix_bible_v${bible.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    const md = compileCpsdMarkdown(bible);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STORYFLIX_CPSD_v${bible.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full bg-[#070b12] text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Header with 3 Step Navigation & CPSD Sync */}
      <StoryFlixHeader
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        bible={bible}
        isSyncing={isSyncing}
        onToggleViewer={() => setIsViewerOpen(!isViewerOpen)}
        onExportJson={handleExportJson}
        onExportMd={handleExportMd}
        onOpenImport={() => setIsViewerOpen(true)}
        onOpenCritique={() => setIsViewerOpen(true)}
      />

      {/* Main Step Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#080c14]">
        <div className="max-w-7xl mx-auto space-y-6">
          {currentStep === 'core_idea' && (
            <CoreIdeaStudio
              bible={bible}
              onUpdateConcept={handleUpdateConcept}
              onProceedToPersonas={() => setCurrentStep('personas')}
            />
          )}

          {currentStep === 'personas' && (
            <PersonaExtractor
              bible={bible}
              onUpdatePersonas={handleUpdatePersonas}
              onProceedToSceneMatrix={() => setCurrentStep('scene_matrix')}
            />
          )}

          {currentStep === 'scene_matrix' && (
            <SceneMatrix3x3
              bible={bible}
              onLockSceneToBible={handleLockSceneToBible}
              onBatchAddScenes={handleBatchAddScenes}
              onProceedToCpsd={() => setCurrentStep('cpsd_document')}
              onSelectSceneForCpsd={(s) => {
                setActiveSceneForCpsd(s);
                setCurrentStep('cpsd_document');
              }}
            />
          )}

          {currentStep === 'cpsd_document' && (
            <CpsdDocumentStudio
              bible={bible}
              onSaveScene={handleSaveScene}
              onPlotNextScene={() => setCurrentStep('scene_matrix')}
              onNavigateToMatrix={() => setCurrentStep('scene_matrix')}
            />
          )}
        </div>
      </main>

      {/* CPSD & Story Bible Slide-Over Inspector */}
      <CpsdStoryBibleViewer
        bible={bible}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onExportJson={handleExportJson}
        onExportMd={handleExportMd}
        onReloadBible={loadInitialBible}
      />
    </div>
  );
};
