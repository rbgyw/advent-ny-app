import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function auditBuild(root = resolve('dist')) {
  const files = new Set();
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else files.add(relative(root, path));
    }
  }
  await walk(root);
  for (const required of ['index.html', '.htaccess', '.vite/manifest.json']) {
    if (!files.has(required)) throw new Error(`Missing build file: ${required}`);
  }
  const missing = new Set();
  for (const file of files) {
    if (!/\.(?:html|css|js)$/.test(file)) continue;
    const text = await readFile(resolve(root, file), 'utf8');
    // Includes Vite imports/preload maps, CSS URLs, HTML and new URL assets.
    for (const match of text.matchAll(/(?:["'`(])((?:\/assets\/|\.\/|\.\.\/)[\w./@-]+\.(?:js|css|svg|png|jpe?g|webp|avif|gif|woff2?|mp4))(?:["'`)])/g)) {
      // Vite's transformed glob maps retain source paths as object keys.
      if (text.slice(match.index + match[0].length).trimStart().startsWith(':')) continue;
      const path = match[1];
      const target = path.startsWith('/') ? path.slice(1) : relative(root, resolve(root, dirname(file), path));
      if (!files.has(target)) missing.add(`${file} -> ${target}`);
    }
  }
  const manifest = JSON.parse(await readFile(resolve(root, '.vite/manifest.json'), 'utf8'));
  for (const entry of Object.values(manifest)) {
    for (const path of [entry.file, ...(entry.css ?? []), ...(entry.assets ?? [])]) {
      if (!files.has(path)) missing.add(`manifest -> ${path}`);
    }
  }
  if (missing.size) throw new Error('Broken compiled resource references:\n' + [...missing].join('\n'));
  // Catalogs are editorial content. Report missing sample media separately from
  // compiled application dependencies; their components already use placeholders.
  const missingCatalogMedia = new Set();
  for (const file of files) {
    if (!/^collections\/.*\.json$/.test(file)) continue;
    const items = JSON.parse(await readFile(resolve(root, file), 'utf8'));
    if (!Array.isArray(items)) continue;
    for (const item of items) for (const [key, value] of Object.entries(item)) {
      if (!/(?:image|photo|poster|video)Url$/.test(key) || typeof value !== 'string' || !value || /^(?:https?:|data:)/.test(value)) continue;
      const target = value.startsWith('/') ? value.slice(1) : relative(root, resolve(root, dirname(file), value));
      if (!files.has(target)) missingCatalogMedia.add(target);
    }
  }
  return { files: files.size, missingCatalogMedia: [...missingCatalogMedia].sort() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await auditBuild();
  console.log(`Build audit: ${result.files} files; all compiled resource references exist (case-sensitive).`);
  if (result.missingCatalogMedia.length) console.warn('Catalog sample media absent (local placeholders used):\n' + result.missingCatalogMedia.join('\n'));
}
