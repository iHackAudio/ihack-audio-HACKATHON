import re

with open("src/components/SimplifiedPipelineDemo.tsx", "r") as f:
    content = f.read()

# Add phase 5 logic
content = content.replace("['pipeline', 'phase1', 'phase2', 'phase3', 'phase4']", "['pipeline', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5']")

if "activePhase === 4 && <ScriptOptimizationPanel" in content:
    print("Found Phase 4 block")

phase4_block = """{activePhase === 4 && <ScriptOptimizationPanel bible={bible} setBible={setBible} sceneMatrixResult={sceneMatrixResult} onAgentAction={handleAgentAction} />}"""
phase5_block = phase4_block + """
        {activePhase === 5 && <Phase5CinematicScriptPanel bible={bible} setBible={setBible} sceneMatrixResult={sceneMatrixResult} onAgentAction={handleAgentAction} />}"""

content = content.replace(phase4_block, phase5_block)

# We also need to import Phase5CinematicScriptPanel
if "import Phase5CinematicScriptPanel" not in content:
    content = content.replace("import ScriptOptimizationPanel", "import ScriptOptimizationPanel from './ScriptOptimizationPanel';\nimport Phase5CinematicScriptPanel")

with open("src/components/SimplifiedPipelineDemo.tsx", "w") as f:
    f.write(content)
