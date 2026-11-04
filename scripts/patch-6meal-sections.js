const fs = require('fs');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//, '').trim();
}

function patch(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const header = (raw.match(/^\/\*[\s\S]*?\*\//) || [''])[0];
  const data = JSON.parse(stripComments(raw));
  const old = data.sections.mp_page || {};
  const oldSettings = old.settings || {};

  const heroSettings = {
    content_product: oldSettings.content_product || '6-meal-plan',
    plan_label: oldSettings.plan_label || '6 Meal Plan',
    heading:
      oldSettings.heading ||
      'Chef-cooked meals, delivered across Lake Country',
    text:
      oldSettings.text ||
      "Calorie counted. High protein. Low oil. Pick six meals from this week's menu and we cook and deliver them.",
    fact_1_label: oldSettings.fact_1_label || 'Price',
    fact_1_value: oldSettings.fact_1_value || 'From $00.00',
    fact_2_label: oldSettings.fact_2_label || 'Meals',
    fact_2_value: oldSettings.fact_2_value || '6 per week',
    fact_3_label: oldSettings.fact_3_label || 'Menu',
    fact_3_value: oldSettings.fact_3_value || '10+ options',
    button_label: oldSettings.button_label || 'Build my 6 meals',
    button_link: oldSettings.button_link || '/products/6-meal-plan',
    button_label_2: oldSettings.button_label_2 || "View this week's menu",
    button_link_2: oldSettings.button_link_2 || '#menu',
    hero_image_1_alt: oldSettings.hero_image_1_alt || 'Chimichurri Steak',
    hero_image_2_alt: oldSettings.hero_image_2_alt || 'Orange Basil Salmon',
    badge_value: oldSettings.badge_value || '10+',
    badge_label: oldSettings.badge_label || 'meal options',
    padding_top: 0,
    padding_bottom: 0,
  };

  const benefitsSettings = {
    content_product: oldSettings.content_product || '6-meal-plan',
    eyebrow: oldSettings.ben_eyebrow || "Hartland's #1 meal prep chef",
    line_1: oldSettings.ben_line_1 || '6 meals.',
    line_2: oldSettings.ben_line_2 || '1 week.',
    line_3: oldSettings.ben_line_3 || 'Zero stress.',
    note:
      oldSettings.ben_note ||
      'Flexible menu: choose any six from 10+ options, and change your picks each week.',
    padding_top: 0,
    padding_bottom: 0,
  };

  // Keep menu/order in mp_page; turn off built-in hero/benefits.
  const pageSettings = {
    ...oldSettings,
    show_hero: false,
    show_benefits_band: false,
  };

  // Drop area_hero / area_benefits blocks — those are real sections now.
  const blocks = { ...(old.blocks || {}) };
  delete blocks.area_hero;
  delete blocks.area_benefits;
  const block_order = (old.block_order || []).filter(
    (id) => id !== 'area_hero' && id !== 'area_benefits' && blocks[id]
  );

  data.sections = {
    mp_hero: {
      type: 'cm-mp-hero',
      settings: heroSettings,
    },
    mp_benefits: {
      type: 'cm-mp-benefits',
      blocks: {
        benefit_1: {
          type: 'benefit',
          settings: { title: '24oz', text: 'Per container' },
        },
        benefit_2: {
          type: 'benefit',
          settings: { title: '2 min', text: 'To reheat' },
        },
        benefit_3: {
          type: 'benefit',
          settings: { title: 'Fresh', text: 'Never frozen' },
        },
      },
      block_order: ['benefit_1', 'benefit_2', 'benefit_3'],
      settings: benefitsSettings,
    },
    mp_page: {
      type: 'cm-meal-plan-page',
      blocks,
      block_order,
      settings: pageSettings,
    },
  };

  data.order = ['mp_hero', 'mp_benefits', 'mp_page'];

  const out = (header ? `${header}\n` : '') + `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path, out);
  JSON.parse(stripComments(out));
  console.log('ok', path, 'order', data.order.join(' → '));
}

patch('templates/page.6-meal-plan.json');
patch('templates/product.6-meal-plan.json');
