import fs from 'fs';
import { execSync } from 'child_process';

const root = 'G:/kodesolution/htdocs/sanikodesolution/shopify/prepmeal-shopify';
process.chdir(root);

// 1) Save current pill/band/arch/star (wrongly numbered 3-6)
const current = {
  3: fs.readFileSync('sections/ss-feature-3.liquid', 'utf8'),
  4: fs.readFileSync('sections/ss-feature-4.liquid', 'utf8'),
  5: fs.readFileSync('sections/ss-feature-5.liquid', 'utf8'),
  6: fs.readFileSync('sections/ss-feature-6.liquid', 'utf8'),
};

// 2) Restore previous #3-#5 from a7403d4
for (const n of [3, 4, 5]) {
  execSync(`git checkout a7403d4 -- sections/ss-feature-${n}.liquid`, { stdio: 'inherit' });
  console.log('restored ss-feature-' + n);
}

// Also ensure sticker CSS still present
if (!fs.existsSync('assets/pm-feature-type3.css')) {
  execSync('git checkout a7403d4 -- assets/pm-feature-type3.css', { stdio: 'inherit' });
}

// 3) Map saved content → #6-#9 with renamed schema
const map = [
  { from: 3, to: 6, name: 'SS Feature #6 (Pill)', cls: 'feature-type6' },
  { from: 4, to: 7, name: 'SS Feature #7 (Band)', cls: 'feature-type7' },
  { from: 5, to: 8, name: 'SS Feature #8 (Arch)', cls: 'feature-type8' },
  { from: 6, to: 9, name: 'SS Feature #9 (Star)', cls: 'feature-type9' },
];

for (const { from, to, name, cls } of map) {
  let s = current[from];
  const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
  if (!m) throw new Error('no schema in ' + from);
  const j = JSON.parse(m[1]);
  j.name = name;
  j.class = cls;
  if (j.presets?.[0]) j.presets[0].name = name;
  // Update layout header text if it still says type3-6 numbering only — leave style names
  s = s.replace(m[0], `{% schema %}\n${JSON.stringify(j, null, 2)}\n{% endschema %}`);
  fs.writeFileSync(`sections/ss-feature-${to}.liquid`, s);
  console.log(`wrote ss-feature-${to}.liquid → ${name} (${name.length} chars)`);
}

console.log('done: #3-#5 restored, #6-#9 = pill/band/arch/star');
