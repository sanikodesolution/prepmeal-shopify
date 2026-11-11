/**
 * Wire image_picker settings from theme assets / known defaults so the
 * theme editor sidebar shows thumbnails across all templates.
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

const SECTION_DEFAULTS = {
  'image-banner': PLATE_DEFAULTS,
  'cm-delivery-areas': {
    plate_tl: 'shopify://shop_images/cm-da-plate-tl.webp',
    plate_tr: 'shopify://shop_images/cm-da-plate-tr.webp',
    plate_bl: 'shopify://shop_images/cm-da-plate-bl.webp',
    plate_br: 'shopify://shop_images/cm-da-plate-br.webp',
  },
  'cm-mp-hero': {
    hero_image_1: 'shopify://shop_images/chimichurri-steak.jpg',
    hero_image_2: 'shopify://shop_images/orange-basil-salmon.jpg',
  },
  'cm-meal-plan-page': {
    hero_image_1: 'shopify://shop_images/chimichurri-steak.jpg',
    hero_image_2: 'shopify://shop_images/orange-basil-salmon.jpg',
    thali_image: 'shopify://shop_images/four-items-plate.webp',
    chef_image_1: 'shopify://shop_images/mp-food-0.jpg',
    chef_image_2: 'shopify://shop_images/mp-food-1.jpg',
    cta_image: 'shopify://shop_images/cm-delivery-banner.jpg',
  },
  'cm-mp-thali': {
    thali_image: 'shopify://shop_images/four-items-plate.webp',
  },
  'cm-mp-chef': {
    chef_image_1: 'shopify://shop_images/mp-food-0.jpg',
    chef_image_2: 'shopify://shop_images/mp-food-1.jpg',
  },
  'cm-mp-cta': {
    image: 'shopify://shop_images/cm-delivery-banner.jpg',
    cta_image: 'shopify://shop_images/cm-delivery-banner.jpg',
  },
  'cm-chef-story': {
    image: 'shopify://shop_images/cm-healthy-meals.jpg',
  },
};

const ALT_TO_ASSET = {
  'chimichurri steak': 'chimichurri-steak.jpg',
  'orange basil salmon': 'orange-basil-salmon.jpg',
};

function loadMap() {
  const raw = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) : {};
  const map = {};
  for (const [k, v] of Object.entries(raw)) {
    const base = path.basename(String(k).replace(/\\/g, '/'));
    if (typeof v === 'string' && v.startsWith('shopify://shop_images/') && !v.includes('/files/')) {
      map[base] = v;
    } else if (!map[base]) {
      map[base] = v;
    }
  }
  for (const name of [
    'plate-chicken-veggies.png',
    'plate-chicken-potatoes.png',
    'plate-vegetables.png',
    'plate-salad.png',
    'chimichurri-steak.jpg',
    'orange-basil-salmon.jpg',
    'four-items-plate.webp',
    'cm-da-plate-tl.webp',
    'cm-da-plate-tr.webp',
    'cm-da-plate-bl.webp',
    'cm-da-plate-br.webp',
    'cm-step-order.png',
    'cm-step-cook.png',
    'cm-step-delivery.png',
    'cm-step-heat.png',
    'cm-usp-menu.png',
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
  if (/\.(jpe?g|png|gif|webp)$/i.test(base)) return `shopify://shop_images/${base}`;
  return null;
}

function setIfEmpty(settings, key, value, stats, ctx) {
  if (!settings || !key || !value) return;
  if (settings[key]) return;
  settings[key] = value;
  stats.wired++;
  stats.details.push(`${ctx}: ${key} <- ${value.replace('shopify://shop_images/', '')}`);
}

function walkSettings(settings, map, stats, ctx) {
  if (!settings || typeof settings !== 'object') return;

  if (settings.image_asset && !settings.image) {
    const ref = refFor(settings.image_asset, map);
    if (ref) setIfEmpty(settings, 'image', ref, stats, ctx);
    else stats.missing.push(`${ctx}: image_asset=${settings.image_asset}`);
  }

  if (settings.feature_image_asset && !settings.feature_image) {
    const asset = settings.feature_image_asset;
    const ext = path.extname(asset).toLowerCase();
    let ref = null;
    if (ext === '.gif') {
      const png = asset.replace(/\.gif$/i, '.png');
      ref = refFor(png, map) || refFor(asset, map);
    } else {
      ref = refFor(asset, map);
    }
    if (ref) setIfEmpty(settings, 'feature_image', ref, stats, ctx);
    else stats.missing.push(`${ctx}: feature_image_asset=${asset}`);
  }

  // Prefer PNG still for GIFs already wired to .gif (editor thumbnail fix)
  if (settings.feature_image_asset && settings.feature_image) {
    const asset = settings.feature_image_asset;
    if (/\.gif$/i.test(asset) && /\.gif$/i.test(settings.feature_image)) {
      const png = asset.replace(/\.gif$/i, '.png');
      const ref = refFor(png, map);
      if (ref) {
        settings.feature_image = ref;
        stats.wired++;
        stats.details.push(`${ctx}: feature_image gif->png still`);
      }
    }
  }
  if (settings.image_asset && settings.image && /\.gif$/i.test(settings.image_asset) && /\.gif$/i.test(settings.image)) {
    const png = settings.image_asset.replace(/\.gif$/i, '.png');
    const ref = refFor(png, map);
    if (ref) {
      settings.image = ref;
      stats.wired++;
      stats.details.push(`${ctx}: image gif->png still`);
    }
  }

  // Alt-text heuristics for hero images
  for (const [altKey, pickerKey] of [
    ['hero_image_1_alt', 'hero_image_1'],
    ['hero_image_2_alt', 'hero_image_2'],
  ]) {
    if (!settings[pickerKey] && settings[altKey]) {
      const asset = ALT_TO_ASSET[String(settings[altKey]).trim().toLowerCase()];
      if (asset) setIfEmpty(settings, pickerKey, refFor(asset, map), stats, ctx);
    }
  }
}

function walkSection(section, map, stats, sectionId) {
  if (!section || typeof section !== 'object') return;
  walkSettings(section.settings, map, stats, sectionId);

  const defaults = SECTION_DEFAULTS[section.type];
  if (defaults && section.settings) {
    for (const [key, def] of Object.entries(defaults)) {
      setIfEmpty(section.settings, key, def, stats, sectionId);
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
  fs.writeFileSync(full, prefix + JSON.stringify(data, null, 2) + '\n');
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
  const files = collectJsonFiles(path.join(ROOT, 'templates'));
  let total = 0;
  for (const rel of files.sort()) {
    const stats = processJsonFile(rel, map);
    if (!stats) continue;
    if (stats.wired || stats.missing.length) {
      console.log(rel, `wired=${stats.wired}`, stats.missing.length ? `missing=${stats.missing.length}` : '');
      for (const d of stats.details.slice(0, 12)) console.log('  ', d);
      if (stats.details.length > 12) console.log('  ...', stats.details.length - 12, 'more');
      for (const miss of stats.missing) console.log('  MISSING', miss);
      total += stats.wired;
    }
  }
  console.log('done, total wired', total);
}

main();
