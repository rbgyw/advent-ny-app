import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { auditBuild } from '../scripts/audit-build.mjs';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function build() {
  const root = await mkdtemp(join(tmpdir(), 'advent-build-test-'));
  roots.push(root);
  await mkdir(join(root, '.vite'));
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<script src="/assets/main-12345678.js"></script>');
  await writeFile(join(root, '.htaccess'), 'RewriteEngine On');
  await writeFile(join(root, '.vite/manifest.json'), JSON.stringify({ 'src/main.ts': { file: 'assets/main-12345678.js' } }));
  await writeFile(join(root, 'assets/main-12345678.js'), 'const map={"./original.svg":"/assets/icon-12345678.svg"}');
  await writeFile(join(root, 'assets/icon-12345678.svg'), '<svg/>');
  return root;
}
it('accepts emitted resources and transformed glob keys', async () => {
  expect((await auditBuild(await build())).missingCatalogMedia).toEqual([]);
});
it('rejects a missing chunk rather than shipping a broken HTML reference', async () => {
  const root = await build();
  await rm(join(root, 'assets/main-12345678.js'));
  await expect(auditBuild(root)).rejects.toThrow('main-12345678.js');
});
it('rejects case mismatches on the production filesystem', async () => {
  const root = await build();
  await writeFile(join(root, 'assets/main-12345678.js'), 'const image="/assets/Icon-12345678.svg"');
  await expect(auditBuild(root)).rejects.toThrow('Icon-12345678.svg');
});
it('requires the Apache configuration in dist', async () => {
  const root = await build();
  await rm(join(root, '.htaccess'));
  await expect(auditBuild(root)).rejects.toThrow('.htaccess');
});
