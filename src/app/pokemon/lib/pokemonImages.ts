import fs from 'node:fs';
import path from 'node:path';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'img');

let imageCache: Map<number, string | null> | null = null;

function buildImageCache(): Map<number, string | null> {
  const cache = new Map<number, string | null>();
  try {
    const entries = fs.readdirSync(IMAGE_DIR);
    for (const file of entries) {
      const match = file.match(/^(\d{3})/);
      if (!match) continue;
      const id = Number.parseInt(match[1], 10);
      if (!cache.has(id)) {
        cache.set(id, `/img/${file}`);
      }
    }
  } catch {
    // Ignore missing directory or read errors; cache stays empty.
  }
  return cache;
}

function ensureImageCache(): Map<number, string | null> {
  if (!imageCache) {
    imageCache = buildImageCache();
  }
  return imageCache;
}

export function findPokemonImagePath(id: number): string | null {
  const cache = ensureImageCache();
  return cache.get(id) ?? null;
}
