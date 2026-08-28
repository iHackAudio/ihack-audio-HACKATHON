---
name: pdf-image-export-design
description: Guidelines for fixing PDF and Image export issues (using html-to-image and jsPDF) and core UI design formulas.
---

# PDF & Image Export Troubleshooting

When generating images or PDFs from DOM elements (e.g., using `html2canvas` or `html-to-image`), modern CSS and SVG structures often cause silent failures, zero-dimension errors, or blank outputs. Follow these core rules to fix them:

## 1. Prefer `html-to-image` over `html2canvas`
`html2canvas` often chokes on `backdrop-filter`, `mix-blend-mode`, and complex SVG filters, resulting in `createPattern` zero-dimension canvas errors. 
Use `html-to-image` (`toPng`, `toJpeg`) instead for modern React/Tailwind applications.

## 2. Explicit SVG Sizing (Crucial)
Export libraries ignore CSS-based sizing (`className="w-10 h-10"`) for SVGs during the clone phase.
**Always provide explicit HTML `width` and `height` attributes** to `<svg>` elements.
```tsx
{/* BAD: html-to-image might render this as 0x0 */}
<svg className="w-[120px] h-[120px] -rotate-90" viewBox="0 0 120 120">

{/* GOOD: Explicit HTML attributes */}
<svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
```

## 3. The `html-to-image` + `jsPDF` Formula
Use this standard configuration to generate high-resolution PDFs from the DOM while excluding `.no-print` elements:

```typescript
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

const htmlToImageOptions = {
  backgroundColor: '#09090F',
  pixelRatio: 1.5, // Balances quality and file size/memory limits
  filter: (node: HTMLElement) => {
    // Exclude UI controls and hidden elements
    if (node.classList?.contains('no-print')) return false;
    return true;
  },
  style: {
    transform: 'scale(1)',
  },
};

const handleDownloadPdf = async (containerRef) => {
  if (!containerRef.current) return;
  
  // 1. Generate image using html-to-image
  const dataUrl = await toJpeg(containerRef.current, { ...htmlToImageOptions, quality: 0.95 });
  
  // 2. Wait for image to load to extract natural dimensions
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => { img.onload = resolve; });
  
  // 3. Adjust for pixelRatio to get the PDF dimensions right
  const width = img.width / htmlToImageOptions.pixelRatio;
  const height = img.height / htmlToImageOptions.pixelRatio;
  
  // 4. Generate PDF matching the exact aspect ratio
  const pdf = new jsPDF({ 
    orientation: width > height ? 'landscape' : 'portrait', 
    unit: 'px', 
    format: [width, height] 
  });
  
  pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
  pdf.save(`REPORT-NAME.pdf`);
};
```

# Core Design Formulas

To ensure sophisticated, high-quality UIs without falling into "AI Slop" cliches:

## 1. Nested Border Radius Rule (The Math)
When placing a rounded container inside another rounded container, the inner radius must be mathematically derived to prevent optical tension.
**Formula:** `Inner Radius = Outer Radius - Distance Between The Two (Padding)`
*Example:* A card with `rounded-2xl` (16px) and `p-4` (16px) cannot have a child with `rounded-2xl` or it will look disconnected. The child should have `rounded-none` or be adjusted accordingly.

## 2. Padding Math & Hierarchy
- Container outer padding must **always** equal or exceed the inner padding between its child elements.
- Minimum container padding is `16px`.
- Button horizontal padding must be exactly **2x** vertical padding (e.g., `px-4 py-2`).

## 3. Contrast & Legibility Limits
- **Background vs Container:** The brightness difference between a background and a container sitting on it must be ≤12% (dark mode) and ≤7% (light mode).
- **Legibility:** Never put gray text on a colored background. Always pass WCAG AA (4.5:1 for body text).

## 4. Typography Baseline
- Minimum body size is `16px`.
- Line height must be `1.5–1.7`.
- Line widths must be constrained to `65–75` characters (use `max-w-prose` or `max-w-[70ch]`).
- Labels inside controls (buttons, pills, tabs) must sit on **ONE line** (`whitespace-nowrap`).
