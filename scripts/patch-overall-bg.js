/**
 * Apply full Section/Band background suite theme-wide.
 * Run: node scripts/patch-overall-bg.js
 */
const fs = require('fs');
const path = require('path');

const BAND_BG = `        { "type": "header", "content": "Band background" },
        { "type": "paragraph", "content": "Color, gradient, and/or image. Leave blank for theme default." },
        { "type": "color", "id": "background_color", "label": "Color" },
        { "type": "color_background", "id": "background_gradient", "label": "Gradient" },
        { "type": "image_picker", "id": "background_image", "label": "Image" },
        { "type": "header", "content": "Image layout" },
        { "type": "select", "id": "background_image_fit", "label": "Size", "options": [
          { "value": "cover", "label": "Cover" },
          { "value": "contain", "label": "Contain" },
          { "value": "auto", "label": "Original" }
        ], "default": "cover" },
        { "type": "select", "id": "background_image_position", "label": "Position", "options": [
          { "value": "center", "label": "Center" },
          { "value": "top", "label": "Top" },
          { "value": "bottom", "label": "Bottom" },
          { "value": "left", "label": "Left" },
          { "value": "right", "label": "Right" }
        ], "default": "center" },
        { "type": "select", "id": "background_repeat", "label": "Repeat", "options": [
          { "value": "no-repeat", "label": "No repeat" },
          { "value": "repeat", "label": "Repeat" },
          { "value": "repeat-x", "label": "Repeat X" },
          { "value": "repeat-y", "label": "Repeat Y" }
        ], "default": "no-repeat" },
        { "type": "select", "id": "background_attachment", "label": "Scroll", "options": [
          { "value": "scroll", "label": "Scroll with page" },
          { "value": "fixed", "label": "Fixed (parallax)" }
        ], "default": "scroll" },
        { "type": "header", "content": "Overlay" },
        { "type": "color", "id": "background_overlay_color", "label": "Color", "default": "#000000" },
        { "type": "range", "id": "background_overlay_opacity", "min": 0, "max": 80, "step": 5, "unit": "%", "label": "Strength", "default": 0 },
        { "type": "header", "content": "Advanced background" },
        { "type": "select", "id": "background_blend_mode", "label": "Blend mode", "options": [
          { "value": "normal", "label": "Normal" },
          { "value": "multiply", "label": "Multiply" },
          { "value": "screen", "label": "Screen" },
          { "value": "overlay", "label": "Overlay" },
          { "value": "soft-light", "label": "Soft light" },
          { "value": "darken", "label": "Darken" },
          { "value": "lighten", "label": "Lighten" }
        ], "default": "normal" },
        { "type": "range", "id": "background_border_radius", "min": 0, "max": 40, "step": 2, "unit": "px", "label": "Corner radius", "default": 0 },
        { "type": "range", "id": "background_min_height", "min": 0, "max": 800, "step": 10, "unit": "px", "label": "Min height", "default": 0, "info": "0 = auto" },
        { "type": "header", "content": "Text colors" }`;

const SECTION_BG = BAND_BG.replace(/Band background/g, 'Section background').replace(/^        /gm, '    ');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p, files);
    } else if (name.endsWith('.liquid')) files.push(p);
  }
  return files;
}

function patchFile(src) {
  let out = src;
  let changes = 0;

  // 1) Colors & typography / Background, colors — replace header+paragraph+background_color with full band bg + Text colors
  const colorsRe =
    /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"(?:Colors & typography|Background, colors & typography)"\s*\},?\s*(?:\{\s*"type"\s*:\s*"paragraph"[\s\S]*?\},?\s*)?\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"\s*,\s*"label"\s*:\s*"(?:Background|Background color)"\s*\},?/g;

  out = out.replace(colorsRe, () => {
    changes++;
    return BAND_BG + ',';
  });

  // 2) Section background & space / Background header with only color (and maybe content box)
  // image-banner style
  const bannerRe =
    /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"Section background(?: & space)?"\s*\},?\s*\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"[\s\S]*?"label"\s*:\s*"Background color"[\s\S]*?\},?/g;

  out = out.replace(bannerRe, (full) => {
    if (full.includes('background_gradient')) return full;
    changes++;
    // Keep content_background_color if present after
    const contentBg = full.match(
      /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"content_background_color"[\s\S]*?\},?/
    );
    return (
      SECTION_BG +
      ',' +
      (contentBg
        ? `\n    { "type": "header", "content": "Content box" },\n    ${contentBg[0]}`
        : '')
    );
  });

  // 3) Simple Background header + background_color only (image-with-text, _blocks already done, etc.)
  if (!out.includes('"Section background"') || !out.includes('"background_gradient"')) {
    const simpleRe =
      /\{\s*"type"\s*:\s*"header"\s*,\s*"content"\s*:\s*"Background(?: color)?"\s*\},?\s*\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"\s*,\s*"label"\s*:\s*"(?:Background color|Background)"\s*\}(?!,?\s*\{\s*"type"\s*:\s*"color_background")/g;

    out = out.replace(simpleRe, (full) => {
      // Avoid text-level Background headers under typography mask groups — those use bg_color not background_color
      changes++;
      return SECTION_BG;
    });
  }

  // 4) After color_scheme, inject Section background if missing entirely (Dawn sections)
  if (
    !out.includes('"background_color"') &&
    !out.includes('"Section background"') &&
    /"id"\s*:\s*"color_scheme"/.test(out)
  ) {
    const csRe =
      /(\{\s*"type"\s*:\s*"color_scheme"\s*,\s*"id"\s*:\s*"color_scheme"[\s\S]*?\},)/;
    if (csRe.test(out)) {
      out = out.replace(csRe, (full) => {
        changes++;
        return `${full}\n${SECTION_BG},`;
      });
    }
  }

  // 5) ss-feature has background_color + background_gradient already — add missing repeat/attachment/headers if needed
  if (out.includes('"background_color"') && out.includes('"background_gradient"') && !out.includes('"background_repeat"')) {
    out = out.replace(
      /(\{\s*"type"\s*:\s*"image_picker"\s*,\s*"id"\s*:\s*"background_image"[\s\S]*?\},)/,
      (full) => {
        if (out.includes('"background_repeat"')) return full;
        changes++;
        return `${full}
    { "type": "header", "content": "Image layout" },
    { "type": "select", "id": "background_image_fit", "label": "Size", "options": [
      { "value": "cover", "label": "Cover" },
      { "value": "contain", "label": "Contain" },
      { "value": "auto", "label": "Original" }
    ], "default": "cover" },
    { "type": "select", "id": "background_image_position", "label": "Position", "options": [
      { "value": "center", "label": "Center" },
      { "value": "top", "label": "Top" },
      { "value": "bottom", "label": "Bottom" },
      { "value": "left", "label": "Left" },
      { "value": "right", "label": "Right" }
    ], "default": "center" },
    { "type": "select", "id": "background_repeat", "label": "Repeat", "options": [
      { "value": "no-repeat", "label": "No repeat" },
      { "value": "repeat", "label": "Repeat" },
      { "value": "repeat-x", "label": "Repeat X" },
      { "value": "repeat-y", "label": "Repeat Y" }
    ], "default": "no-repeat" },
    { "type": "select", "id": "background_attachment", "label": "Scroll", "options": [
      { "value": "scroll", "label": "Scroll with page" },
      { "value": "fixed", "label": "Fixed (parallax)" }
    ], "default": "scroll" },
    { "type": "header", "content": "Overlay" },
    { "type": "color", "id": "background_overlay_color", "label": "Color", "default": "#000000" },
    { "type": "range", "id": "background_overlay_opacity", "min": 0, "max": 80, "step": 5, "unit": "%", "label": "Strength", "default": 0 },
    { "type": "header", "content": "Advanced background" },
    { "type": "select", "id": "background_blend_mode", "label": "Blend mode", "options": [
      { "value": "normal", "label": "Normal" },
      { "value": "multiply", "label": "Multiply" },
      { "value": "screen", "label": "Screen" },
      { "value": "overlay", "label": "Overlay" },
      { "value": "soft-light", "label": "Soft light" },
      { "value": "darken", "label": "Darken" },
      { "value": "lighten", "label": "Lighten" }
    ], "default": "normal" },
    { "type": "range", "id": "background_border_radius", "min": 0, "max": 40, "step": 2, "unit": "px", "label": "Corner radius", "default": 0 },
    { "type": "range", "id": "background_min_height", "min": 0, "max": 800, "step": 10, "unit": "px", "label": "Min height", "default": 0, "info": "0 = auto" },`;
      }
    );
  }

  return { out, changes };
}

const root = path.join(__dirname, '..');
const skip = /cart-drawer|cart-notification|pickup-availability|predictive-search|password|apps|quick-order|main-cart|main-search|breadcrumbs|ajax/;
const files = [...walk(path.join(root, 'sections')), ...walk(path.join(root, 'blocks'))];
let total = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  if (skip.test(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('{% schema %}')) continue;
  const { out, changes } = patchFile(src);
  if (changes > 0 && out !== src) {
    fs.writeFileSync(file, out);
    total += changes;
    console.log('patched', rel, changes);
  }
}
console.log('total', total);
