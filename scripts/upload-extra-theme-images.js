/**
 * Upload remaining theme images needed for editor pickers.
 * Run: node scripts/upload-extra-theme-images.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const STORE = 'prepmeal-dev.myshopify.com';
const ASSETS = path.join(__dirname, '..', 'assets');
const FILES = [
  'chimichurri-steak.jpg',
  'orange-basil-salmon.jpg',
  'four-items-plate.webp',
  'peri-peri-chicken.jpg',
  'teriyaki-chicken-breast.jpg',
  'oven-bbq-salmon.jpg',
  'balsamic-baked-chicken-thighs.jpg',
  'ground-beef-enchilada-bowl.jpg',
  'chicken-quinoa-taco-bake.jpg',
  'turkey-meatball-marinara.jpg',
  'bacon-wrapped-chili-fig-glazed-pork-tenderloin.jpg',
  'cm-da-brush-l.webp',
  'cm-da-brush-r.webp',
  'cm-da-leaf-tr.webp',
  'cm-da-leaf-bl.webp',
  'cm-da-leaf-top.webp',
  'cm-da-leaf-right.webp',
  'cm-da-dots.webp',
];

function gql(query, variables, allowMutations = false) {
  const qFile = path.join(__dirname, '_tmp-query.graphql');
  const vFile = path.join(__dirname, '_tmp-vars.json');
  const oFile = path.join(__dirname, '_tmp-out.json');
  fs.writeFileSync(qFile, query);
  fs.writeFileSync(vFile, JSON.stringify(variables || {}));
  const args = [
    'store',
    'execute',
    '-s',
    STORE,
    '--json',
    '--no-input',
    '--query-file',
    qFile,
    '--variable-file',
    vFile,
    '--output-file',
    oFile,
  ];
  if (allowMutations) args.push('--allow-mutations');
  const r = spawnSync('shopify', args, { encoding: 'utf8', shell: true });
  if (!fs.existsSync(oFile)) throw new Error('No GraphQL output:\n' + (r.stdout || '') + (r.stderr || ''));
  const raw = JSON.parse(fs.readFileSync(oFile, 'utf8'));
  if (raw.errors) throw new Error(JSON.stringify(raw.errors));
  return raw.data || raw;
}

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function uploadOne(filename) {
  const existing = gql(
    `query ($q: String!) {
      files(first: 5, query: $q) {
        nodes { ... on MediaImage { image { url } } }
      }
    }`,
    { q: `filename:${filename}` }
  );
  for (const n of existing.files?.nodes || []) {
    const url = n.image?.url || '';
    if (url.includes(filename)) {
      console.log('exists', filename);
      return `shopify://shop_images/${filename}`;
    }
  }

  const filePath = path.join(ASSETS, filename);
  if (!fs.existsSync(filePath)) {
    console.warn('missing', filename);
    return null;
  }
  const buf = fs.readFileSync(filePath);
  const mime = mimeFor(filename);
  const staged = gql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: [
        {
          filename,
          mimeType: mime,
          httpMethod: 'POST',
          resource: 'FILE',
          fileSize: String(buf.length),
        },
      ],
    },
    true
  );
  const target = staged.stagedUploadsCreate?.stagedTargets?.[0];
  const errs = staged.stagedUploadsCreate?.userErrors || [];
  if (errs.length) throw new Error(JSON.stringify(errs));
  if (!target) throw new Error('No staged target for ' + filename);

  const boundary = '----ShopifyBoundary' + Date.now();
  const parts = [];
  for (const p of target.parameters) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${p.name}"\r\n\r\n${p.value}\r\n`);
  }
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const body = Buffer.concat([
    Buffer.from(parts.join(''), 'utf8'),
    buf,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
  ]);
  const res = await fetch(target.url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error('Upload failed ' + filename + ' ' + res.status);

  const created = gql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { ... on MediaImage { id image { url } } ... on GenericFile { id url } }
        userErrors { field message }
      }
    }`,
    {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: 'IMAGE',
          alt: filename,
          filename,
        },
      ],
    },
    true
  );
  const cerrs = created.fileCreate?.userErrors || [];
  if (cerrs.length) throw new Error(JSON.stringify(cerrs));
  console.log('uploaded', filename);
  return `shopify://shop_images/${filename}`;
}

(async () => {
  const mapPath = path.join(__dirname, '_shop-image-map.json');
  const map = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : {};
  for (const f of FILES) {
    try {
      const ref = await uploadOne(f);
      if (ref) map[f] = ref;
    } catch (e) {
      console.error('FAIL', f, e.message);
    }
  }
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
  console.log('wrote', mapPath);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
