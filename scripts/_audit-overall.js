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

const root = path.join(__dirname, '..');
const files = [...walk(path.join(root, 'sections')), ...walk(path.join(root, 'blocks'))];

const missingType = [];
const missingBg = [];
const hasBgSimple = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const t = fs.readFileSync(file, 'utf8');

  // typography groups with line_height but no text_transform nearby
  const lh = [...t.matchAll(/"id"\s*:\s*"([a-z0-9_]*)line_height"/g)];
  for (const m of lh) {
    const prefix = m[1];
    if (prefix.includes('button_')) continue;
    const after = t.slice(m.index, m.index + 3500);
    const key = `${prefix}text_transform`;
    if (!after.includes(`"${key}"`) && !after.includes(`"id": "${key}"`)) {
      // blank prefix uses text_transform
      const blankKey = prefix === '' ? 'text_transform' : key;
      if (!after.includes(`"${blankKey}"`) && !after.includes(`"id": "${blankKey}"`)) {
        missingType.push(`${rel} :: ${prefix || '(blank)'}`);
      }
    }
  }

  // section-level background_color without gradient / organized headers
  if (/"id"\s*:\s*"background_color"/.test(t) || /"id"\s*:\s*"background_image"/.test(t)) {
    const hasGradient = t.includes('"background_gradient"');
    const hasRepeat = t.includes('"background_repeat"');
    const hasSectionHeader = t.includes('"Section background"');
    if (!hasGradient || !hasRepeat || !hasSectionHeader) {
      missingBg.push({
        file: rel,
        hasGradient,
        hasRepeat,
        hasSectionHeader,
        hasBgColor: /"id"\s*:\s*"background_color"/.test(t),
        hasBgImage: /"id"\s*:\s*"background_image"/.test(t),
        usesPmStyle: t.includes('pm-section-style'),
      });
    }
  }
}

console.log('=== missing text CSS after line_height ===', missingType.length);
missingType.slice(0, 40).forEach((x) => console.log(x));
if (missingType.length > 40) console.log('...');

console.log('\n=== incomplete section background ===', missingBg.length);
missingBg.forEach((x) => console.log(JSON.stringify(x)));
