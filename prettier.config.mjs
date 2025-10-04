/**
 * Prettier configuration with Tailwind support.
 * Tailwind class sorting runs via `prettier-plugin-tailwindcss` once installed.
 */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
