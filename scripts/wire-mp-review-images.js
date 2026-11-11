/**
 * Wire cm-mp-reviews (and related) block image pickers to mp-food-N.jpg
 * so theme editor sidebars show thumbnails.
 *
 * Run: node scripts/wire-mp-review-images.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function strip(text) {
  const m = text.match(/^(\/\*[\s\S]*?\*\/\s*)/);
  return { prefix: m ? m[1] : '', json: m ? text.slice(m[0].length) : text };
}

function collect(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collect(full, acc);
    else if (name.endsWith('.json')) acc.push(full);
  }
  return acc;
}

function foodRef(i) {
  return `shopify://shop_images/mp-food-${i % 10}.jpg`;
}

function wireFile(full) {
  const text = fs.readFileSync(full, 'utf8');
  const { prefix, json } = strip(text);
  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return 0;
  }
  if (!data.sections) return 0;
  let wired = 0;

  for (const section of Object.values(data.sections)) {
    if (!section || !section.blocks) continue;
    const type = section.type;
    let idx = 0;
    for (const block of Object.values(section.blocks)) {
      if (!block || !block.settings) continue;
      const isReview =
        block.type === 'review' ||
        (type === 'cm-mp-reviews' && block.type === 'review') ||
        (type === 'cm-gift-card-reviews' && (block.type === 'review' || block.settings.review != null));
      const isRelated = type === 'cm-mp-related' && (block.type === 'plan' || block.type === 'related' || block.settings.title != null);

      if (isReview) {
        // Wire whenever image picker is empty and show_image is not explicitly false
        const show = block.settings.show_image !== false;
        if (show && !block.settings.image) {
          block.settings.image = foodRef(idx);
          wired++;
        }
        idx++;
      } else if (isRelated && !block.settings.image) {
        block.settings.image = foodRef(idx);
        wired++;
        idx++;
      }
    }
  }

  if (wired) {
    fs.writeFileSync(full, prefix + JSON.stringify(data, null, 2) + '\n');
  }
  return wired;
}

let total = 0;
for (const full of collect(path.join(ROOT, 'templates'))) {
  const n = wireFile(full);
  if (n) {
    console.log(path.relative(ROOT, full), 'wired', n);
    total += n;
  }
}
console.log('done, total', total);
