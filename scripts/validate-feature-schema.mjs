import fs from 'fs';

for (const v of [2, 3, 4, 5]) {
  const s = fs.readFileSync(`sections/ss-feature-${v}.liquid`, 'utf8');
  const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
  if (!m) throw new Error(`no schema in ${v}`);
  const j = JSON.parse(m[1]);
  const ids = j.settings.map((x) => x.id).filter(Boolean);
  const needed = [
    'feature_row',
    'feature_heading_size',
    'feature_text_size',
    'feature_icon_size',
    'background_color',
    'padding_top',
    'full_width',
    'lazy',
  ];
  for (const id of needed) {
    if (!ids.includes(id)) throw new Error(`${v} missing ${id}`);
  }
  const blockIds = j.blocks[0].settings.map((x) => x.id).filter(Boolean);
  for (const id of ['title', 'text', 'image', 'title_color', 'body_color', 'title_font_size']) {
    if (!blockIds.includes(id)) throw new Error(`${v} block missing ${id}`);
  }
  console.log(`OK #${v}: ${j.settings.length} section settings, ${j.blocks[0].settings.length} block settings`);
}
