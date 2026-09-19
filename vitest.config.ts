import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    setupFiles: ['tests/setup.ts'],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
