/**
 * Upload theme logo assets to Shopify Files.
 * Run: node scripts/upload-logo.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const STORE = 'prepmeal-dev.myshopify.com';
const ASSETS = path.join(__dirname, '..', 'assets');
const FILES = ['chef-matts-meals-logo.png', 'cm-logo.png'];

function gql(query, variables, allowMutations = false) {
  const qFile = path.join(__dirname, '_tmp-query.graphql');
  const vFile = path.join(__dirname, '_tmp-vars.json');
  const oFile = path.join(__dirname, '_tmp-out.json');
  fs.writeFileSync(qFile, query);
  fs.writeFileSync(vFile, JSON.stringify(variables || {}));
  const args = [
    'store', 'execute', '-s', STORE, '--json', '--no-input',
    '--query-file', qFile, '--variable-file', vFile, '--output-file', oFile,
  ];
  if (allowMutations) args.push('--allow-mutations');
  const r = spawnSync('shopify', args, { encoding: 'utf8', shell: true });
  if (!fs.existsSync(oFile)) throw new Error('No GraphQL output:\n' + (r.stdout || '') + (r.stderr || ''));
  const raw = JSON.parse(fs.readFileSync(oFile, 'utf8'));
  if (raw.errors) throw new Error(JSON.stringify(raw.errors));
  return raw.data || raw;
}

async function uploadOne(filename) {
  const existing = gql(
    `query ($q: String!) { files(first: 5, query: $q) { nodes { ... on MediaImage { image { url } } } } }`,
    { q: `filename:${filename}` }
  );
  for (const n of existing.files?.nodes || []) {
    if ((n.image?.url || '').includes(filename)) {
      console.log('exists', filename);
      return `shopify://shop_images/${filename}`;
    }
  }
  const filePath = path.join(ASSETS, filename);
  const buf = fs.readFileSync(filePath);
  const mime = 'image/png';
  const staged = gql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    { input: [{ filename, mimeType: mime, httpMethod: 'POST', resource: 'FILE', fileSize: String(buf.length) }] },
    true
  );
  const target = staged.stagedUploadsCreate?.stagedTargets?.[0];
  const errs = staged.stagedUploadsCreate?.userErrors || [];
  if (errs.length) throw new Error(JSON.stringify(errs));
  if (!target) throw new Error('No staged target');

  const boundary = '----ShopifyBoundary' + Date.now();
  const parts = [];
  for (const p of target.parameters) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${p.name}"\r\n\r\n${p.value}\r\n`);
  }
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const body = Buffer.concat([Buffer.from(parts.join('')), buf, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const res = await fetch(target.url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error('Upload failed ' + filename + ' ' + res.status);

  const created = gql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { ... on MediaImage { id image { url } } }
        userErrors { field message }
      }
    }`,
    { files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE', alt: filename, filename }] },
    true
  );
  const cerrs = created.fileCreate?.userErrors || [];
  if (cerrs.length) throw new Error(JSON.stringify(cerrs));
  console.log('uploaded', filename);
  return `shopify://shop_images/${filename}`;
}

(async () => {
  for (const f of FILES) await uploadOne(f);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
