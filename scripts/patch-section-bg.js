/**
 * Expand + reorganize section background settings under short headers.
 * Run: node scripts/patch-section-bg.js
 */
const fs = require('fs');
const path = require('path');

const BG_BLOCK = `    { "type": "header", "content": "Section background" },
    { "type": "paragraph", "content": "Pick a color, gradient, and/or image. Leave blank for the theme default." },
    { "type": "color", "id": "background_color", "label": "Color" },
    { "type": "color_background", "id": "background_gradient", "label": "Gradient" },
    { "type": "image_picker", "id": "background_image", "label": "Image" },
    { "type": "header", "content": "Image layout" },
    { "type": "select", "id": "background_image_fit", "label": "Size", "options": [
      { "value": "cover", "label": "Cover" },
      { "value": "contain", "label": "Contain" },
      { "value": "auto", "label": "Original" }
    ], "default": "cover" },
    { "type": "select", "id": "background_image_position", "label": "Position", "options": [
      { "value": "center", "label": "Center" },
      { "value": "top", "label": "Top" },
      { "value": "bottom", "label": "Bottom" },
      { "value": "left", "label": "Left" },
      { "value": "right", "label": "Right" }
    ], "default": "center" },
    { "type": "select", "id": "background_repeat", "label": "Repeat", "options": [
      { "value": "no-repeat", "label": "No repeat" },
      { "value": "repeat", "label": "Repeat" },
      { "value": "repeat-x", "label": "Repeat X" },
      { "value": "repeat-y", "label": "Repeat Y" }
    ], "default": "no-repeat" },
    { "type": "select", "id": "background_attachment", "label": "Scroll", "options": [
      { "value": "scroll", "label": "Scroll with page" },
      { "value": "fixed", "label": "Fixed (parallax)" }
    ], "default": "scroll" },
    { "type": "header", "content": "Overlay" },
    { "type": "color", "id": "background_overlay_color", "label": "Color", "default": "#000000" },
    { "type": "range", "id": "background_overlay_opacity", "min": 0, "max": 80, "step": 5, "unit": "%", "label": "Strength", "default": 0 },
    { "type": "header", "content": "Advanced background" },
    { "type": "select", "id": "background_blend_mode", "label": "Blend mode", "options": [
      { "value": "normal", "label": "Normal" },
      { "value": "multiply", "label": "Multiply" },
      { "value": "screen", "label": "Screen" },
      { "value": "overlay", "label": "Overlay" },
      { "value": "soft-light", "label": "Soft light" },
      { "value": "darken", "label": "Darken" },
      { "value": "lighten", "label": "Lighten" }
    ], "default": "normal" },
    { "type": "range", "id": "background_border_radius", "min": 0, "max": 40, "step": 2, "unit": "px", "label": "Corner radius", "default": 0 },
    { "type": "range", "id": "background_min_height", "min": 0, "max": 800, "step": 10, "unit": "px", "label": "Min height", "default": 0, "info": "0 = auto" },
    { "type": "header", "content": "Text colors" },`;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
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

function patchContent(src) {
  let out = src;
  let changes = 0;

  // Replace mega "Background, colors & typography" block through overlay opacity
  // Match both multiline and compact forms ending at overlay opacity setting
  const re = /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"Background, colors & typography"\s*\}[\s\S]*?\{\s*"type"\s*:\s*"range"\s*,\s*"id"\s*:\s*"background_overlay_opacity"[\s\S]*?\},/g;

  out = out.replace(re, () => {
    changes++;
    return BG_BLOCK;
  });

  // Already patched? Skip if Section background exists
  if (changes === 0 && out.includes('"content": "Background, colors & typography"')) {
    // Try alternate: header then paragraph then fields without exact overlay shape
    const re2 =
      /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"Background, colors & typography"\s*\},?\s*(?:\{\s*"type"\s*:\s*"paragraph"[\s\S]*?\},?\s*)?\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"[\s\S]*?"id"\s*:\s*"background_overlay_opacity"[\s\S]*?\},/g;
    out = out.replace(re2, () => {
      changes++;
      return BG_BLOCK;
    });
  }

  // After Text colors header, if next is Type size missing and we have eyebrow_size soon, insert Type size before first size range after colors
  // Only when Text colors was just added and "Type size" missing nearby
  if (out.includes('"content": "Text colors"') && !out.includes('"content": "Type size"')) {
    out = out.replace(
      /(\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"Text colors"\s*\},[\s\S]{0,1200}?)(\{\s*"type"\s*:\s*"range"\s*,\s*"id"\s*:\s*"(?:eyebrow_size|heading_size|text_size)")/g,
      (full, before, rangeStart) => {
        if (before.includes('"content": "Type size"')) return full;
        changes++;
        return `${before}{ "type": "header", "content": "Type size" },\n    ${rangeStart}`;
      }
    );
  }

  return { out, changes };
}

const root = path.join(__dirname, '..');
const files = walk(path.join(root, 'sections'));
let total = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('Background, colors & typography') && !src.includes('background_overlay_opacity')) continue;
  const { out, changes } = patchContent(src);
  if (changes > 0 && out !== src) {
    fs.writeFileSync(file, out);
    total += changes;
    console.log('patched', path.relative(root, file), changes);
  }
}
console.log('total replacements', total);
