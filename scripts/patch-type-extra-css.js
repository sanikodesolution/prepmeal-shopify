/**
 * Insert full text CSS controls into every typography group that already has line_height.
 * Inserts after line_height (before bg_color / spacing). Skips if text_transform already present.
 *
 * Run: node scripts/patch-type-extra-css.js
 */
const fs = require('fs');
const path = require('path');

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

function extraFields(prefix) {
  const p = prefix;
  return [
    `{ "type": "select", "id": "${p}font_style", "label": "Font style", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "normal", "label": "Normal" }, { "value": "italic", "label": "Italic" }], "default": "inherit" },`,
    `{ "type": "select", "id": "${p}font_family", "label": "Font family", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "heading", "label": "Heading font" }, { "value": "body", "label": "Body font" }], "default": "inherit" },`,
    `{ "type": "range", "id": "${p}word_spacing", "min": -4, "max": 20, "step": 1, "unit": "px", "label": "Word spacing", "default": 0, "info": "0 = theme default" },`,
    `{ "type": "select", "id": "${p}text_transform", "label": "Text transform", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "none", "label": "None" }, { "value": "uppercase", "label": "Uppercase" }, { "value": "lowercase", "label": "Lowercase" }, { "value": "capitalize", "label": "Capitalize" }], "default": "inherit" },`,
    `{ "type": "select", "id": "${p}text_decoration", "label": "Text decoration", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "none", "label": "None" }, { "value": "underline", "label": "Underline" }, { "value": "line-through", "label": "Line through" }], "default": "inherit" },`,
    `{ "type": "select", "id": "${p}text_align", "label": "Text align", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "left", "label": "Left" }, { "value": "center", "label": "Center" }, { "value": "right", "label": "Right" }], "default": "inherit" },`,
    `{ "type": "range", "id": "${p}opacity", "min": 0, "max": 100, "step": 1, "unit": "%", "label": "Opacity", "default": 100, "info": "100 = fully opaque" },`,
    `{ "type": "range", "id": "${p}max_width", "min": 0, "max": 1000, "step": 10, "unit": "px", "label": "Max width", "default": 0, "info": "0 = no limit" },`,
    `{ "type": "range", "id": "${p}border_radius", "min": 0, "max": 40, "step": 2, "unit": "px", "label": "Corner radius", "default": 0 }`,
  ].join('\n        ');
}

function patchFile(src) {
  let changes = 0;
  // Compact: { "type": "range", "id": "PREFIX_line_height", ... }
  const compactRe =
    /(\{\s*"type"\s*:\s*"range"\s*,\s*"id"\s*:\s*"([a-z0-9_]*)line_height"[^}]*\})/g;
  const matches = [...src.matchAll(compactRe)];
  let out = src;

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const prefix = m[2];
    if (prefix.includes('button_')) continue;

    const before = out.slice(Math.max(0, m.index - 1600), m.index);
    const isTypeGroup =
      /typography/i.test(before) ||
      before.includes(`"${prefix}font_size"`) ||
      before.includes(`"${prefix}letter_spacing"`);
    if (!isTypeGroup) continue;

    const lhEnd = m.index + m[0].length;
    const after = out.slice(lhEnd, lhEnd + 2500);
    if (after.includes(`"${prefix}text_transform"`) || after.includes(`"${prefix}font_style"`)) {
      continue;
    }

    // Prefer insert before bg_color if present early; else right after line_height
    const insert = `,\n        ${extraFields(prefix)}`;
    out = out.slice(0, lhEnd) + insert + out.slice(lhEnd);
    changes++;
  }

  // Multiline blank-prefix line_height
  const multiRe =
    /(\{\s*\n\s*"type":\s*"range",\s*\n\s*"id":\s*"line_height",[\s\S]*?\n\s*\})/g;
  const multiMatches = [...out.matchAll(multiRe)];
  for (let i = multiMatches.length - 1; i >= 0; i--) {
    const m = multiMatches[i];
    const before = out.slice(Math.max(0, m.index - 1600), m.index);
    if (!/typography/i.test(before) && !before.includes('"font_size"')) continue;
    const lhEnd = m.index + m[0].length;
    const after = out.slice(lhEnd, lhEnd + 2500);
    if (after.includes('"text_transform"') || after.includes('"font_style"')) continue;
    // Avoid double-patching if compact already handled blank prefix somehow
    if (/^\s*,\s*\{\s*"type"\s*:\s*"select"\s*,\s*"id"\s*:\s*"font_style"/.test(after)) continue;

    const insert = `,\n        ${extraFields('')}`;
    out = out.slice(0, lhEnd) + insert + out.slice(lhEnd);
    changes++;
  }

  out = out.replace(/,\s*,/g, ',');
  return { out, changes };
}

const root = path.join(__dirname, '..');
const files = [...walk(path.join(root, 'sections')), ...walk(path.join(root, 'blocks'))];
let total = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('typography') || !src.includes('line_height')) continue;
  const { out, changes } = patchFile(src);
  if (changes > 0 && out !== src) {
    fs.writeFileSync(file, out);
    total += changes;
    console.log('patched', path.relative(root, file), changes);
  }
}
console.log('total groups patched', total);
