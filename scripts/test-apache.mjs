// Run against real Apache, rather than Vite's more permissive history fallback.
// APACHE_BIN/APACHE_MODULE_DIR allow an extracted, unprivileged test installation.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm, cp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = await mkdtemp(resolve(tmpdir(), 'advent-apache-test-'));
const reserve = createServer();
await new Promise(done => reserve.listen(0, '127.0.0.1', done));
const port = reserve.address().port;
await new Promise(done => reserve.close(done));
const modules = process.env.APACHE_MODULE_DIR ?? '/usr/lib/apache2/modules';
const documentRoot = resolve(root, 'site');
await cp(resolve('dist'), documentRoot, { recursive: true });
const config = `ServerRoot "${root}"
ServerName 127.0.0.1
Listen 127.0.0.1:${port}
PidFile "${root}/httpd.pid"
ErrorLog "${root}/error.log"
LoadModule mpm_event_module "${modules}/mod_mpm_event.so"
LoadModule authz_core_module "${modules}/mod_authz_core.so"
LoadModule dir_module "${modules}/mod_dir.so"
LoadModule mime_module "${modules}/mod_mime.so"
LoadModule rewrite_module "${modules}/mod_rewrite.so"
LoadModule headers_module "${modules}/mod_headers.so"
TypesConfig /dev/null
AddType text/html .html
AddType text/javascript .js
AddType text/css .css
AddType image/svg+xml .svg
AddType application/json .json
DirectoryIndex index.html
DocumentRoot "${documentRoot}"
<Directory "${documentRoot}">
  Require all granted
  AllowOverride All
</Directory>
`;
await writeFile(resolve(root, 'httpd.conf'), config);
const apache = spawn(process.env.APACHE_BIN ?? '/usr/sbin/apache2', ['-f', resolve(root, 'httpd.conf'), '-DFOREGROUND'], { stdio: ['ignore', 'ignore', 'pipe'] });
let failure;
apache.on('error', error => { failure = error; });
apache.stderr.on('data', chunk => process.stderr.write(chunk));
const origin = `http://127.0.0.1:${port}`;
try {
  let started = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (failure) throw failure;
    if (apache.exitCode !== null) throw new Error('Apache exited before listening');
    try { started = (await fetch(origin)).ok; } catch {}
    if (started) break;
    await new Promise(done => setTimeout(done, 100));
  }
  if (!started) throw new Error('Apache did not start');
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'tests/apache.spec.ts'], {
    stdio: 'inherit', env: { ...process.env, AUDIT_BASE_URL: origin, AUDIT_APACHE: '1', AUDIT_DOCUMENT_ROOT: documentRoot },
  });
  const code = await new Promise((done, reject) => { child.on('error', reject); child.on('exit', done); });
  if (code !== 0) process.exitCode = code || 1;
} finally {
  if (apache.exitCode === null) {
    const exited = new Promise(done => apache.once('exit', done));
    apache.kill('SIGTERM');
    await exited;
  }
  await rm(root, { recursive: true, force: true });
}
