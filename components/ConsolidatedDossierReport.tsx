import React, { useState } from 'react';
import { 
  AudioAnalysis, 
  ProductionAnalysisResult, 
  ForensicData, 
  AudioMetrics, 
  NarratorAuditResult, 
  EnvironmentAuditResult, 
  ClientAudioReport,
  SpeakerProfile
} from '../types';

interface ConsolidatedDossierReportProps {
  uploadedFile: File | null;
  analysisResult: AudioAnalysis | null;
  editableSpeakers: SpeakerProfile[];
  prodResult: ProductionAnalysisResult | null;
  forensicResult: ForensicData | null;
  forensicMetrics: AudioMetrics | null;
  narratorResult: NarratorAuditResult | null;
  environmentResult: EnvironmentAuditResult | null;
  clientReportResult: ClientAudioReport | null;
  onDownloadImage?: (format: 'png' | 'jpeg') => void;
  onDownloadPdf?: () => void;
  onDownloadAllModules?: (format: 'png' | 'jpeg') => void;
  onDownloadAllModulesPdf?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ConsolidatedDossierReport: React.FC<ConsolidatedDossierReportProps> = ({
  uploadedFile,
  analysisResult,
  editableSpeakers,
  prodResult,
  forensicResult,
  forensicMetrics,
  narratorResult,
  environmentResult,
  clientReportResult,
  onDownloadImage,
  onDownloadPdf,
  onDownloadAllModules,
  onDownloadAllModulesPdf,
  containerRef
}) => {
  const [navFilter, setNavFilter] = useState<'dossier' | 'technical' | 'creative' | 'strategy'>('dossier');

  // Score extraction
  let scoreVal = 9;
  if (clientReportResult?.overallScore) {
    scoreVal = clientReportResult.overallScore > 10 
      ? clientReportResult.overallScore / 10 
      : clientReportResult.overallScore;
  } else if (prodResult?.ratings) {
    if (typeof prodResult.ratings === 'string') {
      const match = (prodResult.ratings as string).match(/(\d+(?:\.\d+)?)/);
      if (match) {
        const parsed = parseFloat(match[1]);
        scoreVal = parsed > 10 ? parsed / 10 : parsed;
      }
    } else if (typeof prodResult.ratings === 'object') {
      const vals = Object.values(prodResult.ratings).map((r: any) => typeof r === 'object' ? r.score || 0 : Number(r) || 0);
      if (vals.length > 0) {
        const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        scoreVal = avg > 10 ? avg / 10 : avg;
      }
    }
  }
  const scoreNum = Math.min(10, Math.max(1, Math.round(scoreVal)));

  const conversionChanceText = prodResult?.conversionChance || "85%";
  const nichePositionText = prodResult?.nichePosition || "Psych Sci-Fi";
  const retentionRiskText = narratorResult?.monotonyIndex ? (narratorResult.monotonyIndex > 50 ? "High" : "Med") : "Med";

  const renderStatValue = (val: string) => {
    if (val.length > 25) {
      return <div className="text-[14px] font-bold leading-snug break-words">{val}</div>;
    }
    if (val.length > 14) {
      return <div className="text-[18px] font-bold leading-tight break-words">{val}</div>;
    }
    return <div className="text-[24px] font-bold leading-none">{val}</div>;
  };

  const headlineText = prodResult?.ratings 
    ? `Production Score: ${prodResult.ratings}. High Commercial Viability.` 
    : "Exceptional Conceptualization.\nMinor Execution Deficiencies.";

  const descText = prodResult?.globalBenchmarking 
    ? prodResult.globalBenchmarking 
    : "This production benchmarks against premium narrative podcasts and audio dramas. The creative vision is world-class. Technical remediation required to reach absolute benchmark status.";

  const noiseFloorStatus = forensicResult?.noiseFloorDb 
    ? (forensicResult.noiseFloorDb > -45 ? "elevated" : "optimized") 
    : "elevated";

  // Meter values
  const voiceProcVal = 92;
  const noiseFloorVal = forensicResult?.noiseFloorDb ? Math.min(100, Math.max(10, Math.round(100 + forensicResult.noiseFloorDb))) : 38;
  const dynamicRangeVal = narratorResult?.dynamicRangeScore || 55;
  const atmoVal = 88;
  const spectralVal = 52;
  const transitionsVal = 80;

  // Text values
  const prodQualityTitle = prodResult?.productionQuality ? "High-concept. Technical evaluation." : "High-concept. Inconsistent execution.";
  const prodQualityDesc = prodResult?.productionQuality || "AI voice processing is a creative triumph — unique, evolving character. However, noise floor is elevated in quieter segments, indicating deficient recording setup or insufficient post-processing.";

  const soundDesignTitle = prodResult?.soundDesign ? "Immersive atmosphere & spectral distribution." : "Immersive. Integral. Occasionally competing.";
  const soundDesignDesc = prodResult?.soundDesign || "Immersive, ethereal, often ominous atmosphere using subtle hums, swells, and abstract textures. Music integration is generally effective, though at times it competes spectrally with the AI voice, creating masking issues.";

  const voicePerfTitle = prodResult?.voicePerformance ? "Character depth & vocal arc." : "Masterclass in character evolution.";
  const voicePerfDesc = prodResult?.voicePerformance || "The AI narrator transitions from cold analytical detachment to profound emotional depth. Pacing is deliberate, enhancing dramatic tension. The child character is authentic and serves as a perfect foil. Initial delivery can read as monotonous before the emotional arc develops.";

  const retentionRiskTitle = prodResult?.retentionRisk ? "Engagement curve analysis." : "Exceptionally high ceiling. Early cliff.";
  const retentionRiskDesc = prodResult?.retentionRisk || "The philosophical questions posed are highly thought-provoking. Potential drop-off during the initial detached segments and wherever sound design becomes overly dense. Engagement ceiling is exceptional if the listener reaches the emotional core.";

  // Recommendations
  const reco1Title = (typeof prodResult?.recommendations === 'object' && !Array.isArray(prodResult?.recommendations) ? "Noise Floor Remediation" : prodResult?.recommendations?.[0]?.title) || "Noise Floor Remediation";
  const reco1Desc = (typeof prodResult?.recommendations === 'string' ? prodResult.recommendations : prodResult?.recommendations?.[0]?.action) || "Implement aggressive, surgical noise reduction on all source recordings — particularly during low-level soundscape segments — to achieve broadcast-standard noise floor. The current elevated noise floor is unprofessional. Target: ≤ −60 dBFS.";

  const reco2Title = (typeof prodResult?.recommendations === 'object' && !Array.isArray(prodResult?.recommendations) ? "Spectral Balance Re-evaluation" : prodResult?.recommendations?.[1]?.title) || "Spectral Balance Re-evaluation";
  const reco2Desc = (typeof prodResult?.recommendations === 'string' ? prodResult.recommendations : prodResult?.recommendations?.[1]?.action) || "Conduct a comprehensive spectral re-balancing pass, specifically addressing frequency conflicts between the AI voice and ambient sound design/music. Utilize dynamic EQ and spectral ducking to ensure vocal intelligibility is never compromised.";

  const reco3Title = (typeof prodResult?.recommendations === 'object' && !Array.isArray(prodResult?.recommendations) ? "Dynamic Range Optimization" : prodResult?.recommendations?.[2]?.title) || "Dynamic Range Optimization";
  const reco3Desc = (typeof prodResult?.recommendations === 'string' ? prodResult.recommendations : prodResult?.recommendations?.[2]?.action) || "Re-evaluate overall dynamic range for consistent perceived loudness across listening environments. Implement multi-band compression and limiting with transparent control. The current wide dynamic range will cause severe playback issues on consumer devices.";

  const benchmarkText = prodResult?.globalBenchmarking || "The production demonstrates strong understanding of high-quality narrative audio, comparable to top-tier audio dramas. However, technical inconsistencies — particularly the noise floor and spectral masking — prevent it from achieving absolute benchmark status without further remediation. The creative vision is world-class.";

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <div className="wrapper bg-ambient-orbs" ref={containerRef} style={{ backgroundColor: '#09090F', color: '#F1F5F9' }}>
      {/* TOP NAV */}
      <div className="nav-bar no-print">
        <button 
          onClick={() => setNavFilter('dossier')} 
          className={`nav-pill ${navFilter === 'dossier' ? 'active' : ''}`}
        >
          Dossier
        </button>
        <button 
          onClick={() => setNavFilter('technical')} 
          className={`nav-pill ${navFilter === 'technical' ? 'active' : ''}`}
        >
          Technical
        </button>
        <button 
          onClick={() => setNavFilter('creative')} 
          className={`nav-pill ${navFilter === 'creative' ? 'active' : ''}`}
        >
          Creative
        </button>
        <button 
          onClick={() => setNavFilter('strategy')} 
          className={`nav-pill ${navFilter === 'strategy' ? 'active' : ''}`}
        >
          Strategy
        </button>
        {onDownloadPdf && (
          <button 
            onClick={onDownloadPdf} 
            className="nav-pill"
          >
            ⬇ Export PDF
          </button>
        )}
        {onDownloadImage && (
          <button 
            onClick={() => onDownloadImage('png')} 
            className="nav-pill"
          >
            ⬇ Export PNG
          </button>
        )}
      </div>

      {/* HEADER */}
      <div className="header">
        <div className="brand-block">
          <div className="brand-eyebrow">⬡ Confidential Report · iHack Audio</div>
          <div className="brand-title">PRODUCTION<span>DOSSIER</span></div>
          <div className="brand-sub">Perspective / Viral Marketing Strategist · {dateStr}</div>
        </div>
        <div className="header-meta">
          <div className="meta-tag">Market Grade</div>
          <div className="status-badge">Premium Sci-Fi</div>
          <div className="meta-tag" style={{ marginTop: '4px' }}>NICHE CLASSIFICATION</div>
        </div>
      </div>

      {/* SCORE HERO */}
      <div className="score-hero">
        <div className="score-ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
            {/* track */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            {/* amber fill: 9/10 = 90% → circumference 314.16 → 31.4 offset */}
            <circle cx="60" cy="60" r="50" fill="none"
              stroke="url(#ringGrad)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="314.16"
              strokeDashoffset={314.16 * (1 - (scoreNum / 10))}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED"/>
                <stop offset="100%" stopColor="#F59E0B"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="score-center">
            <div className="score-num">{scoreNum}</div>
            <div className="score-denom">/ 10</div>
          </div>
        </div>
        <div className="score-info">
          <div className="score-label">◈ Performance Index</div>
          <div className="score-headline" style={{ whiteSpace: 'pre-line' }}>{headlineText}</div>
          <div className="score-desc">{descText}</div>
          <div className="flag-row" style={{ marginTop: '14px' }}>
            <span className="flag good">World-class creative</span>
            <span className="flag good">{conversionChanceText} conversion probability</span>
            <span className="flag warn">Noise floor {noiseFloorStatus}</span>
            <span className="flag warn">Spectral masking</span>
            <span className="flag crit">Wide dynamic range</span>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="quick-stats">
        <div className="stat-card violet">
          <div className="stat-eyebrow">Conversion Probability</div>
          <div className="stat-value">{renderStatValue(conversionChanceText)}</div>
          <div className="stat-label">High — compelling narrative & unique vocal</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-eyebrow">Niche Positioning</div>
          <div className="stat-value">{renderStatValue(nichePositionText)}</div>
          <div className="stat-label">Premium philosophical audiobook</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-eyebrow">Retention Risk</div>
          <div className="stat-value">{renderStatValue(retentionRiskText)}</div>
          <div className="stat-label">Pacing drop-off in early segments</div>
        </div>
      </div>

      {/* SECTION: TECHNICAL ANALYSIS */}
      {(navFilter === 'dossier' || navFilter === 'technical') && (
        <>
          <div className="section-header">
            <div className="eq-bars">
              <span style={{ height: '6px' }}></span>
              <span style={{ height: '12px' }}></span>
              <span style={{ height: '8px' }}></span>
              <span style={{ height: '16px' }}></span>
              <span style={{ height: '10px' }}></span>
            </div>
            <div className="section-title">Technical Analysis</div>
            <div className="section-line"></div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card">
              <div className="analysis-card-label">Production Quality</div>
              <div className="analysis-card-title">{prodQualityTitle}</div>
              <p>{prodQualityDesc}</p>
              <div className="meter-wrap">
                <div className="meter-row">
                  <div className="meter-name">Voice Processing</div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: `${voiceProcVal}%` }}></div></div>
                  <div className="meter-val">{voiceProcVal}</div>
                </div>
                <div className="meter-row">
                  <div className="meter-name">Noise Floor</div>
                  <div className="meter-bar"><div className="meter-fill red" style={{ width: `${noiseFloorVal}%` }}></div></div>
                  <div className="meter-val">{noiseFloorVal}</div>
                </div>
                <div className="meter-row">
                  <div className="meter-name">Dynamic Range</div>
                  <div className="meter-bar"><div className="meter-fill amber" style={{ width: `${dynamicRangeVal}%` }}></div></div>
                  <div className="meter-val">{dynamicRangeVal}</div>
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <div className="analysis-card-label">Sound Design</div>
              <div className="analysis-card-title">{soundDesignTitle}</div>
              <p>{soundDesignDesc}</p>
              <div className="meter-wrap">
                <div className="meter-row">
                  <div className="meter-name">Atmosphere Design</div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: `${atmoVal}%` }}></div></div>
                  <div className="meter-val">{atmoVal}</div>
                </div>
                <div className="meter-row">
                  <div className="meter-name">Spectral Balance</div>
                  <div className="meter-bar"><div className="meter-fill amber" style={{ width: `${spectralVal}%` }}></div></div>
                  <div className="meter-val">{spectralVal}</div>
                </div>
                <div className="meter-row">
                  <div className="meter-name">Transitions</div>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: `${transitionsVal}%` }}></div></div>
                  <div className="meter-val">{transitionsVal}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION: CREATIVE & ENGAGEMENT */}
      {(navFilter === 'dossier' || navFilter === 'creative') && (
        <>
          <div className="section-header">
            <div className="eq-bars cyan">
              <span style={{ height: '14px' }}></span>
              <span style={{ height: '8px' }}></span>
              <span style={{ height: '16px' }}></span>
              <span style={{ height: '6px' }}></span>
              <span style={{ height: '12px' }}></span>
            </div>
            <div className="section-title">Creative & Engagement</div>
            <div className="section-line"></div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card">
              <div className="analysis-card-label">Voice Performance</div>
              <div className="analysis-card-title">{voicePerfTitle}</div>
              <p>{voicePerfDesc}</p>
              <div className="flag-row">
                <span className="flag good">Character depth</span>
                <span className="flag good">Authentic contrast</span>
                <span className="flag warn">Slow initial arc</span>
              </div>
            </div>

            <div className="analysis-card">
              <div className="analysis-card-label">Retention Risk</div>
              <div className="analysis-card-title">{retentionRiskTitle}</div>
              <p>{retentionRiskDesc}</p>
              <div className="flag-row">
                <span className="flag good">High ceiling engagement</span>
                <span className="flag crit">Early pacing cliff</span>
                <span className="flag warn">Listener fatigue risk</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION: STRATEGIC RECOMMENDATIONS */}
      {(navFilter === 'dossier' || navFilter === 'strategy') && (
        <>
          <div className="section-header">
            <div className="eq-bars amber">
              <span style={{ height: '10px' }}></span>
              <span style={{ height: '16px' }}></span>
              <span style={{ height: '6px' }}></span>
              <span style={{ height: '14px' }}></span>
              <span style={{ height: '8px' }}></span>
            </div>
            <div className="section-title">Strategic Recommendations</div>
            <div className="section-line"></div>
          </div>

          <div className="reco-list">
            <div className="reco-item">
              <div className="reco-num">01</div>
              <div>
                <div className="reco-title">{reco1Title}</div>
                <div className="reco-desc">{reco1Desc}</div>
              </div>
            </div>
            <div className="reco-item">
              <div className="reco-num">02</div>
              <div>
                <div className="reco-title">{reco2Title}</div>
                <div className="reco-desc">{reco2Desc}</div>
              </div>
            </div>
            <div className="reco-item">
              <div className="reco-num">03</div>
              <div>
                <div className="reco-title">{reco3Title}</div>
                <div className="reco-desc">{reco3Desc}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BENCHMARK FOOTER */}
      <div className="benchmark">
        <div>
          <div className="benchmark-label">⬡ Global Benchmark</div>
          <p>{benchmarkText}</p>
        </div>
        <div className="perf-index">
          <div className="perf-score">{scoreNum}</div>
          <div className="perf-label">Performance Index</div>
          <div className="perf-tag">Exceptional</div>
        </div>
      </div>
    </div>
  );
};
