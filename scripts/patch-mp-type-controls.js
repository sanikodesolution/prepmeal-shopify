/**
 * Add pm-block-type-style wiring + schema to cm-mp-* sections.
 * Run: node scripts/patch-mp-type-controls.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const WEIGHT_OPTS = [
  { value: 'inherit', label: 'Theme default' },
  { value: '400', label: 'Regular 400' },
  { value: '500', label: 'Medium 500' },
  { value: '600', label: 'Semi-bold 600' },
  { value: '700', label: 'Bold 700' },
  { value: '800', label: 'Extra-bold 800' },
];

const WEIGHT_OPTS_BODY = [
  { value: 'inherit', label: 'Theme default' },
  { value: '300', label: 'Light 300' },
  { value: '400', label: 'Regular 400' },
  { value: '500', label: 'Medium 500' },
  { value: '600', label: 'Semi-bold 600' },
  { value: '700', label: 'Label 700' },
].map((o) => (o.value === 'Label 700' ? { value: '700', label: 'Bold 700' } : o));

function typeSettingsGroup(label, prefix, opts = {}) {
  const maxSize = prefix === 'heading_' ? 72 : 48;
  const items = [];
  items.push({ type: 'header', content: `${label} typography` });
  if (!opts.skipColor) {
    items.push({ type: 'color', id: `${prefix}color`, label: 'Text color' });
  }
  items.push({
    type: 'range',
    id: `${prefix}font_size`,
    min: 0,
    max: maxSize,
    step: 1,
    unit: 'px',
    label: 'Font size',
    default: 0,
    info: '0 = theme default. Custom sizes start at 14px.',
  });
  items.push({
    type: 'select',
    id: `${prefix}font_weight`,
    label: 'Font weight',
    options: opts.bodyWeight ? WEIGHT_OPTS_BODY : WEIGHT_OPTS,
    default: 'inherit',
  });
  items.push({
    type: 'range',
    id: `${prefix}letter_spacing`,
    min: -4,
    max: 12,
    step: 1,
    unit: 'px',
    label: 'Letter spacing',
    default: 0,
  });
  items.push({
    type: 'range',
    id: `${prefix}line_height`,
    min: 0,
    max: 2,
    step: 0.1,
    label: 'Line height',
    default: 0,
    info: '0 = theme default',
  });
  items.push({ type: 'header', content: `${label} spacing` });
  for (const side of ['top', 'bottom', 'left', 'right']) {
    items.push({
      type: 'range',
      id: `${prefix}padding_${side}`,
      min: 0,
      max: 80,
      step: 2,
      unit: 'px',
      label: `Padding ${side}`,
      default: 0,
    });
  }
  for (const side of ['top', 'bottom', 'left', 'right']) {
    items.push({
      type: 'range',
      id: `${prefix}margin_${side}`,
      min: 0,
      max: 80,
      step: 2,
      unit: 'px',
      label: `Margin ${side}`,
      default: 0,
    });
  }
  return items;
}

function sectionTypeSchema() {
  return [
    ...typeSettingsGroup('Eyebrow', 'eyebrow_', { skipColor: true }),
    ...typeSettingsGroup('Heading', 'heading_', { skipColor: true }),
    ...typeSettingsGroup('Body', 'body_', { bodyWeight: true }),
  ];
}

function blockTypeSchema() {
  return [
  ...typeSettingsGroup('Title', 'title_', { skipColor: true }),
  ...typeSettingsGroup('Text', 'body_', { skipColor: true, bodyWeight: true }),
  ];
}

function schemaToLiquid(items, indent = '    ') {
  return items.map((o) => indent + JSON.stringify(o)).join(',\n');
}

const CAPTURES = `
{%- liquid
  assign s = section.settings
-%}
{%- capture mp_eyebrow_style -%}
  {%- render 'pm-block-type-style', settings: s, prefix: 'eyebrow_' -%}
{%- endcapture -%}
{%- capture mp_heading_style -%}
  {%- render 'pm-block-type-style', settings: s, prefix: 'heading_' -%}
{%- endcapture -%}
{%- capture mp_body_style -%}
  {%- render 'pm-block-type-style', settings: s, prefix: 'body_' -%}
{%- endcapture -%}
`;

function insertCaptures(content) {
  if (content.includes('pm-block-type-style')) return content;
  const marker = "{% include 'cm-mp-context' %}";
  if (!content.includes(marker)) return content;
  return content.replace(marker, marker + CAPTURES);
}

function insertSectionSchema(content) {
  if (content.includes('eyebrow_font_size')) return content;
  const chunk = schemaToLiquid(sectionTypeSchema());
  const re = /(\{\s*"type":\s*"range",\s*"id":\s*"padding_bottom"[\s\S]*?"default":\s*0\s*\}\s*)\n(\s*\],)/;
  if (!re.test(content)) {
    console.warn('  schema anchor not found for section settings');
    return content;
  }
  return content.replace(re, `$1,\n${chunk}\n$2`);
}

function insertBlockSchema(content) {
  if (!content.includes('"blocks"')) return content;
  if (content.includes('"title_font_size"')) return content;
  const chunk = schemaToLiquid(blockTypeSchema(), '        ');
  const re = /("type":\s*"range",\s*"id":\s*"text_size"[\s\S]*?"default":\s*\d+\s*\}\s*)(\n\s*\]\s*\n\s*\}\s*\n\s*\])/g;
  return content.replace(re, `$1,\n${chunk}$2`);
}

const STYLE_ATTR = `{% if mp_eyebrow_style != blank %}
            style="{{ mp_eyebrow_style | strip }}"
          {% endif %}`;

const files = [
  'sections/cm-mp-hero.liquid',
  'sections/cm-mp-benefits.liquid',
  'sections/cm-mp-steps.liquid',
  'sections/cm-mp-faq.liquid',
  'sections/cm-mp-reviews.liquid',
  'sections/cm-mp-cta.liquid',
  'sections/cm-mp-chef.liquid',
  'sections/cm-mp-explore.liquid',
  'sections/cm-mp-thali.liquid',
  'sections/cm-mp-delivery.liquid',
  'sections/cm-mp-menu-grid.liquid',
  'sections/cm-mp-order.liquid',
  'sections/cm-mp-related.liquid',
];

function patchHero(c) {
  c = c.replace(
    /<p class="mph__plan">\{\{ c_plan_label/g,
    `<p class="mph__plan"\n            {% if mp_eyebrow_style != blank %}\n              style="{{ mp_eyebrow_style | strip }}"\n            {% endif %}\n          >{{ c_plan_label`
  );
  c = c.replace(
    /<h1 class="mph__title">\{\{ c_heading/g,
    `<h1 class="mph__title"\n            {% if mp_heading_style != blank %}\n              style="{{ mp_heading_style | strip }}"\n            {% endif %}\n          >{{ c_heading`
  );
  c = c.replace(
    /<p class="mph__text">\{\{ c_text/g,
    `<p class="mph__text"\n            {% if mp_body_style != blank %}\n              style="{{ mp_body_style | strip }}"\n            {% endif %}\n          >{{ c_text`
  );
  return c;
}

function patchEyebrowHeadingBody(c) {
  c = c.replace(
    /<p class="mp-eye([^"]*)">\{\{ (c_[a-z_]+) \| escape \}\}<\/p>/g,
    (m, extra, varName) =>
      `<p class="mp-eye${extra}"\n        {% if mp_eyebrow_style != blank %}\n          style="{{ mp_eyebrow_style | strip }}"\n        {% endif %}\n      >{{ ${varName} | escape }}</p>`
  );
  c = c.replace(
    /<h2 class="mealplan-h">\{\{ (c_[a-z_]+) \| escape( \| newline_to_br)? \}\}<\/h2>/g,
    (m, varName, nl) =>
      `<h2 class="mealplan-h"\n        {% if mp_heading_style != blank %}\n          style="{{ mp_heading_style | strip }}"\n        {% endif %}\n      >{{ ${varName} | escape${nl || ''} }}</h2>`
  );
  c = c.replace(
    /<p class="mealplan-p">\{\{ (c_[a-z_]+) \| escape \}\}<\/p>/g,
    (m, varName) =>
      `<p class="mealplan-p"\n        {% if mp_body_style != blank %}\n          style="{{ mp_body_style | strip }}"\n        {% endif %}\n      >{{ ${varName} | escape }}</p>`
  );
  return c;
}

function patchBenefits(c) {
  c = patchEyebrowHeadingBody(c);
  c = c.replace(
    /<h2 class="big">/,
    `<h2 class="big"\n          {% if mp_heading_style != blank %}\n            style="{{ mp_heading_style | strip }}"\n          {% endif %}\n        >`
  );
  c = c.replace(
    /<p class="ben__note">\{\{ c_ben_note/g,
    `<p class="ben__note"\n          {% if mp_body_style != blank %}\n            style="{{ mp_body_style | strip }}"\n          {% endif %}\n        >{{ c_ben_note`
  );
  if (!c.includes('ben_title_style')) {
    c = c.replace(
      /(<li class="ben__item"[^>]*>)\s*<b>/g,
      `$1\n                      {%- capture ben_title_style -%}\n                        {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}\n                      {%- endcapture -%}\n                      {%- capture ben_body_style -%}\n                        {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}\n                      {%- endcapture -%}\n                      <b`
    );
    c = c.replace(
      /<b>\{\{ block\.settings\.title/g,
      `<b\n                        {% if ben_title_style != blank %}\n                          style="{{ ben_title_style | strip }}"\n                        {% endif %}\n                      >{{ block.settings.title`
    );
    c = c.replace(
      /<span>\{\{ block\.settings\.text/g,
      `<span\n                        {% if ben_body_style != blank %}\n                          style="{{ ben_body_style | strip }}"\n                        {% endif %}\n                      >{{ block.settings.text`
    );
  }
  return c;
}

function patchStepBlocks(c) {
  c = patchEyebrowHeadingBody(c);
  if (c.includes('step_title_style')) return c;
  return c.replace(
    /(<li class="mp-gs"[^>]*block\.shopify_attributes[^>]*>)\s*<span class="mealplan-num">/g,
  `$1
                {%- capture step_title_style -%}
                  {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
                {%- endcapture -%}
                {%- capture step_body_style -%}
                  {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
                {%- endcapture -%}
                <span class="mealplan-num">`
  ).replace(
    /<h3>\{\{ block\.settings\.title/g,
    `<h3\n                  {% if step_title_style != blank %}\n                    style="{{ step_title_style | strip }}"\n                  {% endif %}\n                >{{ block.settings.title`
  ).replace(
    /<p>\{\{ block\.settings\.text/g,
    `<p\n                  {% if step_body_style != blank %}\n                    style="{{ step_body_style | strip }}"\n                  {% endif %}\n                >{{ block.settings.text`
  );
}

function patchFaqBlocks(c) {
  c = patchEyebrowHeadingBody(c);
  if (c.includes('faq_title_style')) return c;
  return c.replace(
    /(<div class="mealplan-qi"[^>]*block\.shopify_attributes[^>]*>)\s*<button/g,
    `$1
              {%- capture faq_title_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
              {%- endcapture -%}
              {%- capture faq_body_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
              {%- endcapture -%}
              <button`
  ).replace(
    /<button type="button" class="mealplan-qb"/,
    `<button type="button" class="mealplan-qb"\n                {% if faq_title_style != blank %}\n                  style="{{ faq_title_style | strip }}"\n                {% endif %}`
  ).replace(
    /<div class="mealplan-qa"[^>]*><div><p>\{\{ block\.settings\.answer/g,
    `<div class="mealplan-qa" id="mp-a-{{ section.id }}-{{ forloop.index }}"><div><p\n                  {% if faq_body_style != blank %}\n                    style="{{ faq_body_style | strip }}"\n                  {% endif %}\n                >{{ block.settings.answer`
  );
}

function patchReviewBlocks(c) {
  c = patchEyebrowHeadingBody(c);
  if (c.includes('rev_body_style')) return c;
  return c.replace(
    /(<article class="mealplan-r[^>]*block\.shopify_attributes[^>]*>)/g,
    `$1
              {%- capture rev_title_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
              {%- endcapture -%}
              {%- capture rev_body_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
              {%- endcapture -%}`
  ).replace(
    /<q>\{\{ review_text/g,
    `<q\n                  {% if rev_body_style != blank %}\n                    style="{{ rev_body_style | strip }}"\n                  {% endif %}\n                >{{ review_text`
  ).replace(
    /<small>\{\{ review_name/g,
    `<small\n                  {% if rev_title_style != blank %}\n                    style="{{ rev_title_style | strip }}"\n                  {% endif %}\n                >{{ review_name`
  );
}

function patchExplore(c) {
  if (!c.includes('mp_heading_style')) return c;
  return c.replace(
    /<h2>\{\{ c_explore_heading/g,
    `<h2\n          {% if mp_heading_style != blank %}\n            style="{{ mp_heading_style | strip }}"\n          {% endif %}\n        >{{ c_explore_heading`
  );
}

function patchMenuGrid(c) {
  return c.replace(
    /<h2>\{\{ c_menu_heading/g,
    `<h2\n          {% if mp_heading_style != blank %}\n            style="{{ mp_heading_style | strip }}"\n          {% endif %}\n        >{{ c_menu_heading`
  );
}

function patchOrder(c) {
  c = patchEyebrowHeadingBody(c);
  c = c.replace(
    /<h4 class="mealplan-h">\{\{ c_menu_heading/g,
    `<h4 class="mealplan-h"\n                {% if mp_heading_style != blank %}\n                  style="{{ mp_heading_style | strip }}"\n                {% endif %}\n              >{{ c_menu_heading`
  );
  c = c.replace(
    /<button type="button" class="mealplan-menu__title"/,
    `<button type="button" class="mealplan-menu__title"\n                  {% if mp_heading_style != blank %}\n                    style="{{ mp_heading_style | strip }}"\n                  {% endif %}"`
  );
  return c;
}

function patchThaliSection(c) {
  if (c.includes('thali_eyebrow_style:')) return c;
  return c.replace(
    '{% render \'cm-thali-story\',',
    `{% render 'cm-thali-story',
    eyebrow_style: mp_eyebrow_style,
    heading_style: mp_heading_style,
    body_style: mp_body_style,`
  );
}

function patchDeliverySection(c) {
  c = patchEyebrowHeadingBody(c);
  return c.replace(
    '{% render \'cm-delivery-area\', section: section,',
    `{% render 'cm-delivery-area', section: section, eyebrow_style: mp_eyebrow_style, heading_style: mp_heading_style, body_style: mp_body_style,`
  ).replace(
    '{% render \'cm-delivery-checker\', section: section,',
    `{% render 'cm-delivery-checker', section: section, eyebrow_style: mp_eyebrow_style, heading_style: mp_heading_style, body_style: mp_body_style,`
  );
}

const patchers = {
  'sections/cm-mp-hero.liquid': (c) => patchHero(insertCaptures(c)),
  'sections/cm-mp-benefits.liquid': (c) => patchBenefits(insertCaptures(c)),
  'sections/cm-mp-steps.liquid': (c) => patchStepBlocks(insertCaptures(c)),
  'sections/cm-mp-faq.liquid': (c) => patchFaqBlocks(insertCaptures(c)),
  'sections/cm-mp-reviews.liquid': (c) => patchReviewBlocks(insertCaptures(c)),
  'sections/cm-mp-cta.liquid': (c) => patchEyebrowHeadingBody(insertCaptures(c)),
  'sections/cm-mp-chef.liquid': (c) => patchEyebrowHeadingBody(insertCaptures(c)),
  'sections/cm-mp-explore.liquid': (c) => patchExplore(insertCaptures(c)),
  'sections/cm-mp-thali.liquid': (c) => patchThaliSection(insertCaptures(c)),
  'sections/cm-mp-delivery.liquid': (c) => patchDeliverySection(insertCaptures(c)),
  'sections/cm-mp-menu-grid.liquid': (c) => patchMenuGrid(insertCaptures(c)),
  'sections/cm-mp-order.liquid': (c) => patchOrder(insertCaptures(c)),
  'sections/cm-mp-related.liquid': (c) => patchEyebrowHeadingBody(insertCaptures(c)),
};

const changed = [];

for (const rel of files) {
  const full = path.join(ROOT, rel);
  let content = fs.readFileSync(full, 'utf8');
  if (content.includes("render 'pm-block-type-style'")) {
    console.log('skip (already wired)', rel);
    continue;
  }
  const patcher = patchers[rel] || ((x) => insertCaptures(x));
  content = patcher(content);
  content = insertSectionSchema(content);
  content = insertBlockSchema(content);
  fs.writeFileSync(full, content);
  changed.push(rel);
  console.log('patched', rel);
}

function patchSnippetDeliveryArea() {
  const rel = 'snippets/cm-delivery-area.liquid';
  const full = path.join(ROOT, rel);
  let c = fs.readFileSync(full, 'utf8');
  if (c.includes('eyebrow_style')) return;
  c = c.replace(
    /{%- if d_eyebrow != blank -%}\s*<p class="mp-eye">\{\{ d_eyebrow/g,
    `{%- if d_eyebrow != blank -%}
        <p class="mp-eye"
          {% if eyebrow_style != blank %}
            style="{{ eyebrow_style | strip }}"
          {% endif %}
        >{{ d_eyebrow`
  );
  c = c.replace(
    /<h2 class="mealplan-h mealplan-dl__title" id="mealplan-dl-h-{{ uid }}">\{\{ d_heading/g,
    `<h2 class="mealplan-h mealplan-dl__title" id="mealplan-dl-h-{{ uid }}"
        {% if heading_style != blank %}
          style="{{ heading_style | strip }}"
        {% endif %}
      >{{ d_heading`
  );
  c = c.replace(
    /<p class="mealplan-p">\{\{ d_text/g,
    `<p class="mealplan-p"
        {% if body_style != blank %}
          style="{{ body_style | strip }}"
        {% endif %}
      >{{ d_text`
  );
  fs.writeFileSync(full, c);
  changed.push(rel);
  console.log('patched', rel);
}

function patchSnippetThaliStory() {
  const rel = 'snippets/cm-thali-story.liquid';
  const full = path.join(ROOT, rel);
  let c = fs.readFileSync(full, 'utf8');
  if (c.includes('heading_style != blank')) return;
  c = c.replace(
    /<span class="cm-label gkk__badge">\{\{ gkk_badge/g,
    `<span class="cm-label gkk__badge"
          {% if eyebrow_style != blank %}
            style="{{ eyebrow_style | strip }}"
          {% endif %}
        >{{ gkk_badge`
  );
  c = c.replace(
    /<h2>\{\{ gkk_heading/g,
    `<h2
          {% if heading_style != blank %}
            style="{{ heading_style | strip }}"
          {% endif %}
        >{{ gkk_heading`
  );
  c = c.replace(
    /{%- if gkk_intro != blank -%}\s*<p>\{\{ gkk_intro/g,
    `{%- if gkk_intro != blank -%}
          <p
            {% if body_style != blank %}
              style="{{ body_style | strip }}"
            {% endif %}
          >{{ gkk_intro`
  );
  if (!c.includes('gkk_card_title_style')) {
    c = c.replace(
      /(<div class="gkk__card" \{\{ block\.shopify_attributes \}\}>)/g,
      `$1
              {%- capture gkk_card_title_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
              {%- endcapture -%}
              {%- capture gkk_card_body_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
              {%- endcapture -%}`
    );
    c = c.replace(
      /<h4>\{\{ card_title/g,
      `<h4
                {% if gkk_card_title_style != blank %}
                  style="{{ gkk_card_title_style | strip }}"
                {% endif %}
              >{{ card_title`
    );
    c = c.replace(
      /{%- if block\.settings\.text != blank -%}<p>\{\{ block\.settings\.text/g,
      `{%- if block.settings.text != blank -%}<p
                {% if gkk_card_body_style != blank %}
                  style="{{ gkk_card_body_style | strip }}"
                {% endif %}
              >{{ block.settings.text`
    );
  }
  fs.writeFileSync(full, c);
  changed.push(rel);
  console.log('patched', rel);
}

patchSnippetDeliveryArea();
patchSnippetThaliStory();

// thali + delivery block schema in section files
for (const rel of ['sections/cm-mp-thali.liquid', 'sections/cm-mp-delivery.liquid']) {
  const full = path.join(ROOT, rel);
  let content = fs.readFileSync(full, 'utf8');
  content = insertBlockSchema(content);
  fs.writeFileSync(full, content);
}

console.log('\nChanged files:\n' + changed.join('\n'));
