import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = process.argv[2] || 'dist';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}
const files = (await walk(root)).filter(file => !file.includes('/.vite/'));
const js = await Promise.all(files.filter(file => file.endsWith('.js')).map(async file => {
  const data = await readFile(file);
  return { file: file.slice(root.length + 1), bytes: data.length, gzip: gzipSync(data).length };
}));
const html = await readFile(join(root, 'index.html'), 'utf8');
const initial = [...html.matchAll(/(?:src|href)="([^\"]+\.js)"/g)].map(match => match[1].replace(/^\//, ''));
console.log(JSON.stringify({ total_bytes: (await Promise.all(files.map(file => stat(file)))).reduce((sum, file) => sum + file.size, 0), initial_js_bytes: js.filter(file => initial.includes(file.file)).reduce((sum, file) => sum + file.bytes, 0), js }, null, 2));
