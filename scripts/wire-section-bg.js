/**
 * Wire pm-section-style + pm-section-bg on sections that have Section background schema.
 * Run: node scripts/wire-section-bg.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sectionsDir = path.join(root, 'sections');

const FILES = [
  'announcement-bar.liquid',
  'collage.liquid',
  'collapsible-content.liquid',
  'collection-list.liquid',
  'contact-form.liquid',
  'custom-liquid.liquid',
  'email-signup-banner.liquid',
  'featured-blog.liquid',
  'featured-collection.liquid',
  'featured-product.liquid',
  'footer.liquid',
  'header.liquid',
  'image-banner.liquid',
  'image-with-text.liquid',
  'main-collection-product-grid.liquid',
  'main-product.liquid',
  'multicolumn.liquid',
  'newsletter.liquid',
  'page.liquid',
  'related-products.liquid',
  'rich-text.liquid',
  'slideshow.liquid',
  'video.liquid',
];

function addClass(classAttr, name) {
  if (classAttr.includes(name)) return classAttr;
  return classAttr.replace(/class="/, `class="${name} `);
}

function ensureRender(tagOpen) {
  if (tagOpen.includes('pm-section-style')) return tagOpen;
  // Insert render before closing >
  return tagOpen.replace(/>$/, ` {% render 'pm-section-style', section: section %}>`);
}

function wireFile(rel) {
  const file = path.join(sectionsDir, rel);
  if (!fs.existsSync(file)) return 0;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('"Section background"') && !src.includes('"background_gradient"')) return 0;
  if (src.includes('pm-section-style')) {
    // still ensure class on existing render hosts
  }
  let changes = 0;
  const before = src;

  // Multline opening tags that include color_scheme class
  src = src.replace(
    /<(div|footer|section|product-info|sticky-header|header)(\s[^>]*class="[^"]*color-\{\{\s*section\.settings\.(?:color_scheme|section_color_scheme)\s*\}\}[^"]*"[^>]*)>/g,
    (full, tag, rest) => {
      if (full.includes('pm-section-style') && full.includes('pm-section-bg')) return full;
      let open = `<${tag}${rest}>`;
      if (!open.includes('pm-section-bg')) {
        open = addClass(open, 'pm-section-bg');
      }
      open = ensureRender(open);
      changes++;
      return open;
    }
  );

  // announcement utility-bar (same pattern)
  src = src.replace(
    /<(div)(\s[^>]*class="[^"]*utility-bar[^"]*color-\{\{\s*section\.settings\.color_scheme\s*\}\}[^"]*"[^>]*)>/g,
    (full, tag, rest) => {
      if (full.includes('pm-section-style')) return full;
      let open = `<${tag}${rest}>`;
      open = addClass(open, 'pm-section-bg');
      open = ensureRender(open);
      changes++;
      return open;
    }
  );

  // image-banner root
  if (rel === 'image-banner.liquid' && !src.includes('pm-section-style')) {
    src = src.replace(
      /(id="Banner-\{\{ section\.id \}\}"\s*\n\s*class=")([^"]+)(")/,
      (full, a, cls, c) => {
        changes++;
        const next = cls.includes('pm-section-bg') ? cls : `pm-section-bg ${cls}`;
        return `${a}${next}${c}\n  {% render 'pm-section-style', section: section %}`;
      }
    );
  }

  // slideshow component
  if (rel === 'slideshow.liquid' && !src.includes('pm-section-style')) {
    src = src.replace(
      /<slideshow-component\n\s*class="([^"]+)"/,
      (full, cls) => {
        changes++;
        const next = cls.includes('pm-section-bg') ? cls : `pm-section-bg ${cls}`;
        return `<slideshow-component\n  class="${next}"\n  {% render 'pm-section-style', section: section %}`;
      }
    );
  }

  // header dynamic tag
  if (rel === 'header.liquid' && !src.includes('pm-section-style')) {
    src = src.replace(
      /<({{ header_tag }})\s([^>]*class="[^"]*header-wrapper[^"]*"[^>]*)>/,
      (full, tag, rest) => {
        changes++;
        let open = `<${tag} ${rest}>`;
        open = addClass(open, 'pm-section-bg');
        open = ensureRender(open);
        return open;
      }
    );
  }

  // mealplan pages already have render — add class
  src = src.replace(
    /class="(mealplan-page)"(\s[^>]*\{%\s*render\s+'pm-section-style')/g,
    (full, cls, rest) => {
      if (full.includes('pm-section-bg')) return full;
      changes++;
      return `class="mealplan-page pm-section-bg"${rest}`;
    }
  );

  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log('wired', rel, changes || '(diff)');
    return 1;
  }
  return 0;
}

let n = 0;
for (const f of FILES) n += wireFile(f);

// Also add pm-section-bg to cm-mp-* that already render
for (const name of fs.readdirSync(sectionsDir)) {
  if (!name.startsWith('cm-mp-') && name !== '_blocks.liquid') continue;
  const file = path.join(sectionsDir, name);
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('pm-section-style')) continue;
  const before = src;
  src = src.replace(
    /class="([^"]*\bmealplan-page\b[^"]*)"/g,
    (full, cls) => {
      if (cls.includes('pm-section-bg')) return full;
      return `class="${cls} pm-section-bg"`;
    }
  );
  src = src.replace(
    /class="(pm-blocks[^"]*)"/g,
    (full, cls) => {
      if (cls.includes('pm-section-bg')) return full;
      return `class="${cls} pm-section-bg"`;
    }
  );
  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log('class', name);
    n++;
  }
}

console.log('done', n);
