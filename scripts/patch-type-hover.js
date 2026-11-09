/**
 * Add Hover text color + Hover background color next to every typography
 * Text color / Background color field used by pm-block-type-style.
 * Run: node scripts/patch-type-hover.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const HOVER_TEXT = (id) => {
  if (id.includes('hover')) return null;
  if (id.includes('button_') || id.includes('icon_') || id.includes('_icon')) return null;
  if (id === 'text_color') return 'text_hover_color';
  if (id === 'color') return 'hover_color';
  if (/_color$/.test(id) && !/_bg_color$/.test(id) && !/background_color$/.test(id)) {
    return id.replace(/_color$/, '_hover_color');
  }
  return null;
};

const HOVER_BG = (id) => {
  if (id.includes('hover')) return null;
  if (id.includes('button_') || id.includes('icon_')) return null;
  if (id === 'bg_color') return 'hover_bg_color';
  if (/_bg_color$/.test(id)) return id.replace(/_bg_color$/, '_hover_bg_color');
  return null;
};

function patchFile(file, src) {
  let out = src;
  let changes = 0;

  // After Text color fields
  out = out.replace(
    /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"Text color"\s*\}/g,
    (full, id) => {
      const hoverId = HOVER_TEXT(id);
      if (!hoverId) return full;
      if (out.includes(`"id": "${hoverId}"`) || full.includes(hoverId)) return full;
      // Avoid double-insert if already followed by hover
      changes++;
      return `${full}, { "type": "color", "id": "${hoverId}", "label": "Hover text color", "info": "Clear to keep default." }`;
    }
  );

  // Multiline Text color
  out = out.replace(
    /(\{\s*\n\s*"type":\s*"color",\s*\n\s*"id":\s*"([^"]+)",\s*\n\s*"label":\s*"Text color"\s*\n\s*\})/g,
    (full, _block, id) => {
      const hoverId = HOVER_TEXT(id);
      if (!hoverId || out.includes(`"id": "${hoverId}"`)) return full;
      const indent = (full.match(/\n(\s*)"type"/) || [, '          '])[1];
      changes++;
      return `${full},\n${indent.slice(0, -2)}{\n${indent}"type": "color",\n${indent}"id": "${hoverId}",\n${indent}"label": "Hover text color",\n${indent}"info": "Clear to keep default."\n${indent.slice(0, -2)}}`;
    }
  );

  // Compact Background color with clear swatch info
  out = out.replace(
    /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"Background color"\s*,\s*"info"\s*:\s*"Clear swatch to reset\."\s*\}/g,
    (full, id) => {
      const hoverId = HOVER_BG(id);
      if (!hoverId || out.includes(`"id": "${hoverId}"`)) return full;
      changes++;
      return `${full}, { "type": "color", "id": "${hoverId}", "label": "Hover background color", "info": "Clear to keep default." }`;
    }
  );

  // Multiline Background color
  out = out.replace(
    /(\{\s*\n\s*"type":\s*"color",\s*\n\s*"id":\s*"([^"]+)",\s*\n\s*"label":\s*"Background color",\s*\n\s*"info":\s*"Clear swatch to reset\."\s*\n\s*\})/g,
    (full, _block, id) => {
      const hoverId = HOVER_BG(id);
      if (!hoverId || out.includes(`"id": "${hoverId}"`)) return full;
      const indent = (full.match(/\n(\s*)"type"/) || [, '          '])[1];
      changes++;
      return `${full},\n${indent.slice(0, -2)}{\n${indent}"type": "color",\n${indent}"id": "${hoverId}",\n${indent}"label": "Hover background color",\n${indent}"info": "Clear to keep default."\n${indent.slice(0, -2)}}`;
    }
  );

  // Compact without info (some files)
  out = out.replace(
    /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"([^"]+_bg_color|bg_color)"\s*,\s*"label"\s*:\s*"Background color"\s*\}(?!\s*,\s*\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"[^"]*hover)/g,
    (full, id) => {
      const hoverId = HOVER_BG(id);
      if (!hoverId || out.includes(`"id": "${hoverId}"`)) return full;
      changes++;
      return `${full}, { "type": "color", "id": "${hoverId}", "label": "Hover background color", "info": "Clear to keep default." }`;
    }
  );

  return { out, changes };
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p, files);
    } else if (name.endsWith('.liquid')) files.push(p);
  }
  return files;
}

let total = 0;
const files = [...walk(path.join(root, 'sections')), ...walk(path.join(root, 'blocks'))];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('"Text color"') && !src.includes('"Background color"')) continue;
  const { out, changes } = patchFile(file, src);
  if (out !== src) {
    // Re-check: avoid inserting if hover already present mid-pass by re-running on cleaned
    fs.writeFileSync(file, out);
    total += changes;
    console.log('patched', path.relative(root, file), changes);
  }
}
console.log('done, inserts:', total);
