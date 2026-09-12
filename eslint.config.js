// Flat config (ESLint 9). Lints the API and the poker engine. The web app is
// type-checked by `tsc -b` in its build; it joins the lint gate once its
// existing warnings are cleared (tracked in docs/KNOWN-ISSUES.md).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', 'apps/web/**', 'scripts/**', '**/drizzle/**', '_to_delete/**', 'Claude outputs/**', '**/*.mjs', '**/*.js', '!eslint.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/**/*.ts', 'packages/poker-engine/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'off',
    },
  },
);
