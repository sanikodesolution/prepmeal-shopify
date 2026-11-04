const fs = require('fs');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//, '').trim();
}

const AREA_DEFAULTS = {
  area_hero: {
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
  },
  area_benefits: {
    type: 'area_benefits',
    settings: {
      eyebrow: "Hartland's #1 meal prep chef",
      line_1: '6 meals.',
      line_2: '1 week.',
      line_3: 'Zero stress.',
      note: 'Flexible menu: choose any six from 10+ options, and change your picks each week.',
    },
  },
  area_menu: {
    type: 'area_menu',
    settings: {
      eyebrow: 'This week at ChefMatts',
      heading: "This week's menu",
      text: 'Featured meals from the weekly rotation. Hover or tap a meal for the details.',
      button: 'Order 6 meals',
      order_title: '6 Meal Plan',
    },
  },
  area_steps: {
    type: 'area_steps',
    settings: {
      eyebrow: 'How it works',
      heading: 'Your week, sorted in three steps.',
    },
  },
  area_explore: {
    type: 'area_explore',
    settings: {
      heading: 'Explore the full menu',
    },
  },
  area_chef: {
    type: 'area_chef',
    settings: {
      eyebrow: 'The Chef Matt way',
      heading: '40 years in the kitchen. Now cooking for you.',
      text: 'Chef Matt has spent four decades cooking. Now he cooks calorie-counted, high-protein, low-oil meals for you.',
    },
  },
  area_delivery: {
    type: 'area_delivery',
    settings: {
      eyebrow: 'We deliver',
      heading: 'Fresh meals, delivered to your door.',
      text: 'We deliver across Hartland and the towns around it. Enter your postal code or town to see if we reach your door.',
    },
  },
  area_reviews: {
    type: 'area_reviews',
    settings: {
      eyebrow: 'Loved by our customers',
      heading: 'Loved by people who love good food',
    },
  },
  area_faq: {
    type: 'area_faq',
    settings: {
      eyebrow: 'Good to know',
      heading: 'Questions, answered',
    },
  },
  area_related: {
    type: 'area_related',
    settings: {
      eyebrow: 'More ways to eat well',
      heading: 'Other ways to eat well',
    },
  },
  area_cta: {
    type: 'area_cta',
    settings: {
      eyebrow: 'Ready when you are',
      heading: 'Your week just got easier.',
      text: 'Six chef-prepared meals, delivered. Choose yours and we handle the rest.',
      button_label: 'Build my 6 meal plan',
      button_link: '/products/6-meal-plan',
    },
  },
};

const AREA_ORDER = [
  'area_hero',
  'area_benefits',
  'area_menu',
  'area_explore',
  'area_chef',
  'area_steps',
  'area_delivery',
  'area_reviews',
  'area_faq',
  'area_related',
  'area_cta',
];

function patch(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const header = (raw.match(/^\/\*[\s\S]*?\*\//) || [''])[0];
  const data = JSON.parse(stripComments(raw));
  const sec = data.sections.mp_page;
  const prev = sec.blocks || {};

  // Left sidebar folders = area blocks only. Meal/menu/faq content comes from
  // the Plan product (variants + metafields), so drop clutter theme blocks.
  const next = {};
  for (const id of AREA_ORDER) {
    const existing = prev[id];
    next[id] = {
      type: AREA_DEFAULTS[id].type,
      settings: {
        ...AREA_DEFAULTS[id].settings,
        ...(existing && existing.settings ? existing.settings : {}),
      },
    };
  }

  sec.blocks = next;
  sec.block_order = AREA_ORDER.slice();
  sec.settings = sec.settings || {};
  sec.settings.show_hero = true;
  if (!sec.settings.heading) {
    sec.settings.heading = AREA_DEFAULTS.area_hero.settings.heading;
  }

  const out = (header ? `${header}\n` : '') + `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path, out);
  JSON.parse(stripComments(out));
  console.log('ok', path, 'folders', sec.block_order.join(', '));
}

patch('templates/page.6-meal-plan.json');
patch('templates/product.6-meal-plan.json');
