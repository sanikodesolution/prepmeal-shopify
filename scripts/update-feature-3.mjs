import fs from 'fs';

const root = 'G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify';
const neu = fs.readFileSync('C:/Users/sanikodesolution/Downloads/feature-type3.liquid', 'utf8');
const cur = fs.readFileSync(`${root}/sections/ss-feature-3.liquid`, 'utf8');

const curSchema = JSON.parse(cur.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);
const neuSchema = JSON.parse(neu.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);

const journeySettings = [
  { type: 'header', content: 'Journey layout' },
  ...neuSchema.settings.filter((s) => ['color_scheme', 'show_route', 'show_numbers'].includes(s.id)),
];

const settings = [...journeySettings, ...curSchema.settings];

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
  name: 'SS Feature #3',
  tag: 'section',
  class: 'feature-type3',
  max_blocks: 6,
  settings,
  blocks: [{ type: 'feature', name: 'Feature', settings: blockSettings }],
  presets: [
    {
      name: 'SS Feature #3',
      blocks: neuSchema.presets[0].blocks,
    },
  ],
};

const itemNew = `        <li class="pm-jny__item" style="--i: {{ forloop.index0 }};" {{ block.shopify_attributes }}>
          {%- if block.settings.feature_url != blank -%}
            <a class="pm-jny__hit" href="{{ block.settings.feature_url }}">
          {%- endif -%}
          <span class="pm-jny__plate">
            {%- unless block.settings.hide_image -%}
              {%- if block.settings.image != blank -%}
                {%- liquid
                  assign image = block.settings.image
                  assign src_clean = image.src | split: '?' | first | downcase
                  assign pm_lazy = section.settings.lazy
                  if pm_lazy == nil
                    assign pm_lazy = true
                  endif
                -%}
                {%- if src_clean contains '.gif' -%}
                  <img
                    class="pm-jny__img"
                    src="{{ image | image_url }}"
                    alt="{{ image.alt | escape }}"
                    width="{{ image.width }}"
                    height="{{ image.height }}"
                    {% if pm_lazy %}loading="lazy"{% endif %}
                  >
                {%- else -%}
                  <img
                    class="pm-jny__img"
                    src="{{ image | image_url: width: 320 }}"
                    alt="{{ image.alt | escape }}"
                    width="{{ image.width }}"
                    height="{{ image.height }}"
                    {% if pm_lazy %}loading="lazy"{% endif %}
                  >
                {%- endif -%}
              {%- endif -%}
            {%- endunless -%}
          </span>
          <div class="pm-jny__body">
            {%- if block.settings.title != blank -%}
              {%- capture feature_title_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'title_' -%}
              {%- endcapture -%}
              <h4
                class="pm-jny__title pm-ft__title"
                {% if feature_title_style != blank %}style="{{ feature_title_style | strip }}"{% endif %}
              >{{ block.settings.title | escape }}</h4>
            {%- endif -%}
            {%- if block.settings.text != blank -%}
              {%- capture feature_body_style -%}
                {%- render 'pm-block-type-style', block: block, prefix: 'body_' -%}
              {%- endcapture -%}
              <div
                class="pm-jny__text pm-ft__text"
                {% if feature_body_style != blank %}style="{{ feature_body_style | strip }}"{% endif %}
              >{{ block.settings.text | escape | newline_to_br }}</div>
            {%- endif -%}
          </div>
          {%- if block.settings.feature_url != blank -%}
            </a>
          {%- endif -%}
        </li>`;

let body = neu.replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/, '').trimEnd();

body = body.replace(/<h3 class="pm-jny__title">/g, '<h4 class="pm-jny__title">');
body = body.replace(/<\/h3>/g, '</h4>');

body = body.replace(
  /--pm-jny-icon: \{\{ section\.settings\.icon_size \}\}px;/,
  '--pm-jny-icon: {{ section.settings.feature_icon_size | default: 80 }}px;'
);

body = body.replace(
  /\{%- for block in section\.blocks -%\}[\s\S]*?\{%- endfor -%\}/,
  `{%- for block in section.blocks -%}\n${itemNew}\n      {%- endfor -%}`
);

body = body.replace(
  /\.pm-jny__text \{/,
  `.pm-jny__hit {
    display: contents;
    color: inherit;
    text-decoration: none;
  }

  .pm-jny__text {`
);

const header = `{% render 'pm-feature-shared-styles', section: section %}

`;

body = body.replace(
  /<div\n  class="pm-jny color-\{\{ section\.settings\.color_scheme \}\}/,
  `<div
  class="section-{{ section.id }} feature-{{ section.id }} pm-jny color-{{ section.settings.color_scheme }}`
);

body = body.replace(
  /style="--pm-jny-icon:/,
  'style="background-color:{{ section.settings.background_color }}; background-image: {{ section.settings.background_gradient }}; --pm-jny-icon:'
);

const out =
  header +
  body +
  '\n\n{% schema %}\n' +
  JSON.stringify(schema, null, 2) +
  '\n{% endschema %}\n';

fs.writeFileSync(`${root}/sections/ss-feature-3.liquid`, out);
console.log(
  'wrote ss-feature-3',
  out.length,
  'settings',
  schema.settings.length,
  'block',
  schema.blocks[0].settings.length
);
