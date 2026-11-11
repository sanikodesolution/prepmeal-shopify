/**
 * Upload theme asset images to Shopify Files, then print shopify://shop_images map.
 * Uses Shopify CLI `store execute` for GraphQL + Node for multipart upload.
 *
 * Run: node scripts/upload-theme-images-to-files.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const STORE = 'prepmeal-dev.myshopify.com';
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const FILES = [
  'cm-hero-banner.jpg',
  'cm-healthy-meals-bg.jpg',
  'cm-healthy-meals.jpg',
  'cm-delivery-banner.jpg',
  'cm-step-order.gif',
  'cm-step-cook.gif',
  'cm-step-delivery.gif',
  'cm-step-heat.gif',
  'cm-step-order.png',
  'cm-step-cook.png',
  'cm-step-delivery.png',
  'cm-step-heat.png',
  'cm-badge-icon-1-yellow.png',
  'cm-badge-icon-2-yellow.png',
  'cm-badge-icon-3-yellow.png',
  'cm-badge-icon-4-yellow.png',
  'cm-usp-balance.jpg',
  'cm-usp-portions.jpg',
  'cm-usp-eco.jpg',
  'cm-usp-menu.gif',
  'cm-usp-menu.png',
  'mp-food-0.jpg',
  'mp-food-1.jpg',
  'mp-food-2.jpg',
  'mp-food-3.jpg',
  'mp-food-4.jpg',
  'mp-food-5.jpg',
  'mp-food-6.jpg',
  'mp-food-7.jpg',
  'mp-food-8.jpg',
  'mp-food-9.jpg',
  '10-meal-together.png',
  'cm-pd-plate-1.png',
  'cm-pd-plate-2.png',
  'cm-pd-plate-3.png',
  'cm-da-plate-tl.webp',
  'cm-da-plate-tr.webp',
  'cm-da-plate-bl.webp',
  'cm-da-plate-br.webp',
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
  if (!fs.existsSync(oFile)) {
    throw new Error('No GraphQL output:\n' + (r.stdout || '') + (r.stderr || ''));
  }
  const raw = JSON.parse(fs.readFileSync(oFile, 'utf8'));
  // CLI may wrap as { data: ... } or return data directly
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

function listExisting() {
  const data = gql(
    `query ($q: String!) {
      files(first: 100, query: $q) {
        nodes {
          ... on MediaImage { id image { url } }
          ... on GenericFile { id url }
        }
      }
    }`,
    { q: 'filename:cm- OR filename:mp-food OR filename:10-meal OR filename:plate-' }
  );
  const map = {};
  for (const n of data.files?.nodes || []) {
    const url = n.image?.url || n.url || '';
    const m = url.match(/\/files\/([^?]+)/);
    if (m) {
      const base = decodeURIComponent(m[1]);
      map[base] = `shopify://shop_images/${base}`;
      // also map without hash suffix: name_uuid.ext -> skip; exact names preferred
      const bare = base.replace(/_[0-9a-f]{8}-[0-9a-f-]{27}/i, '');
      if (!map[bare]) map[bare] = `shopify://shop_images/${base}`;
    }
  }
  return map;
}

async function uploadOne(filename, existing) {
  if (existing[filename]) {
    console.log('exists', filename, '->', existing[filename]);
    return existing[filename];
  }
  const filePath = path.join(ASSETS, filename);
  if (!fs.existsSync(filePath)) {
    console.warn('missing asset', filename);
    return null;
  }
  const buf = fs.readFileSync(filePath);
  const mime = mimeFor(filename);
  const staged = gql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
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

  // multipart form upload
  const boundary = '----ShopifyBoundary' + Date.now();
  const parts = [];
  for (const p of target.parameters) {
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${p.name}"\r\n\r\n${p.value}\r\n`
    );
  }
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const head = Buffer.from(parts.join(''), 'utf8');
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const body = Buffer.concat([head, buf, tail]);

  const res = await fetch(target.url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Upload failed ' + filename + ' ' + res.status + ' ' + t.slice(0, 300));
  }

  const created = gql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          ... on MediaImage { id image { url } fileStatus }
          ... on GenericFile { id url }
        }
        userErrors { field message }
      }
    }`,
    {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: mime.startsWith('image/') ? 'IMAGE' : 'FILE',
          alt: filename,
          filename,
        },
      ],
    },
    true
  );
  const cerrs = created.fileCreate?.userErrors || [];
  if (cerrs.length) throw new Error(JSON.stringify(cerrs));
  const file = created.fileCreate?.files?.[0];
  const url = file?.image?.url || file?.url || '';
  const m = url.match(/\/files\/([^?]+)/);
  const shopFile = m ? decodeURIComponent(m[1]) : filename;
  const ref = `shopify://shop_images/${shopFile}`;
  console.log('uploaded', filename, '->', ref);
  return ref;
}

async function main() {
  const existing = listExisting();
  console.log('existing mapped', Object.keys(existing).length);
  const map = { ...existing };
  for (const f of FILES) {
    try {
      const ref = await uploadOne(f, map);
      if (ref) map[f] = ref;
    } catch (e) {
      console.error('FAIL', f, e.message);
    }
  }
  fs.writeFileSync(path.join(__dirname, '_shop-image-map.json'), JSON.stringify(map, null, 2));
  console.log('wrote scripts/_shop-image-map.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
