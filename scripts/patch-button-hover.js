/**
 * Add hover text/bg color controls to every pm-button style schema + render.
 * Run: node scripts/patch-button-hover.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const HOVER_AFTER = {
  button_bg_color: [
    '{ "type": "color", "id": "button_hover_text_color", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "button_hover_bg_color", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  button_bg_color_2: [
    '{ "type": "color", "id": "button_hover_text_color_2", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "button_hover_bg_color_2", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  button_bg_1: [
    '{ "type": "color", "id": "button_hover_text_1", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "button_hover_bg_1", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  button_bg_2: [
    '{ "type": "color", "id": "button_hover_text_2", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "button_hover_bg_2", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  delivery_button_bg_color: [
    '{ "type": "color", "id": "delivery_button_hover_text_color", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "delivery_button_hover_bg_color", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  review_button_bg_color: [
    '{ "type": "color", "id": "review_button_hover_text_color", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "review_button_hover_bg_color", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
  // theme-block / hero button bare ids (only when followed by icon_bg)
  bg_color: [
    '{ "type": "color", "id": "hover_text_color", "label": "Hover text color", "info": "Clear to keep the style preset hover." },',
    '{ "type": "color", "id": "hover_bg_color", "label": "Hover background color", "info": "Clear to keep the style preset hover." },',
  ],
};

function insertHoverSchema(src) {
  let out = src;
  let changes = 0;

  // Skip if already patched for standard id
  if (out.includes('"button_hover_bg_color"') || out.includes('"hover_bg_color"') || out.includes('"button_hover_bg_1"') || out.includes('"delivery_button_hover_bg_color"') || out.includes('"review_button_hover_bg_color"')) {
    // still may need some variants — continue carefully per-id
  }

  for (const [id, lines] of Object.entries(HOVER_AFTER)) {
    const hoverId = lines[1].match(/"id": "([^"]+)"/)[1];
    if (out.includes(`"id": "${hoverId}"`)) continue;

    if (id === 'bg_color') {
      // Only button color blocks: bg_color followed soon by icon_bg
      const re = /(\{\s*"type":\s*"color",\s*"id":\s*"bg_color",\s*"label":\s*"Background color"\s*\},)(\s*)(?=\{\s*"type":\s*"color",\s*"id":\s*"icon_bg")/;
      if (!re.test(out)) continue;
      out = out.replace(re, (_, a, ws) => {
        changes++;
        return `${a}${ws}${lines[0]}${ws}${lines[1]}${ws}`;
      });
      continue;
    }

    const re = new RegExp(
      `(\\{\\s*"type":\\s*"color",\\s*"id":\\s*"${id}",\\s*"label":\\s*"[^"]*"\\s*\\},)`,
      'g'
    );
    out = out.replace(re, (m) => {
      changes++;
      // Detect indentation from surrounding — keep compact one-line style matching file
      const indentMatch = m.match(/^(\s*)/);
      // Most schemas use two-space indent inside arrays; preserve newline if multiline
      if (m.includes('\n')) {
        const pad = m.match(/\n(\s*)\{/) ? RegExp.$1 : '    ';
        return `${m}\n${pad}${lines[0]}\n${pad}${lines[1]}`;
      }
      return `${m} ${lines[0]} ${lines[1]}`;
    });
  }

  return { out, changes };
}

function patchRender(src) {
  let out = src;
  let changes = 0;

  const patterns = [
    // Standard section settings
    {
      test: /bg_color:\s*section\.settings\.button_bg_color(?!_)/,
      already: /hover_bg_color:\s*section\.settings\.button_hover_bg_color/,
      add: ', hover_text_color: section.settings.button_hover_text_color, hover_bg_color: section.settings.button_hover_bg_color',
      after: /font_size:\s*section\.settings\.button_font_size(?!_)/,
    },
    {
      test: /bg_color:\s*section\.settings\.button_bg_color_2/,
      already: /hover_bg_color:\s*section\.settings\.button_hover_bg_color_2/,
      add: ', hover_text_color: section.settings.button_hover_text_color_2, hover_bg_color: section.settings.button_hover_bg_color_2',
      after: /font_size:\s*section\.settings\.button_font_size_2/,
    },
    {
      test: /bg_color:\s*section\.settings\.delivery_button_bg_color/,
      already: /hover_bg_color:\s*section\.settings\.delivery_button_hover_bg_color/,
      add: ', hover_text_color: section.settings.delivery_button_hover_text_color, hover_bg_color: section.settings.delivery_button_hover_bg_color',
      after: /font_size:\s*section\.settings\.delivery_button_font_size/,
    },
    {
      test: /bg_color:\s*section\.settings\.review_button_bg_color/,
      already: /hover_bg_color:\s*section\.settings\.review_button_hover_bg_color/,
      add: ', hover_text_color: section.settings.review_button_hover_text_color, hover_bg_color: section.settings.review_button_hover_bg_color',
      after: /font_size:\s*section\.settings\.review_button_font_size/,
    },
    // image-banner numbered
    {
      test: /bg_color:\s*block\.settings\.button_bg_1/,
      already: /hover_bg_color:\s*block\.settings\.button_hover_bg_1/,
      add: ', hover_text_color: block.settings.button_hover_text_1, hover_bg_color: block.settings.button_hover_bg_1',
      after: /font_size:\s*block\.settings\.button_font_size_1/,
    },
    {
      test: /bg_color:\s*block\.settings\.button_bg_2/,
      already: /hover_bg_color:\s*block\.settings\.button_hover_bg_2/,
      add: ', hover_text_color: block.settings.button_hover_text_2, hover_bg_color: block.settings.button_hover_bg_2',
      after: /font_size:\s*block\.settings\.button_font_size_2/,
    },
    // block button style (image-with-text, parallax)
    {
      test: /bg_color:\s*block\.settings\.button_bg_color/,
      already: /hover_bg_color:\s*block\.settings\.button_hover_bg_color/,
      add: ', hover_text_color: block.settings.button_hover_text_color, hover_bg_color: block.settings.button_hover_bg_color',
      after: /font_size:\s*block\.settings\.button_font_size/,
    },
    // hero / theme block bare
    {
      test: /bg_color:\s*block\.settings\.bg_color/,
      already: /hover_bg_color:\s*block\.settings\.hover_bg_color/,
      add: ', hover_text_color: block.settings.hover_text_color, hover_bg_color: block.settings.hover_bg_color',
      after: /font_size:\s*block\.settings\.font_size/,
    },
    // footer / assigned locals s.button_*
    {
      test: /bg_color:\s*s\.button_bg_color/,
      already: /hover_bg_color:\s*s\.button_hover_bg_color/,
      add: ', hover_text_color: s.button_hover_text_color, hover_bg_color: s.button_hover_bg_color',
      after: /font_size:\s*s\.button_font_size/,
    },
    // footer cta locals
    {
      test: /bg_color:\s*cta\.button_bg_color/,
      already: /hover_bg_color:\s*cta\.button_hover_bg_color/,
      add: ', hover_text_color: cta.button_hover_text_color, hover_bg_color: cta.button_hover_bg_color',
      after: /font_size:\s*cta\.button_font_size/,
    },
  ];

  for (const p of patterns) {
    if (!p.test.test(out)) continue;
    if (p.already.test(out)) continue;
    if (p.after.test(out)) {
      out = out.replace(p.after, (m) => {
        changes++;
        return m + p.add;
      });
    }
  }

  // cm-mp-cta / meal-plan assigned locals cta_bg_color etc.
  if (
    /bg_color:\s*cta_bg_color/.test(out) &&
    !/hover_bg_color:\s*cta_hover_bg/.test(out) &&
    /font_size:\s*cta_font_size/.test(out)
  ) {
    out = out.replace(
      /font_size:\s*cta_font_size/,
      'font_size: cta_font_size, hover_text_color: cta_hover_text, hover_bg_color: cta_hover_bg'
    );
    changes++;
  }

  return { out, changes };
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p, files);
    } else if (name.endsWith('.liquid')) {
      files.push(p);
    }
  }
  return files;
}

let total = 0;
const files = [
  ...walk(path.join(root, 'sections')),
  ...walk(path.join(root, 'blocks')),
];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('pm-button') && !src.includes('Button style') && !src.includes('button_bg_color') && !src.includes('"bg_color"')) {
    continue;
  }
  let next = src;
  const a = insertHoverSchema(next);
  next = a.out;
  const b = patchRender(next);
  next = b.out;
  if (next !== src) {
    fs.writeFileSync(file, next);
    total += a.changes + b.changes;
    console.log('patched', path.relative(root, file), `(schema ${a.changes}, render ${b.changes})`);
  }
}

console.log('done, change markers:', total);
