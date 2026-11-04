const fs = require('fs');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//, '').trim();
}

function patch(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const header = (raw.match(/^\/\*[\s\S]*?\*\//) || [''])[0];
  const data = JSON.parse(stripComments(raw));
  const sec = data.sections.mp_page;
  const blocks = sec.blocks || {};

  for (const k of Object.keys(blocks)) {
    if (/^meal_\d+$/.test(k)) delete blocks[k];
  }

  const areaHero = {
    type: 'area_hero',
    settings: {
      plan_label: '6 Meal Plan',
      heading: 'Chef-cooked meals, delivered across Lake Country',
      text: "Calorie counted. High protein. Low oil. Pick six meals from this week's menu and we cook and deliver them.",
      fact_1_label: 'Price',
      fact_1_value: 'From $00.00',
      fact_2_label: 'Meals',
      fact_2_value: '6 per week',
      fact_3_label: 'Menu',
      fact_3_value: '10+ options',
      button_label: 'Build my 6 meals',
      button_label_2: "View this week's menu",
      badge_value: '10+',
      badge_label: 'meal options',
    },
  };

  const areaBenefits = {
    type: 'area_benefits',
    settings: {
      eyebrow: "Hartland's #1 meal prep chef",
      line_1: '6 meals.',
      line_2: '1 week.',
      line_3: 'Zero stress.',
      note: 'Flexible menu: choose any six from 10+ options, and change your picks each week.',
    },
  };

  const ordered = {
    area_hero: areaHero,
    area_benefits: areaBenefits,
  };
  for (const [k, v] of Object.entries(blocks)) {
    if (k === 'area_hero' || k === 'area_benefits') continue;
    ordered[k] = v;
  }
  sec.blocks = ordered;
  sec.settings = sec.settings || {};
  sec.settings.show_hero = true;
  sec.settings.heading = 'Chef-cooked meals, delivered across Lake Country';

  // Shopify only shows / selects blocks listed in block_order.
  const areaIds = [
    'area_hero',
    'area_benefits',
    'area_menu',
    'area_chef',
    'area_delivery',
    'area_reviews',
    'area_faq',
    'area_cta',
  ];
  const prevOrder = Array.isArray(sec.block_order) ? sec.block_order : [];
  const rest = prevOrder.filter(
    (id) => sec.blocks[id] && !areaIds.includes(id) && !/^meal_\d+$/.test(id)
  );
  const missing = Object.keys(sec.blocks).filter(
    (id) => !areaIds.includes(id) && !rest.includes(id)
  );
  sec.block_order = [
    ...areaIds.filter((id) => sec.blocks[id]),
    ...rest,
    ...missing,
  ];

  const out = (header ? `${header}\n` : '') + `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path, out);
  JSON.parse(stripComments(out));
  console.log(
    'ok',
    path,
    'blocks',
    Object.keys(sec.blocks).length,
    'order',
    sec.block_order.slice(0, 10).join(',')
  );
}

patch('templates/page.6-meal-plan.json');
patch('templates/product.6-meal-plan.json');
