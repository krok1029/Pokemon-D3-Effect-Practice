import fs from 'node:fs';
import path from 'node:path';

import formImages from './pokemonFormImages.json';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'img');
const FORM_IMAGES: Readonly<Record<string, string>> = formImages;
let imageCache: Map<number, Set<string>> | null = null;

function ensureImageCache(): Map<number, Set<string>> {
  if (imageCache) return imageCache;
  const cache = new Map<number, Set<string>>();
  try {
    for (const entry of fs.readdirSync(IMAGE_DIR, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const match = /^(\d{3,4})[_-][^/\\]+\.(?:png|jpe?g|webp|avif)$/i.exec(entry.name);
      if (!match) continue;
      const id = Number(match[1]);
      const files = cache.get(id) ?? new Set<string>();
      files.add(entry.name);
      cache.set(id, files);
    }
  } catch {
    // Missing or unreadable image directories use the same placeholder as missing files.
  }
  imageCache = cache;
  return cache;
}

export function findPokemonImagePath(id: number, formId?: string): string | null {
  const files = ensureImageCache().get(id);
  if (!files) return null;
  if (formId !== undefined) {
    const file = FORM_IMAGES[`${id}:${formId}`];
    return file && files.has(file) ? `/img/${file}` : null;
  }
  // Legacy species-only callers may use an unambiguous asset, never the first of several.
  return files.size === 1 ? `/img/${files.values().next().value}` : null;
}
