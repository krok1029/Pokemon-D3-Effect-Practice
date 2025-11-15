import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createModule = async () => {
  vi.resetModules();
  return import('@/app/pokemon/lib/pokemonImages');
};

describe('findPokemonImagePath', () => {
  let originalCwd: string;
  let tmpDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokemon-img-test-'));
    process.chdir(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'public', 'img'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns image path when a file with matching id prefix exists', async () => {
    const filePath = path.join(tmpDir, 'public', 'img', '025_Pikachu.png');
    fs.writeFileSync(filePath, 'fake image bytes');

    const { findPokemonImagePath } = await createModule();

    expect(findPokemonImagePath(25)).toBe('/img/025_Pikachu.png');
  });

  it('returns null when no matching image is found', async () => {
    const { findPokemonImagePath } = await createModule();

    expect(findPokemonImagePath(999)).toBeNull();
  });
});
