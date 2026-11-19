import fs from 'fs';

const map = {
  3: 'SS Feature #3 (Pill)',
  4: 'SS Feature #4 (Band)',
  5: 'SS Feature #5 (Arch)',
  6: 'SS Feature #6 (Star)',
};

for (const [n, name] of Object.entries(map)) {
  const p = `sections/ss-feature-${n}.liquid`;
  let s = fs.readFileSync(p, 'utf8');
  const m = s.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/);
  const j = JSON.parse(m[1]);
  j.name = name;
  if (j.presets?.[0]) j.presets[0].name = name;
  s = s.replace(m[0], `{% schema %}\n${JSON.stringify(j, null, 2)}\n{% endschema %}`);
  fs.writeFileSync(p, s);
  console.log(n, name, name.length);
}
