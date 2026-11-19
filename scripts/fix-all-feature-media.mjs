import fs from 'fs';

const sections = [2, 3, 4, 5, 6, 7, 8, 9];

const assetSetting = {
  type: 'text',
  id: 'feature_image_asset',
  label: 'Icon from theme assets (GIF)',
  info: 'Filename in theme assets, e.g. my-icon.gif. Best for animated GIFs.',
};

for (const n of sections) {
  const path = `sections/ss-feature-${n}.liquid`;
  let s = fs.readFileSync(path, 'utf8');

  // Normalize media render
  s = s.replace(
    /\{%\s*render 'pm-feature-media',[^%]*%\}/g,
    `{% render 'pm-feature-media', image: block.settings.image, asset: block.settings.feature_image_asset, lazy: section.settings.lazy %}`
  );

  // Show when image or asset present
  s = s.replaceAll(
    '{%- if block.settings.image != blank -%}',
    '{%- if block.settings.image != blank or block.settings.feature_image_asset != blank -%}'
  );
  // Avoid double-or if already patched
  s = s.replaceAll(
    '{%- if block.settings.image != blank or block.settings.feature_image_asset != blank or block.settings.feature_image_asset != blank -%}',
    '{%- if block.settings.image != blank or block.settings.feature_image_asset != blank -%}'
  );

  const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
  if (!m) throw new Error('no schema ' + n);
  const j = JSON.parse(m[1]);
  const blockSettings = j.blocks[0].settings;
  if (!blockSettings.some((x) => x.id === 'feature_image_asset')) {
    const imageIdx = blockSettings.findIndex((x) => x.id === 'image' || x.id === 'feature_image');
    if (imageIdx >= 0) blockSettings.splice(imageIdx + 1, 0, { ...assetSetting });
    else blockSettings.unshift({ ...assetSetting });
  }
  for (const setting of blockSettings) {
    if (setting.id === 'image') {
      setting.label = 'Icon or GIF';
      setting.info =
        'PNG/JPG/GIF from Files. If a GIF fails to show, put the theme-assets filename in the field below.';
    }
  }

  s = s.replace(m[0], `{% schema %}\n${JSON.stringify(j, null, 2)}\n{% endschema %}`);
  fs.writeFileSync(path, s);
  console.log('ok', n);
}
