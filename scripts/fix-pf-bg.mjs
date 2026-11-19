import fs from 'fs';

const oldBlock = `  assign pf_bg = section.settings.bg
  if section.settings.background_color != blank
    assign pf_bg = section.settings.background_color
  endif
  if pf_bg == blank
    assign pf_bg = '#f6efe8'
  endif`;

const oldBlock4 = oldBlock.replace('#f6efe8', '#F5A623');
const oldBlock6 = oldBlock.replace('#f6efe8', '#ffffff');

const neu = `  assign pf_bg = section.settings.bg
  if pf_bg == blank
    assign pf_bg = section.settings.background_color
  endif`;

for (const n of [3, 4, 5, 6]) {
  const p = `sections/ss-feature-${n}.liquid`;
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes(oldBlock)) s = s.replace(oldBlock, neu);
  else if (s.includes(oldBlock4)) s = s.replace(oldBlock4, neu);
  else if (s.includes(oldBlock6)) s = s.replace(oldBlock6, neu);
  else {
    // generic regex
    s = s.replace(
      /  assign pf_bg = section\.settings\.bg\n  if section\.settings\.background_color != blank\n    assign pf_bg = section\.settings\.background_color\n  endif\n  if pf_bg == blank\n    assign pf_bg = '[^']+'\n  endif/,
      neu
    );
  }
  fs.writeFileSync(p, s);
  console.log('ok', n, s.includes(neu));
}
