import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { defineConfig, globalIgnores } from 'eslint/config';

// npm installs `next` inside this workspace but hoists `eslint-config-next` to
// the repo root, where it cannot resolve the `next/...` modules it requires.
// Add the workspace's node_modules to the module search path before the shared
// config is loaded. This is a no-op when next is hoisted next to the config.
const require = createRequire(import.meta.url);
const workspaceNodeModules = path.dirname(
  path.dirname(require.resolve('next/package.json')),
);
process.env.NODE_PATH = [workspaceNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

const { default: nextVitals } = await import('eslint-config-next/core-web-vitals');
const { default: nextTs } = await import('eslint-config-next/typescript');

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Keep the severities this app used before the move to ESLint 9: unused
      // identifiers and `any` are reported, but do not fail the lint run.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // New in eslint-plugin-react-hooks v7 (pulled in by eslint-config-next 16):
      // the app loads data in mount effects, which this React Compiler rule
      // reports for its extra render. Keep it visible without failing lint;
      // these call sites predate the upgrade and are not migration regressions.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores([
    // Defaults from eslint-config-next.
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    // Previously outside `next lint`'s scope.
    'scripts/**',
    '*.config.js',
    '*.config.ts',
  ]),
]);
