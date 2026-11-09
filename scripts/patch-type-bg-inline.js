/**
 * Move/add Background color + Hover bg + Background image into each typography
 * accordion (right after line_height). Keep size/position/mask/clip under the
 * "* background" header. Add missing mask blocks when needed.
 *
 * Run: node scripts/patch-type-bg-inline.js
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

function labelFromPrefix(prefix) {
  if (!prefix) return 'Text';
  return prefix
    .replace(/_$/, '')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function inlineBg(prefix) {
  const p = prefix;
  return [
    `{ "type": "color", "id": "${p}bg_color", "label": "Background color", "info": "Clear swatch to reset." }, { "type": "color", "id": "${p}hover_bg_color", "label": "Hover background color", "info": "Clear to keep default." }`,
    `{ "type": "image_picker", "id": "${p}bg_image", "label": "Background image" }`,
  ].join(',\n        ');
}

function maskBlock(prefix) {
  const p = prefix;
  const label = labelFromPrefix(p);
  return [
    `{ "type": "header", "content": "${label} background" },`,
    `{ "type": "select", "id": "${p}bg_size", "label": "Image size", "options": [`,
    `          { "value": "cover", "label": "Cover" },`,
    `          { "value": "contain", "label": "Contain" },`,
    `          { "value": "auto", "label": "Auto" }`,
    `        ], "default": "cover" },`,
    `{ "type": "select", "id": "${p}bg_position", "label": "Image position", "options": [`,
    `          { "value": "center", "label": "Center" },`,
    `          { "value": "top", "label": "Top" },`,
    `          { "value": "bottom", "label": "Bottom" },`,
    `          { "value": "left", "label": "Left" },`,
    `          { "value": "right", "label": "Right" }`,
    `        ], "default": "center" },`,
    `{ "type": "select", "id": "${p}bg_mask", "label": "Image mask", "options": [`,
    `          { "value": "none", "label": "None" },`,
    `          { "value": "fade", "label": "Fade bottom" },`,
    `          { "value": "fade_edges", "label": "Fade edges" },`,
    `          { "value": "circle", "label": "Circle" },`,
    `          { "value": "soft", "label": "Soft vignette" },`,
    `          { "value": "rounded", "label": "Rounded box" },`,
    `          { "value": "custom", "label": "Custom mask image" }`,
    `        ], "default": "none" },`,
    `{ "type": "image_picker", "id": "${p}bg_mask_image", "label": "Custom mask image", "info": "Used when Image mask = Custom." },`,
    `{ "type": "checkbox", "id": "${p}bg_clip_text", "label": "Clip background to letters", "default": false, "info": "Fills letter shapes with the background color/image." }`,
  ].join('\n        ');
}

function stripColorImage(chunk, prefix) {
  let out = chunk;
  const p = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  out = out.replace(
    new RegExp(
      `,\\s*\\{\\s*"type"\\s*:\\s*"color"\\s*,\\s*"id"\\s*:\\s*"${p}bg_color"[^}]*\\}\\s*,\\s*\\{\\s*"type"\\s*:\\s*"color"\\s*,\\s*"id"\\s*:\\s*"${p}hover_bg_color"[^}]*\\}`,
      'g'
    ),
    ''
  );
  out = out.replace(
    new RegExp(`,\\s*\\{\\s*"type"\\s*:\\s*"color"\\s*,\\s*"id"\\s*:\\s*"${p}bg_color"[^}]*\\}`, 'g'),
    ''
  );
  out = out.replace(
    new RegExp(`,\\s*\\{\\s*"type"\\s*:\\s*"color"\\s*,\\s*"id"\\s*:\\s*"${p}hover_bg_color"[^}]*\\}`, 'g'),
    ''
  );
  out = out.replace(
    new RegExp(`,\\s*\\{\\s*"type"\\s*:\\s*"image_picker"\\s*,\\s*"id"\\s*:\\s*"${p}bg_image"[^}]*\\}`, 'g'),
    ''
  );
  out = out.replace(/,\s*,/g, ',');
  return out;
}

function patchFile(src) {
  let changes = 0;
  const re = /\{\s*"type"\s*:\s*"range"\s*,\s*"id"\s*:\s*"([a-z0-9_]*)line_height"[^}]*\}/g;
  const matches = [...src.matchAll(re)];
  let out = src;

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const prefix = m[1];
    if (prefix.includes('button_')) continue;

    const before = out.slice(Math.max(0, m.index - 1600), m.index);
    const isTypeGroup =
      /typography/i.test(before) ||
      before.includes(`"${prefix}font_size"`) ||
      before.includes(`"${prefix}letter_spacing"`);
    if (!isTypeGroup) continue;

    const lhEnd = m.index + m[0].length;
    const afterAll = out.slice(lhEnd);
    const nextTypo = afterAll.search(
      /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"[^"]*typography[^"]*"\s*\}/i
    );
    const groupEnd = nextTypo >= 0 ? lhEnd + nextTypo : Math.min(out.length, lhEnd + 5500);
    let tail = out.slice(lhEnd, groupEnd);

    // Already inlined at start of tail?
    const head = tail.slice(0, 450);
    if (head.includes(`"${prefix}bg_color"`) && head.includes(`"${prefix}bg_image"`)) {
      continue;
    }

    const hasBgColor = tail.includes(`"id": "${prefix}bg_color"`) || tail.includes(`"id":"${prefix}bg_color"`);
    const hasBgImage = tail.includes(`"id": "${prefix}bg_image"`) || tail.includes(`"id":"${prefix}bg_image"`);
    const hasMask = tail.includes(`"id": "${prefix}bg_mask"`) || tail.includes(`"id":"${prefix}bg_mask"`);

    let newTail = stripColorImage(tail, prefix);

    // Insert inline essentials after line_height
    newTail = `,\n        ${inlineBg(prefix)}` + newTail;

    // If mask block missing, append after margin_right (or at end)
    if (!hasMask) {
      const mrRe = new RegExp(
        `\\{\\s*"type"\\s*:\\s*"range"\\s*,\\s*"id"\\s*:\\s*"${prefix}margin_right"[^}]*\\}`
      );
      const mr = newTail.match(mrRe);
      if (mr) {
        const at = newTail.indexOf(mr[0]) + mr[0].length;
        newTail = newTail.slice(0, at) + `,\n        ${maskBlock(prefix)}` + newTail.slice(at);
      } else {
        newTail = newTail + `,\n        ${maskBlock(prefix)}`;
      }
    }

    out = out.slice(0, lhEnd) + newTail + out.slice(groupEnd);
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
