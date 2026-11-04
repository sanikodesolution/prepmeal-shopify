const fs = require('fs');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//, '').trim();
}

const areaThali = {
  type: 'area_thali',
  settings: {
    badge: "Chef Matt's · Hartland, WI",
    heading: 'Chef-cooked meals, delivered across Lake Country.',
    intro:
      'Calorie-counted, high-protein, low-oil meals prepared in our Hartland kitchen and delivered across Lake Country.',
    stats: '45g|Protein in most meals\n40+|Years of cooking\n24oz|Generous portions',
    chips: 'Chef-cooked weekly\nNever frozen\n2-3 min to heat\nCalorie counted',
    cards:
      'Cooked by Chef Matt|Every tray is seasoned and finished by Chef Matt, who has spent four decades in professional kitchens.\nReal ingredients|Produce and proteins come in close to cook day. Nothing waits in a freezer for a menu slot, so the plate tastes like it was cooked today.',
  },
};

const thaliCards = {
  thali_card_1: {
    type: 'thali_card',
    settings: {
      title: 'Cooked by Chef Matt',
      text: 'Every tray is seasoned and finished by Chef Matt, who has spent four decades in professional kitchens.',
    },
  },
  thali_card_2: {
    type: 'thali_card',
    settings: {
      title: 'Real ingredients',
      text: 'Produce and proteins come in close to cook day. Nothing waits in a freezer for a menu slot, so the plate tastes like it was cooked today.',
    },
  },
};

function patch(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const header = (raw.match(/^\/\*[\s\S]*?\*\//) || [''])[0];
  const data = JSON.parse(stripComments(raw));
  const sec = data.sections.mp_page;
  sec.blocks = sec.blocks || {};
  sec.blocks.area_thali = areaThali;
  Object.assign(sec.blocks, thaliCards);

  const order = Array.isArray(sec.block_order) ? sec.block_order.slice() : [];
  const insertAfter = order.indexOf('area_menu');
  const extra = ['area_thali', 'thali_card_1', 'thali_card_2'].filter(
    (id) => !order.includes(id)
  );
  if (extra.length) {
    if (insertAfter >= 0) order.splice(insertAfter + 1, 0, ...extra);
    else order.push(...extra);
  }
  sec.block_order = order.filter((id) => sec.blocks[id]);
  sec.settings = sec.settings || {};
  sec.settings.thali_show = true;

  const out = (header ? `${header}\n` : '') + `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path, out);
  console.log('ok', path, 'thali in order', sec.block_order.includes('area_thali'));
}

patch('templates/page.6-meal-plan.json');
patch('templates/product.6-meal-plan.json');
