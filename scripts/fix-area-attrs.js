const fs = require('fs');
const p = 'sections/cm-meal-plan-page.liquid';
let s = fs.readFileSync(p, 'utf8');
const re = / \{% render 'cm-area-attrs', section: section, type: '([^']+)' %\}/g;
s = s.replace(re, (_, type) => {
  return `{% for block in section.blocks %}{% if block.type == '${type}' %} {{ block.shopify_attributes }}{% break %}{% endif %}{% endfor %}`;
});
fs.writeFileSync(p, s);
console.log('left renders', (s.match(/cm-area-attrs/g) || []).length);
console.log('for-loops', (s.match(/for block in section\.blocks/g) || []).length);
