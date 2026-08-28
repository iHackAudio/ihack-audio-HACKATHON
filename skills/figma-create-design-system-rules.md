---
name: figma-create-design-system-rules
description: |
  Comprehensive Figma design system rules, design tokens, color variables, typographic hierarchy, component spacing, layout grids, and component state patterns for creating modern agentic AI web applications. Use when establishing design system guidelines, UI tokens, accessible color palettes, or component component structures for clean, high-performance web applications.
version: 1.0.0
author: Figma MCP Guide / AI Dev Studio
---

# FIGMA DESIGN SYSTEM RULES & AGENTIC UI ARCHITECTURE

This design system framework defines the visual tokens, structural guidelines, typography, layout rhythm, and component states for modern AI Agent Workspaces and Agentic Web Applications.

---

## 1. DESIGN TOKENS & COLOR PALETTE

### Semantic Color Matrix (Modern Dark / Slate Archetype)
- **Canvas Base Background (`bg-canvas`):** `#090d16` — Deep slate midnight void.
- **Surface Elevation 1 (`bg-surface`):** `#111827` — Primary panel & container fill.
- **Surface Elevation 2 (`bg-surface-hover`):** `#1f2937` — Interactive elements, elevated cards, and header bars.
- **Surface Border Accent (`border-subtle`):** `rgba(255, 255, 255, 0.08)` — Hairline structural separation without noise.
- **Brand Primary Accent (`color-brand`):** `#06b6d4` (Cyan-500) & `#0ea5e9` (Sky-500) — High contrast agentic energy.
- **Status Success (`color-success`):** `#10b981` (Emerald-500) — Synchronized, approved, active status.
- **Status Warning/Draft (`color-warning`):** `#f59e0b` (Amber-500) — Writer A / Draft in progress.
- **Typography Primary (`text-primary`):** `#f8fafc` (Slate-50) — Crisp, legible high-contrast body and titles.
- **Typography Secondary (`text-secondary`):** `#94a3b8` (Slate-400) — Contextual metadata, helper text, and secondary details.
- **Typography Muted (`text-muted`):** `#64748b` (Slate-500) — Micro labels, timestamps, deactivated controls.

---

## 2. TYPOGRAPHIC HIERARCHY & SPACING SCALE

### Font Stack
- **Sans-Serif (Primary UI):** `"Plus Jakarta Sans"`, `"Inter"`, system-ui, sans-serif.
- **Monospace (Code & AI Metrics):** `"JetBrains Mono"`, ui-monospace, monospace.

### Type Scale (1.200 Minor Third Scale)
- **Display Heading:** `24px` / `32px` line-height — Font-weight: `800` (Bold Agentic Titles)
- **Section Heading:** `18px` / `26px` line-height — Font-weight: `700` (Panel Headers & Phase Titles)
- **Sub-heading / Card Title:** `14px` / `20px` line-height — Font-weight: `600`
- **Body UI Standard:** `13px` / `20px` line-height — Font-weight: `400` / `500`
- **Micro UI / Badges:** `11px` / `16px` line-height — Font-weight: `600` / `700` uppercase with `0.05em` tracking.

### Spacing Scale (8pt Grid System)
- `xs`: 4px (tight inline gaps)
- `sm`: 8px (padding inside small buttons/badges)
- `md`: 16px (standard container padding & component gaps)
- `lg`: 24px (panel margin & section breaks)
- `xl`: 32px (major layout grid divisions)

---

## 3. LAYOUT GRID & STRUCTURAL BOUNDARIES

1. **Single Header Bar:** Unified height (48px - 56px), clean tabs with active glowing indicators, compact action buttons.
2. **Clear Phase Hierarchy:**
   - **Phase 1: Intake / Gathering**
   - **Phase 2: Story Bible**
   - **Phase 3: Scene Tournament** (Dual-Writer Parallel Pipeline & Synthesis)
   - **Phase 4: Script Optimization**
   - **AI Chat & Terminal Logs**
3. **Card & Panel Rules:**
   - Maximum 1px hairline border (`border-white/10` or `border-slate-800`).
   - Corner radius cap: `12px` for main cards, `8px` for inputs/buttons, `9999px` for badges.
   - No nested border radius clashes (`Inner Radius = Outer Radius - Padding`).
   - High visual contrast: text must pass WCAG AA (>= 4.5:1 ratio).

---

## 4. AGENTIC WORKSPACE COMPONENT STATES

- **Idle:** Subtle outline, clean muted background.
- **Processing/Thinking:** Pulse animation, animated border glow (`cyan-500/30`), status indicator badge.
- **Completed/Approved:** Emerald highlight accent, solid checkmark feedback.
- **Comparison/Diff State:** Side-by-side or clean tabbed view for dual AI outputs with active selection indicators.

---

## 5. DESIGN SYSTEM GUIDELINES FOR PHASE 3 (SCENE TOURNAMENT)

1. **Top Bar:** Concise status showing Active Scene, Scene Title, and primary pipeline controls (Run Tournament, Approve & Sync).
2. **Scene Parameters Modal / Accordion:**
   - Clean, uncluttered form grid (Scene #, Title, Location, Active Characters).
   - Clean segmented control or tabs for Scene Brief, Character Profiles, and Acoustic Staging without redundant repetitive text labels.
3. **Tournament Arena:**
   - Clear visual status for **Writer A (Visceral & Emotional)**, **Writer B (Conflict & Pacing)**, and **Writer C (Master Champion Synthesis)**.
   - Clean view switchers: **Split Comparison**, **Master Synthesis Focus**, or **Tabbed Draft Inspection**.
   - Distinct screenplay typography for script prose rendering (`JetBrains Mono` or clean serif/sans screenplay style).
