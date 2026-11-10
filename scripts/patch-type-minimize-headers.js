/**
 * Split long typography setting lists into short, scannable headers.
 * Run: node scripts/patch-type-minimize-headers.js
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

function patchFile(src) {
  let changes = 0;
  let out = src;

  // Rename "X typography" -> "X type" for shorter sidebar labels (only exact typography headers)
  out = out.replace(
    /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"([^"]+) typography"\s*\}/g,
    (full, label) => {
      if (/colors?\s*&/i.test(label) || /background/i.test(label)) return full;
      changes++;
      return `{ "type": "header", "content": "${label} type" }`;
    }
  );

  // Before PREFIX_font_style (extra css block), ensure "format" header exists
  const styleRe =
    /(\{\s*"type"\s*:\s*"select"\s*,\s*"id"\s*:\s*"([a-z0-9_]*)font_style"[^}]*\})/g;
  const matches = [...out.matchAll(styleRe)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const prefix = m[2];
    const label = labelFromPrefix(prefix);
    const before = out.slice(Math.max(0, m.index - 250), m.index);
    if (before.includes(`"${label} format"`) || before.includes(' format"')) continue;
    out =
      out.slice(0, m.index) +
      `{ "type": "header", "content": "${label} format" },\n        ` +
      out.slice(m.index);
    changes++;
  }

  // Before PREFIX_max_width or PREFIX_bg_color after format fields — box header
  const boxRe =
    /(\{\s*"type"\s*:\s*"range"\s*,\s*"id"\s*:\s*"([a-z0-9_]*)max_width"[^}]*\})/g;
  const boxMatches = [...out.matchAll(boxRe)];
  for (let i = boxMatches.length - 1; i >= 0; i--) {
    const m = boxMatches[i];
    const prefix = m[2];
    const label = labelFromPrefix(prefix);
    const before = out.slice(Math.max(0, m.index - 250), m.index);
    if (before.includes(`"${label} box"`) || before.includes(' box"')) continue;
    out =
      out.slice(0, m.index) +
      `{ "type": "header", "content": "${label} box" },\n        ` +
      out.slice(m.index);
    changes++;
  }

  // Rename spacing / background mask headers to shorter labels
  out = out.replace(
    /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"([^"]+) spacing"\s*\}/g,
    (full, label) => {
      changes++;
      return `{ "type": "header", "content": "${label} space" }`;
    }
  );
  out = out.replace(
    /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"([^"]+) background"\s*\}/g,
    (full, label) => {
      if (/section|advanced|image/i.test(label)) return full;
      changes++;
      return `{ "type": "header", "content": "${label} mask" }`;
    }
  );

  return { out, changes };
}

const root = path.join(__dirname, '..');
const files = [...walk(path.join(root, 'sections')), ...walk(path.join(root, 'blocks'))];
let total = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('typography') && !src.includes('font_style')) continue;
  const { out, changes } = patchFile(src);
  if (changes > 0 && out !== src) {
    fs.writeFileSync(file, out);
    total += changes;
    console.log('patched', path.relative(root, file), changes);
  }
}
console.log('total header tweaks', total);
