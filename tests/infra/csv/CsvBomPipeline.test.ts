import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';

import { CsvPokemonRepository } from '@/infra/csv/CsvPokemonRepository';
import { readCsvFile } from '@/infra/csv/readCsv';

describe('UTF-8 BOM CSV through the repository', () => {
  it('loads the same field values and DTOs as an unmarked UTF-8 file', async () => {
    // Given: both files contain identical CSV data; only one starts with a BOM.
    const directory = await mkdtemp(path.join(tmpdir(), 'pokemon-csv-bom-'));
    const content = [
      'Number,Name,Type 1,Type 2,HP,Att,Def,Spa,Spd,Spe,Legendary',
      '025,Pikachu,Electric,none,35,55,40,50,50,90,0.0',
      '6,Mega Charizard X,Fire,Dragon,78,130,111,130,85,100,1.0',
      '',
    ].join('\n');
    const plainPath = path.join(directory, 'plain.csv');
    const bomPath = path.join(directory, 'bom.csv');

    try {
      await writeFile(plainPath, content, 'utf8');
      await writeFile(bomPath, `\uFEFF${content}`, 'utf8');
      const target = new GetPokemonBaseStatsUseCase(new CsvPokemonRepository(bomPath));

      // When: the BOM file is read and converted by the real repository and use case.
      const rows = await readCsvFile(bomPath);
      const entries = await target.execute();

      // Then: parsing preserves raw values and application values match the plain file.
      expect(rows).toEqual(await readCsvFile(plainPath));
      expect(rows[0]).toEqual({
        Number: '025',
        Name: 'Pikachu',
        'Type 1': 'Electric',
        'Type 2': 'none',
        HP: '35',
        Att: '55',
        Def: '40',
        Spa: '50',
        Spd: '50',
        Spe: '90',
        Legendary: '0.0',
      });
      expect(entries).toEqual(
        await new GetPokemonBaseStatsUseCase(new CsvPokemonRepository(plainPath)).execute(),
      );
      expect(
        entries.map(({ id, name, primaryType, secondaryType, isLegendary, stats }) => ({
          id,
          name,
          primaryType,
          secondaryType,
          isLegendary,
          stats,
        })),
      ).toEqual([
        {
          id: 25,
          name: 'Pikachu',
          primaryType: 'Electric',
          secondaryType: null,
          isLegendary: false,
          stats: { hp: 35, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
        },
        {
          id: 6,
          name: 'Mega Charizard X',
          primaryType: 'Fire',
          secondaryType: 'Dragon',
          isLegendary: true,
          stats: { hp: 78, attack: 130, defense: 111, spAtk: 130, spDef: 85, speed: 100 },
        },
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
