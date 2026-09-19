// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const temporaryDirectories: string[] = [];

async function loadPageForRows(rows: string[]) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pokemon-forms-'));
  temporaryDirectories.push(directory);
  const csvPath = path.join(directory, 'pokemon.csv');
  await fs.writeFile(
    csvPath,
    ['Number,Name,Type 1,Type 2,HP,Att,Def,Spa,Spd,Spe,Legendary', ...rows].join('\n'),
  );
  vi.stubEnv('POKEMON_DATA_PATH', csvPath);
  vi.resetModules();
  return import('@/app/pokemon/[id]/page');
}

const charizardRows = [
  '6,Charizard,Fire,Flying,78,84,78,109,85,100,0',
  '6,Mega Charizard Y,Fire,Flying,78,104,78,159,115,100,0',
  '6,Mega Charizard X,Fire,Dragon,78,130,111,130,85,100,0',
];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true })),
  );
});

describe('CSV-backed public form pages', () => {
  it('keeps shared form URLs and legacy species metadata stable when CSV rows are reordered', async () => {
    // GIVEN: The same three forms appear in different CSV orders.
    for (const rows of [charizardRows, [...charizardRows].reverse()]) {
      const { generateMetadata } = await loadPageForRows(rows);

      // WHEN: The public detail route receives a form URL and an old species-only URL.
      const form = await generateMetadata({
        params: Promise.resolve({ id: '6' }),
        searchParams: Promise.resolve({ form: 'mega-charizard-x' }),
      });
      const species = await generateMetadata({ params: Promise.resolve({ id: '6' }) });

      // THEN: Both identities stay independent of the file's row ordering.
      expect(form.title).toBe('Mega Charizard X #006｜寶可夢資料');
      expect(species.title).toBe('Charizard #006｜寶可夢資料');
    }
  });

  it('keeps the regular default when a Mega row appears first in the source', async () => {
    // GIVEN: This species has its Mega form before the regular form in the CSV.
    const { generateMetadata } = await loadPageForRows([
      '719,Mega Diancie,Rock,Fairy,50,160,110,160,110,110,1',
      '719,Diancie,Rock,Fairy,50,100,150,100,150,50,1',
    ]);

    // WHEN: An old species-only URL is opened.
    const metadata = await generateMetadata({ params: Promise.resolve({ id: '719' }) });

    // THEN: Row position cannot accidentally choose Mega Diancie.
    expect(metadata.title).toBe('Diancie #719｜寶可夢資料');
  });

  it('rejects colliding form identities instead of silently displaying either row', async () => {
    // GIVEN: Two distinct source names normalize to the same shareable form identity.
    const { generateMetadata } = await loadPageForRows([
      '6,Mega Charizard X,Fire,Dragon,78,130,111,130,85,100,0',
      '6,Mega-Charizard-X,Fire,Flying,78,104,78,159,115,100,0',
    ]);

    // WHEN: The conflicting URL is requested.
    const metadata = generateMetadata({
      params: Promise.resolve({ id: '6' }),
      searchParams: Promise.resolve({ form: 'mega-charizard-x' }),
    });

    // THEN: Ambiguous data is rejected with a useful identity error.
    await expect(metadata).rejects.toThrow('Duplicate Pokemon form identity: 6/mega-charizard-x');
  });
});
