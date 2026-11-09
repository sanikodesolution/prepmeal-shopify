const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'sections', 'cm-footer.liquid');
let s = fs.readFileSync(p, 'utf8');

const startMarker = '"content": "Call to action"';
const brandMarker = '"content": "Brand"';
const startIdx = s.indexOf(startMarker);
const brandIdx = s.indexOf(brandMarker, startIdx);
if (startIdx < 0 || brandIdx < 0) {
  console.error('markers not found', startIdx, brandIdx);
  process.exit(1);
}

// Back up to the header object that contains Call to action
const headerStart = s.lastIndexOf('{', startIdx);
// Find settings array opening before that
const settingsKey = s.lastIndexOf('"settings": [', headerStart);
const insertAt = settingsKey + '"settings": ['.length;

// Brand header object start
const brandObjStart = s.lastIndexOf('{', brandIdx);

s = s.slice(0, insertAt) + '\n    ' + s.slice(brandObjStart);

s = s.replace(
  `"blocks": [
        { "type": "links" },
        { "type": "contact" }
      ]`,
  `"blocks": [
        { "type": "cta" },
        { "type": "links" },
        { "type": "contact" }
      ]`
);

fs.writeFileSync(p, s);
console.log('OK: section CTA settings removed; preset includes cta block');
