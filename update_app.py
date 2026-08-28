import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add phase5 to tabs
content = content.replace("['pipeline', 'phase1', 'phase2', 'phase3', 'phase4']", "['pipeline', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5']")

phase4_tab = """
    phase4: { 
      name: 'Phase 4: Scene Draft', 
      desc: 'CPSD scene execution',
      icon: FileText,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      activeBg: 'bg-emerald-500/30'
    },"""

phase5_tab = """
    phase4: { 
      name: 'Phase 4: Scene Draft', 
      desc: 'CPSD scene execution',
      icon: FileText,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      activeBg: 'bg-emerald-500/30'
    },
    phase5: {
      name: 'Phase 5: Cinematic Script',
      desc: '3-Agent Method Audio Scripting',
      icon: FileText,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/20',
      activeBg: 'bg-indigo-500/30'
    },"""
content = content.replace(phase4_tab, phase5_tab)

with open("src/App.tsx", "w") as f:
    f.write(content)
