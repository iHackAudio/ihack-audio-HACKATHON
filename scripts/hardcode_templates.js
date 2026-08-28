import fs from 'fs';
import path from 'path';

// Script to read custom_director_templates.json and hardcode them into PRESET_TEMPLATES in App.tsx

const appPath = path.join(process.cwd(), 'App.tsx');
const jsonPath = path.join(process.cwd(), 'custom_director_templates.json');

export function hardcodeTemplates() {
  if (!fs.existsSync(appPath)) {
    console.error('App.tsx not found!');
    return false;
  }

  let customTemplates = [];
  if (fs.existsSync(jsonPath)) {
    try {
      customTemplates = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error('Error reading custom_director_templates.json:', e);
    }
  }

  let appContent = fs.readFileSync(appPath, 'utf8');

  // Find PRESET_TEMPLATES in App.tsx
  const presetRegex = /const PRESET_TEMPLATES = (\[[\s\S]*?\]);/;
  const match = appContent.match(presetRegex);

  if (!match) {
    console.error('PRESET_TEMPLATES array not found in App.tsx');
    return false;
  }

  let existingPresets = [];
  try {
    const presetsStr = match[1];
    existingPresets = eval(`(${presetsStr})`);
  } catch (e) {
    console.error('Error parsing PRESET_TEMPLATES in App.tsx:', e);
    return false;
  }

  let addedCount = 0;
  for (const tpl of customTemplates) {
    if (!tpl.name) continue;
    const idx = existingPresets.findIndex(p => p.name.toLowerCase() === tpl.name.toLowerCase());
    if (idx >= 0) {
      existingPresets[idx] = tpl;
    } else {
      existingPresets.push(tpl);
      addedCount++;
    }
  }

  const updatedPresetsStr = JSON.stringify(existingPresets, null, 2);
  const newAppContent = appContent.replace(
    presetRegex,
    `const PRESET_TEMPLATES = ${updatedPresetsStr};`
  );

  fs.writeFileSync(appPath, newAppContent, 'utf8');
  console.log(`Successfully hardcoded ${customTemplates.length} templates (${addedCount} new) into PRESET_TEMPLATES in App.tsx.`);
  return true;
}

if (process.argv[1] && process.argv[1].includes('hardcode_templates')) {
  hardcodeTemplates();
}
