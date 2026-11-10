/**
 * Add extra text CSS controls after multiline line_height (blank prefix).
 * Run: node scripts/patch-type-extra-css-multiline.js
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'sections/image-banner.liquid',
  'sections/image-with-text.liquid',
  'sections/newsletter.liquid',
  'sections/rich-text.liquid',
];

const EXTRA = `        { "type": "select", "id": "font_style", "label": "Font style", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "normal", "label": "Normal" }, { "value": "italic", "label": "Italic" }], "default": "inherit" },
        { "type": "select", "id": "font_family", "label": "Font family", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "heading", "label": "Heading font" }, { "value": "body", "label": "Body font" }], "default": "inherit" },
        { "type": "range", "id": "word_spacing", "min": -4, "max": 20, "step": 1, "unit": "px", "label": "Word spacing", "default": 0, "info": "0 = theme default" },
        { "type": "select", "id": "text_transform", "label": "Text transform", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "none", "label": "None" }, { "value": "uppercase", "label": "Uppercase" }, { "value": "lowercase", "label": "Lowercase" }, { "value": "capitalize", "label": "Capitalize" }], "default": "inherit" },
        { "type": "select", "id": "text_decoration", "label": "Text decoration", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "none", "label": "None" }, { "value": "underline", "label": "Underline" }, { "value": "line-through", "label": "Line through" }], "default": "inherit" },
        { "type": "select", "id": "text_align", "label": "Text align", "options": [{ "value": "inherit", "label": "Theme default" }, { "value": "left", "label": "Left" }, { "value": "center", "label": "Center" }, { "value": "right", "label": "Right" }], "default": "inherit" },
        { "type": "range", "id": "opacity", "min": 0, "max": 100, "step": 1, "unit": "%", "label": "Opacity", "default": 100, "info": "100 = fully opaque" },
        { "type": "range", "id": "max_width", "min": 0, "max": 1000, "step": 10, "unit": "px", "label": "Max width", "default": 0, "info": "0 = no limit" },
        { "type": "range", "id": "border_radius", "min": 0, "max": 40, "step": 2, "unit": "px", "label": "Corner radius", "default": 0 },
`;

const root = path.join(__dirname, '..');
let total = 0;
const re =
  /\{\s*\r?\n\s*"type":\s*"range",\s*\r?\n\s*"id":\s*"line_height",[\s\S]*?\r?\n\s*\}/g;

for (const rel of FILES) {
  const file = path.join(root, rel);
  let src = fs.readFileSync(file, 'utf8');
  const matches = [...src.matchAll(re)];
  let changes = 0;

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const before = src.slice(Math.max(0, m.index - 1200), m.index);
    if (!/typography/i.test(before) && !before.includes('"font_size"')) continue;

    const end = m.index + m[0].length;
    const after = src.slice(end, end + 900);
    if (after.includes('"id": "text_transform"') || after.includes('"id": "font_style"')) continue;

    src = src.slice(0, end) + ',\n' + EXTRA + src.slice(end);
    changes++;
  }

  if (changes > 0) {
    fs.writeFileSync(file, src);
    total += changes;
    console.log('patched', rel, changes);
  } else {
    console.log('no change', rel);
  }
}
console.log('total', total);
