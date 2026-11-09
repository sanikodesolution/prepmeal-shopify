/**
 * Inline bg color/image after multiline line_height blocks (blank prefix).
 * Run: node scripts/patch-type-bg-multiline.js
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'sections/image-banner.liquid',
  'sections/image-with-text.liquid',
  'sections/newsletter.liquid',
  'sections/rich-text.liquid',
];

const INLINE = `        { "type": "color", "id": "bg_color", "label": "Background color", "info": "Clear swatch to reset." }, { "type": "color", "id": "hover_bg_color", "label": "Hover background color", "info": "Clear to keep default." },
        { "type": "image_picker", "id": "bg_image", "label": "Background image" },
`;

const root = path.join(__dirname, '..');
let total = 0;

for (const rel of FILES) {
  const file = path.join(root, rel);
  let src = fs.readFileSync(file, 'utf8');
  let changes = 0;

  // After multiline line_height object, before Spacing/Background header
  const re =
    /(\{\s*\n\s*"type":\s*"range",\s*\n\s*"id":\s*"line_height",[\s\S]*?\n\s*\},)\s*\n(\s*\{\s*"type":\s*"header",\s*"content":\s*"(?:Spacing|Background)"\s*\})/g;

  src = src.replace(re, (full, lineHeightBlock, nextHeader) => {
    // Already inlined?
    const between = full.slice(lineHeightBlock.length);
    if (between.includes('"id": "bg_color"')) return full;
    changes++;
    return `${lineHeightBlock}\n${INLINE}${nextHeader}`;
  });

  // Strip duplicate color/image from later Background section in each block
  // Only remove the compact lines that appear under Background header after we've inlined
  if (changes > 0) {
    // Remove duplicate bg_color/hover/image lines that sit immediately after a Background header
    src = src.replace(
      /(\{\s*"type":\s*"header",\s*"content":\s*"Background"\s*\},)\s*\n\s*\{\s*"type":\s*"color",\s*"id":\s*"bg_color"[^\n]*\n\s*\{\s*"type":\s*"image_picker",\s*"id":\s*"bg_image"[^\n]*\n/g,
      '$1\n'
    );
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
