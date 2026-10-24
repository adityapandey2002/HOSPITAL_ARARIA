import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

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
