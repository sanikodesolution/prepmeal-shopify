import fs from 'fs';

const sections = [3, 6, 7, 8, 9];

const assetSetting = {
  type: 'text',
  id: 'feature_image_asset',
  label: 'Icon from theme assets (GIF)',
  info: 'Filename in theme assets, e.g. my-icon.gif. Use this for animated GIFs — stays visible and animated even if the image picker shows a still.',
};

for (const n of sections) {
  const path = `sections/ss-feature-${n}.liquid`;
  let s = fs.readFileSync(path, 'utf8');

  // Wire asset into media render calls
  s = s.replace(
    /\{%\s*render 'pm-feature-media',\s*image:\s*block\.settings\.image,\s*lazy:\s*section\.settings\.lazy\s*%\}/g,
    `{% render 'pm-feature-media', image: block.settings.image, asset: block.settings.feature_image_asset, lazy: section.settings.lazy %}`
  );

  // Also handle cases without lazy
  s = s.replace(
    /\{%\s*render 'pm-feature-media',\s*image:\s*block\.settings\.image\s*%\}/g,
    `{% render 'pm-feature-media', image: block.settings.image, asset: block.settings.feature_image_asset, lazy: section.settings.lazy %}`
  );

  // Show media if image OR asset is set
  s = s.replaceAll(
    '{%- if block.settings.image != blank -%}',
    '{%- if block.settings.image != blank or block.settings.feature_image_asset != blank -%}'
  );

  const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
  if (!m) throw new Error('no schema ' + n);
  const j = JSON.parse(m[1]);
  const blockSettings = j.blocks[0].settings;
  const hasAsset = blockSettings.some((x) => x.id === 'feature_image_asset');
  if (!hasAsset) {
    const imageIdx = blockSettings.findIndex((x) => x.id === 'image');
    if (imageIdx >= 0) {
      blockSettings.splice(imageIdx + 1, 0, assetSetting);
    } else {
      blockSettings.unshift(assetSetting);
    }
  }

  // Improve image_picker info
  for (const setting of blockSettings) {
    if (setting.id === 'image') {
      setting.label = 'Icon or GIF';
      setting.info =
        'Upload PNG/JPG/GIF. If a GIF does not show, also set the theme-assets filename below (same as SS Feature #1).';
    }
  }

  s = s.replace(m[0], `{% schema %}\n${JSON.stringify(j, null, 2)}\n{% endschema %}`);
  fs.writeFileSync(path, s);
  console.log('patched', path);
}
