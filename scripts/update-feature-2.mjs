import fs from 'fs';

const root = 'G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify';
const neu = fs.readFileSync('C:/Users/sanikodesolution/Downloads/feature-type2.liquid', 'utf8');
const css = fs.readFileSync('C:/Users/sanikodesolution/Downloads/pm-feature-type2.css', 'utf8');
const cur = fs.readFileSync(`${root}/sections/ss-feature-2.liquid`, 'utf8');

fs.writeFileSync(`${root}/assets/pm-feature-type2.css`, css);

const curSchema = JSON.parse(cur.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);
const neuSchema = JSON.parse(neu.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);

const layoutSettings = [
  { type: 'header', content: 'Sticker card layout' },
  ...neuSchema.settings.filter((s) =>
    ['accent', 'card_bg', 'show_numbers', 'show_connector'].includes(s.id)
  ),
];

// Prefer type1 feature_row / feature_icon_size / padding over neu columns/icon_size/padding
const settings = [...layoutSettings, ...curSchema.settings];

// Ensure feature_bg label stays as item background; also sync card_bg default usage in liquid
for (const s of settings) {
  if (s.id === 'feature_bg') {
    s.label = 'Item background color';
    s.info = 'Overrides card background when set. Clear to use Card background below/layout default.';
  }
  if (s.id === 'card_bg') {
    s.info = 'Used when Item background color is cleared.';
  }
}

const typeControls = curSchema.blocks[0].settings.filter(
  (s) =>
    (s.id && (s.id.startsWith('title_') || s.id.startsWith('body_'))) ||
    (s.type === 'header' &&
      s.content &&
      /Title|Body|Text mask|mask/i.test(String(s.content)))
);

const blockSettings = [
  { type: 'image_picker', id: 'image', label: 'Icon or GIF' },
  { type: 'text', id: 'title', label: 'Title', default: 'Order Online' },
  {
    type: 'textarea',
    id: 'text',
    label: 'Text',
    default: 'Select from our menu each week and place your order online.',
  },
  { type: 'url', id: 'feature_url', label: 'Item URL' },
  { type: 'checkbox', id: 'hide_image', default: false, label: 'Hide Image' },
  ...typeControls,
];

const schema = {
  name: 'SS Feature #2',
  tag: 'section',
  class: 'feature-type2',
  max_blocks: 8,
  settings,
  blocks: [{ type: 'feature', name: 'Feature', settings: blockSettings }],
  presets: [
    {
      name: 'SS Feature #2',
      blocks: neuSchema.presets[0].blocks,
    },
  ],
};

const item = `        <li class="pm-fx2__card" {{ block.shopify_attributes }}>
          {%- if block.settings.feature_url != blank -%}
            <a class="pm-fx2__hit" href="{{ block.settings.feature_url }}">
          {%- endif -%}
          {%- unless block.settings.hide_image -%}
            {%- if block.settings.image != blank -%}
              <span class="pm-fx2__icon">
                {% render 'pm-feature-media', image: block.settings.image, lazy: section.settings.lazy %}
              </span>
            {%- endif -%}
          {%- endunless -%}
          {%- if block.settings.title != blank -%}
            {%- capture feature_title_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
            {%- endcapture -%}
            <h4
              class="pm-fx2__title pm-ft__title"
              {% if feature_title_style != blank %}style="{{ feature_title_style | strip }}"{% endif %}
            >{{ block.settings.title | escape }}</h4>
          {%- endif -%}
          {%- if block.settings.text != blank -%}
            {%- capture feature_body_style -%}
              {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
            {%- endcapture -%}
            <div
              class="pm-fx2__text pm-ft__text"
              {% if feature_body_style != blank %}style="{{ feature_body_style | strip }}"{% endif %}
            >{{ block.settings.text | escape | newline_to_br }}</div>
          {%- endif -%}
          {%- if block.settings.feature_url != blank -%}
            </a>
          {%- endif -%}
        </li>`;

let body = `{{ 'pm-feature-type2.css' | asset_url | stylesheet_tag }}
{% render 'pm-feature-shared-styles', section: section %}

{%- liquid
  assign fx2_cols = section.settings.feature_row | default: section.settings.columns | default: 4
  assign fx2_icon = section.settings.feature_icon_size | default: section.settings.icon_size | default: 80
  assign fx2_card = section.settings.feature_bg | default: section.settings.card_bg
  assign show_line = false
  if section.settings.show_connector and section.blocks.size <= fx2_cols and section.blocks.size > 1
    assign show_line = true
  endif
-%}

<div
  class="section-{{ section.id }} feature-{{ section.id }} pm-fx2{% if show_line %} pm-fx2--line{% endif %}{% if section.settings.show_numbers %} pm-fx2--numbers{% endif %}"
  style="
    background-color:{{ section.settings.background_color }};
    background-image: {{ section.settings.background_gradient }};
    --fx2-cols: {{ fx2_cols }};
    --fx2-icon: {{ fx2_icon }}px;
    --fx2-pt: {{ section.settings.padding_top }}px;
    --fx2-pb: {{ section.settings.padding_bottom }}px;
    --fx2-accent: {{ section.settings.accent }};
    --fx2-card: {{ fx2_card }};
  "
>
  <div class="section-{{ section.id }}-settings pm-fx2__wrap{% unless section.settings.full_width %} page-width{% endunless %}">
    <ul class="pm-fx2__list" role="list">
      {%- for block in section.blocks -%}
${item}
      {%- endfor -%}
    </ul>
  </div>
</div>
`;

// Append hit-link helper into CSS asset
const cssExtra = `

.pm-fx2__hit {
  display: contents;
  color: inherit;
  text-decoration: none;
}
`;
fs.writeFileSync(`${root}/assets/pm-feature-type2.css`, css + cssExtra);

const out =
  body.trimEnd() +
  '\n\n{% schema %}\n' +
  JSON.stringify(schema, null, 2) +
  '\n{% endschema %}\n';

fs.writeFileSync(`${root}/sections/ss-feature-2.liquid`, out);
console.log(
  'wrote ss-feature-2 + pm-feature-type2.css',
  'settings',
  schema.settings.length,
  'blocks',
  schema.blocks[0].settings.length
);
