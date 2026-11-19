import fs from 'fs';
import path from 'path';

const root = 'G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify';
const dl = 'C:/Users/sanikodesolution/Downloads/files';

fs.copyFileSync(`${dl}/pm-feature-styles.css`, `${root}/assets/pm-feature-styles.css`);

const f1 = fs.readFileSync(`${root}/sections/ss-feature-1.liquid`, 'utf8');
const f1Schema = JSON.parse(f1.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);

// Soften typography defaults to theme inherit
const type1Settings = JSON.parse(JSON.stringify(f1Schema.settings));
for (const s of type1Settings) {
  if (['feature_heading_size', 'feature_heading_size_mobile', 'feature_text_size', 'feature_text_size_mobile'].includes(s.id)) {
    s.default = 0;
    s.info = '0 = theme default. Custom sizes start at 14px.';
  }
  if (['feature_heading_height', 'feature_text_height'].includes(s.id)) {
    s.min = 0;
    s.default = 0;
    s.info = '0 = theme default.';
  }
  if (['feature_heading_color', 'feature_text_color', 'feature_bg', 'feature_border_color', 'feature_shadow_color', 'feature_icon_color', 'background_color', 'border_color'].includes(s.id)) {
    delete s.default;
    s.info = s.info || 'Clear to use layout / theme default.';
  }
  if (s.id === 'feature_bg') {
    s.label = 'Item background color';
    s.info = 'Overrides card/item fill when set. Clear for layout default.';
  }
  if (s.type === 'header' && s.content === 'Feature wrapper colors') {
    s.content = 'Feature item colors';
  }
  if (s.id === 'feature_icon_size') s.default = 76;
  if (s.id === 'feature_icon_size_mobile') s.default = 64;
  if (s.id === 'padding_top' || s.id === 'padding_bottom') s.default = 40;
}

const typeControls = f1Schema.blocks[0].settings.filter(
  (s) =>
    (s.id && (s.id.startsWith('title_') || s.id.startsWith('body_'))) ||
    (s.type === 'header' && s.content && /Title|Body|Text mask|mask/i.test(String(s.content)))
);

const variants = [
  {
    n: 3,
    cls: 'pf-a',
    item: 'pf-a__item',
    iconExtra: 'pf-a__icon',
    bodyWrap: true,
    name: 'SS Feature #3',
    layoutName: 'Pill cards',
    defaults: { columns: 2, icon: 64, accent: '#F5A623', ink: '#111111', bg: '#f6efe8' },
    mediaWrap: false,
  },
  {
    n: 4,
    cls: 'pf-b',
    item: 'pf-b__item',
    iconExtra: 'pf-b__icon',
    bodyWrap: false,
    name: 'SS Feature #4',
    layoutName: 'Dark band',
    defaults: { columns: 4, icon: 76, accent: '#F5A623', ink: '#111111', bg: '#F5A623' },
    mediaWrap: false,
  },
  {
    n: 5,
    cls: 'pf-c',
    item: 'pf-c__item',
    iconExtra: 'pf-c__icon',
    bodyWrap: false,
    name: 'SS Feature #5',
    layoutName: 'Arch cards',
    defaults: { columns: 4, icon: 76, accent: '#F5A623', ink: '#111111', bg: '#f6efe8' },
    mediaWrap: false,
  },
  {
    n: 6,
    cls: 'pf-d',
    item: 'pf-d__item',
    iconExtra: 'pf-d__icon',
    bodyWrap: false,
    name: 'SS Feature #6',
    layoutName: 'Star badge',
    defaults: { columns: 4, icon: 84, accent: '#F5A623', ink: '#111111', bg: '#ffffff' },
    mediaWrap: true,
  },
];

function iconHtml(v) {
  const inner = `{% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}`;
  if (v.mediaWrap) {
    return `<span class="pf__icon ${v.iconExtra}"><span class="pf-d__media">${inner}</span></span>`;
  }
  return `<span class="pf__icon ${v.iconExtra}">${inner}</span>`;
}

function itemHtml(v) {
  const titleText = `{%- if block.settings.title != blank or block.settings.feature_title != blank -%}
            {%- assign item_title = block.settings.title | default: block.settings.feature_title -%}
            {%- capture feature_title_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
            {%- endcapture -%}
            <h4
              class="pf__title pm-ft__title"
              {% if feature_title_style != blank %}style="{{ feature_title_style | strip }}"{% endif %}
            >{{ item_title | escape }}</h4>
          {%- endif -%}
          {%- assign item_text = block.settings.text | default: block.settings.feature_text -%}
          {%- if item_text != blank -%}
            {%- capture feature_body_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
            {%- endcapture -%}
            <div
              class="pf__text pm-ft__text"
              {% if feature_body_style != blank %}style="{{ feature_body_style | strip }}"{% endif %}
            >{{ item_text | escape | newline_to_br }}</div>
          {%- endif -%}`;

  const media = `{%- unless block.settings.hide_image -%}
            {%- if block.settings.image != blank or block.settings.feature_image != blank -%}
              {%- assign item_image = block.settings.image | default: block.settings.feature_image -%}
              ${iconHtml(v).replace('block.settings.image', 'item_image')}
            {%- endif -%}
          {%- endunless -%}`;

  // fix iconHtml - better rewrite
  const mediaFixed = `{%- unless block.settings.hide_image -%}
            {%- if block.settings.image != blank -%}
              ${v.mediaWrap
                ? `<span class="pf__icon ${v.iconExtra}"><span class="pf-d__media">{% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}</span></span>`
                : `<span class="pf__icon ${v.iconExtra}">{% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}</span>`}
            {%- endif -%}
          {%- endunless -%}`;

  const body = v.bodyWrap
    ? `<div class="pf-a__body">
            ${titleText}
          </div>`
    : titleText;

  return `        <li class="${v.item}" {{ block.shopify_attributes }}>
          {%- if block.settings.feature_url != blank -%}
            <a class="pf__hit" href="{{ block.settings.feature_url }}">
          {%- endif -%}
          ${mediaFixed}
          ${body}
          {%- if block.settings.feature_url != blank -%}
            </a>
          {%- endif -%}
        </li>`;
}

const presetsBlocks = [
  { type: 'feature', settings: { title: 'Chef-Crafted Meals' } },
  { type: 'feature', settings: { title: 'Low-Calorie & High Protein Meals' } },
  { type: 'feature', settings: { title: 'Clean Ingredients' } },
  { type: 'feature', settings: { title: 'Delivered Fresh Weekly' } },
];

const blockSettings = [
  { type: 'image_picker', id: 'image', label: 'Icon or GIF' },
  { type: 'text', id: 'title', label: 'Item title text', default: 'Chef-Crafted Meals' },
  { type: 'textarea', id: 'text', label: 'Item text (optional)' },
  { type: 'url', id: 'feature_url', label: 'Item URL' },
  { type: 'checkbox', id: 'hide_image', default: false, label: 'Hide Image' },
  ...JSON.parse(JSON.stringify(typeControls)),
];

for (const s of blockSettings) {
  if (s.id === 'title_font_size') s.info = '0 = section Feature heading size (or theme h4).';
  if (s.id === 'body_font_size') s.info = '0 = section Feature text size (or theme body).';
}

for (const v of variants) {
  const layoutSettings = [
    { type: 'header', content: `Layout — ${v.layoutName}` },
    {
      type: 'paragraph',
      content: `Style variant for SS Feature family (matches Feature #1 customization depth).`,
    },
    {
      type: 'color',
      id: 'accent',
      label: 'Accent color',
      default: v.defaults.accent,
    },
    {
      type: 'color',
      id: 'ink',
      label: 'Line color (borders, rings, dividers)',
      default: v.defaults.ink,
    },
    {
      type: 'color',
      id: 'bg',
      label: 'Strip background color',
      default: v.defaults.bg,
      info: 'Background behind the feature items. Section background color below can layer on top if set.',
    },
  ];

  // Clone type1 and tweak feature_row default to match variant columns
  const settings = JSON.parse(JSON.stringify([...layoutSettings, ...type1Settings]));
  for (const s of settings) {
    if (s.id === 'feature_row') s.default = v.defaults.columns;
    if (s.id === 'feature_icon_size') s.default = v.defaults.icon;
  }

  const schema = {
    name: `${v.name} — ${v.layoutName}`,
    tag: 'section',
    class: `feature-type${v.n}`,
    max_blocks: 8,
    settings,
    blocks: [{ type: 'feature', name: 'Feature', settings: blockSettings }],
    presets: [
      {
        name: `${v.name} — ${v.layoutName}`,
        blocks: presetsBlocks,
      },
    ],
  };

  const liquid = `{{ 'pm-feature-styles.css' | asset_url | stylesheet_tag }}
{% render 'pm-feature-shared-styles', section: section %}

{%- liquid
  assign pf_cols = section.settings.feature_row | default: ${v.defaults.columns}
  assign pf_icon = section.settings.feature_icon_size | default: ${v.defaults.icon}
  assign pf_bg = section.settings.bg
  if section.settings.background_color != blank
    assign pf_bg = section.settings.background_color
  endif
  if pf_bg == blank
    assign pf_bg = '${v.defaults.bg}'
  endif
  assign pf_accent = section.settings.accent | default: '${v.defaults.accent}'
  assign pf_ink = section.settings.ink | default: '${v.defaults.ink}'
-%}

<div
  class="section-{{ section.id }} feature-{{ section.id }} pf ${v.cls}"
  style="
    background-color:{{ section.settings.background_color }};
    background-image: {{ section.settings.background_gradient }};
    --pf-cols: {{ pf_cols }};
    --pf-icon: {{ pf_icon }}px;
    --pf-accent: {{ pf_accent }};
    --pf-ink: {{ pf_ink }};
    --pf-bg: {{ pf_bg }};
    --pf-pt: {{ section.settings.padding_top }}px;
    --pf-pb: {{ section.settings.padding_bottom }}px;
  "
>
  <div class="section-{{ section.id }}-settings pf__wrap{% unless section.settings.full_width %} page-width{% endunless %}">
    <ul class="pf__list" role="list">
      {%- for block in section.blocks -%}
${itemHtml(v)}
      {%- endfor -%}
    </ul>
  </div>
</div>

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;

  fs.writeFileSync(`${root}/sections/ss-feature-${v.n}.liquid`, liquid);
  console.log('wrote', `ss-feature-${v.n}.liquid`, v.layoutName);
}

// Extend shared styles for pf items
let shared = fs.readFileSync(`${root}/snippets/pm-feature-shared-styles.liquid`, 'utf8');
if (!shared.includes('.pf-a__item')) {
  shared = shared.replace(
    `.feature-{{ section.id }} .pm-fx2__card,
  .feature-{{ section.id }} .pm-ft4__step,`,
    `.feature-{{ section.id }} .pm-fx2__card,
  .feature-{{ section.id }} .pf-a__item,
  .feature-{{ section.id }} .pf-b__item,
  .feature-{{ section.id }} .pf-c__item,
  .feature-{{ section.id }} .pf-d__item,
  .feature-{{ section.id }} .pm-ft4__step,`
  );
  shared = shared.replace(
    `.feature-{{ section.id }} .pm-fx2__card,
  .feature-{{ section.id }} .pm-ft5__tile {`,
    `.feature-{{ section.id }} .pm-fx2__card,
  .feature-{{ section.id }} .pf-a__item,
  .feature-{{ section.id }} .pf-c__item,
  .feature-{{ section.id }} .pm-ft5__tile {`
  );
  shared = shared.replace(
    `.feature-{{ section.id }} .pm-fx2__card,
    .feature-{{ section.id }} .pm-ft4__step,
    .feature-{{ section.id }} .pm-ft5__tile,
    .feature-{{ section.id }} .pm-jny__item {`,
    `.feature-{{ section.id }} .pm-fx2__card,
    .feature-{{ section.id }} .pf-a__item,
    .feature-{{ section.id }} .pf-c__item,
    .feature-{{ section.id }} .pm-ft4__step,
    .feature-{{ section.id }} .pm-ft5__tile,
    .feature-{{ section.id }} .pm-jny__item {`
  );
  fs.writeFileSync(`${root}/snippets/pm-feature-shared-styles.liquid`, shared);
  console.log('patched shared styles for pf items');
}

// Add hit link CSS
let css = fs.readFileSync(`${root}/assets/pm-feature-styles.css`, 'utf8');
if (!css.includes('.pf__hit')) {
  css += `

.pf__hit{display:contents;color:inherit;text-decoration:none}
.pf .page-width{max-width:var(--page-width,1200px);margin-inline:auto}
`;
  fs.writeFileSync(`${root}/assets/pm-feature-styles.css`, css);
}

console.log('done');
