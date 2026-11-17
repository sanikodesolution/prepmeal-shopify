import fs from 'fs';
import path from 'path';

const root = path.resolve('G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify');
const f1 = fs.readFileSync(path.join(root, 'sections/ss-feature-1.liquid'), 'utf8');
const schemaMatch = f1.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
if (!schemaMatch) throw new Error('No schema in ss-feature-1');
const f1Schema = JSON.parse(schemaMatch[1]);

// Section settings: same as type1, but typography sizes default to 0 (theme inherit)
const settings = JSON.parse(JSON.stringify(f1Schema.settings));
for (const s of settings) {
  if (s.id === 'feature_heading_size' || s.id === 'feature_heading_size_mobile') {
    s.default = 0;
    s.info = '0 = theme h4. Custom sizes start at 14px.';
  }
  if (s.id === 'feature_text_size' || s.id === 'feature_text_size_mobile') {
    s.default = 0;
    s.info = '0 = theme body. Custom sizes start at 14px.';
  }
  if (s.id === 'feature_heading_color' || s.id === 'feature_text_color') {
    delete s.default;
    s.info = 'Clear to use theme color.';
  }
  if (s.id === 'feature_heading_height' || s.id === 'feature_text_height') {
    s.default = 0;
    s.min = 0;
    s.info = '0 = theme default.';
  }
  if (s.id === 'feature_icon_size') s.default = 80;
  if (s.id === 'feature_icon_size_mobile') s.default = 64;
  if (s.id === 'padding_top' || s.id === 'padding_bottom') s.default = 40;
}

// Block settings: content fields + same title_/body_ type controls as type1
const f1BlockSettings = f1Schema.blocks[0].settings;
const typeControlsStart = f1BlockSettings.findIndex((s) => s.content === 'Title type');
const typeControls = f1BlockSettings.slice(typeControlsStart);

const contentSettings = [
  { type: 'text', id: 'title', label: 'Item title text', default: 'Order Online' },
  {
    type: 'textarea',
    id: 'text',
    label: 'Item text',
    default: 'Select from our menu each week and place your order online.',
  },
  {
    type: 'image_picker',
    id: 'image',
    label: 'Icon',
    info: 'PNG/JPG/GIF. GIFs stay animated on the storefront.',
  },
  { type: 'url', id: 'feature_url', label: 'Item URL' },
  { type: 'checkbox', id: 'hide_image', default: false, label: 'Hide Image' },
];

// Adjust title/body font size info to say section / theme
const blockSettings = JSON.parse(JSON.stringify([...contentSettings, ...typeControls]));
for (const s of blockSettings) {
  if (s.id === 'title_font_size') {
    s.info = '0 = section Feature heading size (or theme h4). Custom sizes start at 14px.';
  }
  if (s.id === 'body_font_size') {
    s.info = '0 = section Feature text size (or theme body). Custom sizes start at 14px.';
  }
}

const presetsBlocks = [
  {
    type: 'feature',
    settings: {
      title: 'Order Online',
      text: 'Select from our menu each week and place your order online.',
    },
  },
  {
    type: 'feature',
    settings: {
      title: 'We Cook For You',
      text: 'Our chefs will prepare your meals made with authentic ingredients.',
    },
  },
  {
    type: 'feature',
    settings: {
      title: 'Doorstep Delivery',
      text: 'We deliver to your doorstep throughout your area.',
    },
  },
  {
    type: 'feature',
    settings: {
      title: 'Quick Heat Plans',
      text: 'Just heat up for 2-3 minutes and enjoy fresh bites.',
    },
  },
];

function itemMarkup(variant) {
  const media = `{%- unless block.settings.hide_image -%}
          {%- if block.settings.image != blank -%}
            <span class="pm-ft__media${variant === 2 ? ' pm-ft2__icon' : ''}">
              {% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}
            </span>
          {%- endif -%}
          {%- endunless -%}`;

  const titleText = `{%- if block.settings.title != blank -%}
            {%- capture feature_title_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
            {%- endcapture -%}
            <h4
              class="pm-ft__title"
              {% if feature_title_style != blank %}style="{{ feature_title_style | strip }}"{% endif %}
            >{{ block.settings.title | escape }}</h4>
          {%- endif -%}
          {%- if block.settings.text != blank -%}
            {%- capture feature_body_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
            {%- endcapture -%}
            <div
              class="pm-ft__text"
              {% if feature_body_style != blank %}style="{{ feature_body_style | strip }}"{% endif %}
            >{{ block.settings.text | escape | newline_to_br }}</div>
          {%- endif -%}`;

  if (variant === 2) {
    return `<li class="pm-ft2__card" {{ block.shopify_attributes }}>
          ${media}
          ${titleText}
        </li>`;
  }
  if (variant === 3) {
    return `<li class="pm-ft3__item" {{ block.shopify_attributes }}>
          ${media}
          <div class="pm-ft3__body">
            ${titleText}
          </div>
        </li>`;
  }
  if (variant === 4) {
    return `<li class="pm-ft4__step" {{ block.shopify_attributes }}>
          <span class="pm-ft4__num" aria-hidden="true"></span>
          ${media}
          ${titleText}
        </li>`;
  }
  return `<li class="pm-ft5__tile" {{ block.shopify_attributes }}>
          ${media}
          <div class="pm-ft5__body">
            ${titleText}
          </div>
        </li>`;
}

function listTag(variant) {
  if (variant === 4) return { open: '<ol class="pm-ft__list pm-ft4__list" role="list">', close: '</ol>' };
  if (variant === 2) return { open: '<ul class="pm-ft__list pm-ft2__grid" role="list">', close: '</ul>' };
  if (variant === 3) return { open: '<ul class="pm-ft__list pm-ft3__list" role="list">', close: '</ul>' };
  return { open: '<ul class="pm-ft__list pm-ft5__grid" role="list">', close: '</ul>' };
}

function buildSection(variant) {
  const list = listTag(variant);
  const blockName = variant === 4 ? 'Step' : variant === 5 ? 'Tile' : 'Feature';
  const maxBlocks = variant === 5 ? 4 : 8;
  const schema = {
    name: `SS Feature #${variant}`,
    tag: 'section',
    class: `feature-type${variant}`,
    max_blocks: maxBlocks,
    settings,
    blocks: [
      {
        type: 'feature',
        name: blockName,
        settings: blockSettings,
      },
    ],
    presets: [
      {
        name: `SS Feature #${variant}`,
        blocks: presetsBlocks,
      },
    ],
  };

  return `{{ 'pm-feature.css' | asset_url | stylesheet_tag }}
{% render 'pm-feature-shared-styles', section: section %}

<div
  class="section-{{ section.id }} feature-{{ section.id }} pm-ft pm-ft${variant}"
  style="background-color:{{ section.settings.background_color }}; background-image: {{ section.settings.background_gradient }}; --pm-ft-cols: {{ section.settings.feature_row }}; --pm-ft-icon: {{ section.settings.feature_icon_size }}px;"
>
  <div class="section-{{ section.id }}-settings pm-ft__wrap{% unless section.settings.full_width %} page-width{% endunless %}">
    ${list.open}
      {%- for block in section.blocks -%}
        {%- if block.settings.feature_url != blank -%}
          <a class="pm-ft__link" href="{{ block.settings.feature_url }}" {{ block.shopify_attributes }}>
        {%- endif -%}
        ${itemMarkup(variant)}
        {%- if block.settings.feature_url != blank -%}
          </a>
        {%- endif -%}
      {%- endfor -%}
    ${list.close}
  </div>
</div>

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;
}

// Fix URL wrapping - putting <a> outside <li> is invalid. Better: wrap card content or make li contain link.
// Rewrite item markup to support optional link wrapper inside li.

function itemMarkupFixed(variant) {
  const media = `{%- unless block.settings.hide_image -%}
          {%- if block.settings.image != blank -%}
            <span class="pm-ft__media${variant === 2 ? ' pm-ft2__icon' : ''}">
              {% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}
            </span>
          {%- endif -%}
          {%- endunless -%}`;

  const titleText = `{%- if block.settings.title != blank -%}
            {%- capture feature_title_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
            {%- endcapture -%}
            <h4
              class="pm-ft__title"
              {% if feature_title_style != blank %}style="{{ feature_title_style | strip }}"{% endif %}
            >{{ block.settings.title | escape }}</h4>
          {%- endif -%}
          {%- if block.settings.text != blank -%}
            {%- capture feature_body_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
            {%- endcapture -%}
            <div
              class="pm-ft__text"
              {% if feature_body_style != blank %}style="{{ feature_body_style | strip }}"{% endif %}
            >{{ block.settings.text | escape | newline_to_br }}</div>
          {%- endif -%}`;

  const openTag = `{%- if block.settings.feature_url != blank -%}
          <a class="pm-ft__hit" href="{{ block.settings.feature_url }}">
          {%- endif -%}`;
  const closeTag = `{%- if block.settings.feature_url != blank -%}
          </a>
          {%- endif -%}`;

  if (variant === 2) {
    return `<li class="pm-ft2__card" {{ block.shopify_attributes }}>
          ${openTag}
          ${media}
          ${titleText}
          ${closeTag}
        </li>`;
  }
  if (variant === 3) {
    return `<li class="pm-ft3__item" {{ block.shopify_attributes }}>
          ${openTag}
          ${media}
          <div class="pm-ft3__body">
            ${titleText}
          </div>
          ${closeTag}
        </li>`;
  }
  if (variant === 4) {
    return `<li class="pm-ft4__step" {{ block.shopify_attributes }}>
          ${openTag}
          <span class="pm-ft4__num" aria-hidden="true"></span>
          ${media}
          ${titleText}
          ${closeTag}
        </li>`;
  }
  return `<li class="pm-ft5__tile" {{ block.shopify_attributes }}>
          ${openTag}
          ${media}
          <div class="pm-ft5__body">
            ${titleText}
          </div>
          ${closeTag}
        </li>`;
}

function buildSectionFixed(variant) {
  const list = listTag(variant);
  const blockName = variant === 4 ? 'Step' : variant === 5 ? 'Tile' : 'Feature';
  const maxBlocks = variant === 5 ? 4 : 8;
  const schema = {
    name: `SS Feature #${variant}`,
    tag: 'section',
    class: `feature-type${variant}`,
    max_blocks: maxBlocks,
    settings,
    blocks: [
      {
        type: 'feature',
        name: blockName,
        settings: blockSettings,
      },
    ],
    presets: [
      {
        name: `SS Feature #${variant}`,
        blocks: presetsBlocks,
      },
    ],
  };

  return `{{ 'pm-feature.css' | asset_url | stylesheet_tag }}
{% render 'pm-feature-shared-styles', section: section %}

<div
  class="section-{{ section.id }} feature-{{ section.id }} pm-ft pm-ft${variant}"
  style="background-color:{{ section.settings.background_color }}; background-image: {{ section.settings.background_gradient }}; --pm-ft-cols: {{ section.settings.feature_row }}; --pm-ft-icon: {{ section.settings.feature_icon_size }}px;"
>
  <div class="section-{{ section.id }}-settings pm-ft__wrap{% unless section.settings.full_width %} page-width{% endunless %}">
    ${list.open}
      {%- for block in section.blocks -%}
        ${itemMarkupFixed(variant)}
      {%- endfor -%}
    ${list.close}
  </div>
</div>

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;
}

for (const v of [2, 3, 4, 5]) {
  const out = path.join(root, `sections/ss-feature-${v}.liquid`);
  fs.writeFileSync(out, buildSectionFixed(v));
  console.log('wrote', out);
}
