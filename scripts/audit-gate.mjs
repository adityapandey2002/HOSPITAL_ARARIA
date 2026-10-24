#!/usr/bin/env node
/**
 * Production dependency audit gate.
 *
 * `npm audit --omit=dev` reports every severity; this gate only fails on
 * important ones, and it fails *loudly* on an expired exception so the list
 * cannot rot:
 *
 *   - critical  → always fails
 *   - high      → fails unless matched by an unexpired allowlist entry
 *   - expired allowlist entries → always fail, even if nothing is vulnerable
 *
 * An allowlist entry names a package and, optionally, the advisory URL. It must
 * carry a reason and an expiry date (YYYY-MM-DD). When no upstream fix exists,
 * the entry documents the compensating control instead of silently ignoring it.
 *
 *   npm run audit:ci
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const allowlistPath = join(root, 'docs/security/audit-allowlist.json');

function loadAllowlist() {
  try {
    const parsed = JSON.parse(readFileSync(allowlistPath, 'utf8'));
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function runAudit() {
  try {
    return JSON.parse(
      execFileSync('npm', ['audit', '--omit=dev', '--json'], {
        cwd: root,
        encoding: 'utf8',
        // npm audit exits non-zero when it finds anything; the JSON on stdout
        // is still the payload we need.
        stdio: ['ignore', 'pipe', 'inherit'],
        shell: process.platform === 'win32',
      })
    );
  } catch (error) {
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

const today = new Date().toISOString().slice(0, 10);
const allowlist = loadAllowlist();
const problems = [];

for (const entry of allowlist) {
  if (!entry.package || !entry.reason || !entry.expires) {
    problems.push(`Malformed allowlist entry: ${JSON.stringify(entry)}`);
  } else if (entry.expires < today) {
    problems.push(
      `Expired audit exception for "${entry.package}" (expired ${entry.expires}). ` +
        'Upgrade the package or renew the documented exception.'
    );
  }
}

const audit = runAudit();
const vulnerabilities = audit.vulnerabilities ?? {};
const blockers = [];

for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  if (vulnerability.severity !== 'high' && vulnerability.severity !== 'critical') continue;

  if (vulnerability.severity === 'critical') {
    blockers.push(`CRITICAL ${name} — ${describe(vulnerability)}`);
    continue;
  }

  const covered = allowlist.find(
    (entry) => entry.package === name && (!entry.advisory || matchesAdvisory(vulnerability, entry.advisory))
  );
  if (!covered) blockers.push(`HIGH ${name} — ${describe(vulnerability)}`);
}

function matchesAdvisory(vulnerability, advisory) {
  return (vulnerability.via ?? []).some(
    (via) => typeof via === 'object' && via.url && via.url.includes(advisory)
  );
}

function describe(vulnerability) {
  const issues = (vulnerability.via ?? [])
    .filter((via) => typeof via === 'object')
    .map((via) => `${via.title} (${via.url})`);
  return issues.length ? issues.join('; ') : vulnerability.range;
}

const counts = audit.metadata?.vulnerabilities ?? {};
const summary = [
  `${counts.critical ?? 0} critical`,
  `${counts.high ?? 0} high`,
  `${counts.moderate ?? 0} moderate`,
  `${counts.low ?? 0} low`,
].join(', ');

if (problems.length) {
  console.error('Audit gate configuration problems:');
  for (const problem of problems) console.error(`  - ${problem}`);
}
if (blockers.length) {
  console.error('Production dependency audit gate failed:');
  for (const blocker of blockers) console.error(`  - ${blocker}`);
}
if (blockers.length || problems.length) {
  console.error(`\nTotals: ${summary}.`);
  process.exit(1);
}

console.log(`OK — no unexcepted critical/high production vulnerabilities (${summary}).`);
