import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import { globalIgnores } from 'eslint/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  globalIgnores(['.next/*']),
  {
    ignores: ['.next/*', 'node_modules/*'], // 取代原本的 .eslintignore
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 參數如果以 _ 開頭就不報警告
          varsIgnorePattern: '^_', // 變數如果以 _ 開頭就不報警告
        },
      ],
    },
  },
];

export default eslintConfig;
