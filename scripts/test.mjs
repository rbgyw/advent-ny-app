import { spawn } from 'node:child_process';
import { preview } from 'vite';
const env = { ...process.env, VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'local-audit-public-key' };
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env, ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}
await run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '-b']);
await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } });
const address = server.httpServer.address();
if (!address || typeof address === 'string') throw new Error('Preview did not open a TCP port');
try {
  await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { env: { ...env, AUDIT_BASE_URL: `http://127.0.0.1:${address.port}` } });
} finally { await new Promise(resolve => server.httpServer.close(resolve)); }
