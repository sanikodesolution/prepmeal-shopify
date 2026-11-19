import fs from 'fs';

const root = 'G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify';
let s = fs.readFileSync(`${root}/sections/_tmp-sticker.liquid`, 'utf8');
// strip BOM if PowerShell Out-File added one
s = s.replace(/^\uFEFF/, '');

s = s.replace(
  "{{ 'pm-feature-type2.css' | asset_url | stylesheet_tag }}",
  "{{ 'pm-feature-type3.css' | asset_url | stylesheet_tag }}"
);

const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
if (!m) throw new Error('no schema');
const schema = JSON.parse(m[1]);
schema.name = 'SS Feature #3';
schema.class = 'feature-type3';
schema.max_blocks = 8;
if (schema.presets?.[0]) schema.presets[0].name = 'SS Feature #3';
// Rename layout header
for (const setting of schema.settings) {
  if (setting.type === 'header' && setting.content === 'Sticker card layout') {
    setting.content = 'Sticker card layout';
  }
}

s = s.replace(m[0], `{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}`);
fs.writeFileSync(`${root}/sections/ss-feature-3.liquid`, s);
fs.unlinkSync(`${root}/sections/_tmp-sticker.liquid`);

// Update CSS header comment + keep .pm-fx2 scope (stable)
let css = fs.readFileSync(`${root}/assets/pm-feature-type3.css`, 'utf8');
css = css.replace(
  /Feature type 2 — "sticker step cards"/,
  'Feature type 3 — "sticker step cards"'
);
css = css.replace(
  /Scoped under \.pm-fx2 so it never touches other feature types\./,
  'Used by SS Feature #3. Scoped under .pm-fx2 so it never touches other feature types.'
);
fs.writeFileSync(`${root}/assets/pm-feature-type3.css`, css);

// Keep pm-feature-type2.css as a thin alias for safety, or delete? Keep alias redirect comment only if referenced - feature-2 no longer uses it. Delete type2 asset to avoid orphan confusion? Prefer keep both identical for now so old caches ok - actually feature-2 restored doesn't use type2 css. Delete type2 or leave. Leave type2 for now unused is fine; or remove. I'll leave type2 as duplicate of type3 for any stale refs.

console.log('ss-feature-3 sticker ready; ss-feature-2 restored soft cards');
console.log('feature-2 head:', fs.readFileSync(`${root}/sections/ss-feature-2.liquid`, 'utf8').slice(0, 120));
console.log('feature-3 head:', fs.readFileSync(`${root}/sections/ss-feature-3.liquid`, 'utf8').slice(0, 120));
