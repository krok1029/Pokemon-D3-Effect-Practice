import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { globalIgnores } from 'eslint/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadPlugin(name) {
  try {
    const mod = await import(name);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

const compat = new FlatCompat({ baseDirectory: __dirname });

const importPlugin = await loadPlugin('eslint-plugin-import');
const prettierPlugin = await loadPlugin('eslint-plugin-prettier');

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  globalIgnores(['.next/**', 'node_modules/**']),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      ...(importPlugin ? { import: importPlugin } : {}),
      ...(prettierPlugin ? { prettier: prettierPlugin } : {}),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      ...(importPlugin
        ? {
            'import/order': [
              'warn',
              {
                'newlines-between': 'always',
                alphabetize: { order: 'asc', caseInsensitive: true },
                groups: [
                  ['builtin', 'external'],
                  ['internal'],
                  ['parent', 'sibling', 'index'],
                  ['type'],
                ],
                pathGroups: [
                  { pattern: '@/app/**', group: 'internal', position: 'after' },
                  { pattern: '@/di/**', group: 'internal', position: 'after' },
                  { pattern: '@/core/**', group: 'internal', position: 'after' },
                  { pattern: '@/adapters/**', group: 'internal', position: 'after' },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
              },
            ],
          }
        : {}),
      ...(prettierPlugin
        ? {
            'prettier/prettier': 'warn',
          }
        : {}),
    },
  },
];

export default config;
