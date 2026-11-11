/**
 * Wire image_picker settings from image_asset / feature_image_asset using
 * scripts/_shop-image-map.json so theme editor sidebar shows thumbnails.
 *
 * Run: node scripts/wire-shop-images.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MAP_PATH = path.join(__dirname, '_shop-image-map.json');

const PLATE_DEFAULTS = {
  visual_image_1: 'shopify://shop_images/plate-chicken-veggies.png',
  visual_image_2: 'shopify://shop_images/plate-chicken-potatoes.png',
  visual_image_3: 'shopify://shop_images/plate-vegetables.png',
};

function loadMap() {
  const raw = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const map = {};
  for (const [k, v] of Object.entries(raw)) {
    const base = path.basename(k.replace(/\\/g, '/'));
    if (!map[base] || !String(map[base]).includes('/')) map[base] = v;
    // Prefer clean shopify://shop_images/filename refs
    if (typeof v === 'string' && v.startsWith('shopify://shop_images/') && !v.includes('/files/')) {
      map[base] = v;
    }
  }
  // Ensure plate filenames resolve even if map keys were mangled
  for (const name of [
    'plate-chicken-veggies.png',
    'plate-chicken-potatoes.png',
    'plate-vegetables.png',
    'plate-salad.png',
  ]) {
    if (!map[name] || String(map[name]).includes('/files/')) {
      map[name] = `shopify://shop_images/${name}`;
    }
  }
  return map;
}

function refFor(asset, map) {
  if (!asset || typeof asset !== 'string') return null;
  const base = path.basename(asset.trim());
  if (map[base]) return map[base];
  if (map[asset]) return map[asset];
  // Fallback: assume uploaded under same filename
  if (/\.(jpe?g|png|gif|webp)$/i.test(base)) {
    return `shopify://shop_images/${base}`;
  }
  return null;
}

function walkSettings(settings, map, stats, ctx) {
  if (!settings || typeof settings !== 'object') return;
  const asset = settings.image_asset;
  if (asset && !settings.image) {
    const ref = refFor(asset, map);
    if (ref) {
      settings.image = ref;
      stats.wired++;
      stats.details.push(`${ctx}: image <- ${asset}`);
    } else {
      stats.missing.push(`${ctx}: image_asset=${asset}`);
    }
  }
  const fAsset = settings.feature_image_asset;
  if (fAsset && !settings.feature_image) {
    const ref = refFor(fAsset, map);
    if (ref) {
      settings.feature_image = ref;
      stats.wired++;
      stats.details.push(`${ctx}: feature_image <- ${fAsset}`);
    } else {
      stats.missing.push(`${ctx}: feature_image_asset=${fAsset}`);
    }
  }
}

function walkSection(section, map, stats, sectionId) {
  if (!section || typeof section !== 'object') return;
  walkSettings(section.settings, map, stats, sectionId);

  // Banner prep plates
  if (section.type === 'image-banner' && section.settings) {
    const s = section.settings;
    for (const [key, def] of Object.entries(PLATE_DEFAULTS)) {
      if (!s[key]) {
        s[key] = def;
        stats.wired++;
        stats.details.push(`${sectionId}: ${key} <- plate default`);
      }
    }
  }

  if (section.blocks) {
    for (const [bid, block] of Object.entries(section.blocks)) {
      walkSettings(block.settings, map, stats, `${sectionId}.${bid}`);
    }
  }
}

function processJsonFile(rel, map) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  const text = fs.readFileSync(full, 'utf8');
  const m = text.match(/^(\/\*[\s\S]*?\*\/\s*)/);
  const prefix = m ? m[1] : '';
  const jsonText = m ? text.slice(m[0].length) : text;
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    console.error('skip parse', rel, e.message);
    return null;
  }
  const stats = { wired: 0, details: [], missing: [] };
  if (data.sections) {
    for (const [sid, section] of Object.entries(data.sections)) {
      walkSection(section, map, stats, sid);
    }
  }
  if (stats.wired === 0 && stats.missing.length === 0) return stats;

  const out = prefix + JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(full, out);
  return stats;
}

function collectJsonFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectJsonFiles(full, acc);
    else if (name.endsWith('.json')) acc.push(path.relative(ROOT, full));
  }
  return acc;
}

function main() {
  const map = loadMap();
  const files = [
    ...collectJsonFiles(path.join(ROOT, 'templates')),
    ...collectJsonFiles(path.join(ROOT, 'sections')).filter((f) => f.endsWith('.json')),
  ];
  let total = 0;
  for (const rel of files.sort()) {
    const stats = processJsonFile(rel, map);
    if (!stats) continue;
    if (stats.wired || stats.missing.length) {
      console.log(rel, `wired=${stats.wired}`, stats.missing.length ? `missing=${stats.missing.length}` : '');
      for (const d of stats.details) console.log('  ', d);
      for (const m of stats.missing) console.log('  MISSING', m);
      total += stats.wired;
    }
  }
  console.log('done, total wired', total);
}

main();
