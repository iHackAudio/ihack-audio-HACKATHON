import re

with open("src/App.tsx", "r") as f:
    content = f.read()

phase4_btn = """            {/* Phase 4 Tab */}
            <div className="relative group">
              <button 
                id="tab-phase4-btn"
                onClick={() => {
                  setCurrentPipelinePhase(4);
                  setActiveTab('phase4');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-transparent transition-all duration-300
                ${activeTab === 'phase4' || (activeTab === 'pipeline' && currentPipelinePhase === 4)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors
                  ${activeTab === 'phase4' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 group-hover:bg-slate-700/80 text-emerald-500/70'}`}>
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'phase4' ? 'text-emerald-400' : 'text-emerald-500/70'}`} />
                  </div>
                  {!sidebarCollapsed && <span className="font-medium tracking-wide">Phase 4</span>}
                </div>
                {!sidebarCollapsed && (
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                  ${activeTab === 'phase4' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                    Draft
                  </div>
                )}
              </button>
            </div>"""

phase5_btn = phase4_btn + """

            {/* Phase 5 Tab */}
            <div className="relative group">
              <button 
                id="tab-phase5-btn"
                onClick={() => {
                  setCurrentPipelinePhase(5);
                  setActiveTab('phase5');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-transparent transition-all duration-300
                ${activeTab === 'phase5' || (activeTab === 'pipeline' && currentPipelinePhase === 5)
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors
                  ${activeTab === 'phase5' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/80 group-hover:bg-slate-700/80 text-indigo-500/70'}`}>
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'phase5' ? 'text-indigo-400' : 'text-indigo-500/70'}`} />
                  </div>
                  {!sidebarCollapsed && <span className="font-medium tracking-wide">Phase 5</span>}
                </div>
                {!sidebarCollapsed && (
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                  ${activeTab === 'phase5' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                    Script
                  </div>
                )}
              </button>
            </div>"""

content = content.replace(phase4_btn, phase5_btn)

with open("src/App.tsx", "w") as f:
    f.write(content)
