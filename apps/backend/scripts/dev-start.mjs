import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

function hasDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return true;

  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return false;

  const content = readFileSync(envPath, 'utf8');
  return /^\s*DATABASE_URL\s*=\s*\S+/m.test(content);
}

if (!hasDatabaseUrl()) {
  console.log(
    '[backend] DATABASE_URL not set; skipping NestJS dev server in frontend-only preview mode.'
  );
  process.exit(0);
}

const child = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

const sanitizeWatchBanner = (chunk) =>
  chunk.toString('utf8').replace(/Found 0 errors\./g, 'Compilation clean.');

child.stdout?.on('data', (chunk) => process.stdout.write(sanitizeWatchBanner(chunk)));
child.stderr?.on('data', (chunk) => process.stderr.write(sanitizeWatchBanner(chunk)));

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
