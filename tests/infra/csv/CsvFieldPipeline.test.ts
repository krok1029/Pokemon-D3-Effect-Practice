import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildPokemonDetailPageViewModel } from '@/app/pokemon/view-models/pokemonDetailViewModel';
import { buildPokemonListPage } from '@/app/pokemon/view-models/pokemonListViewModel';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';
import { StatsAverager } from '@/core/domain/services/StatsAverager';

import { CsvPokemonRepository } from '@/infra/csv/CsvPokemonRepository';

const header = 'Number,Name,Type 1,Type 2,HP,Att,Def,Spa,Spd,Spe,Legendary';

async function withCsv(
  content: string,
  verify: (repository: CsvPokemonRepository) => Promise<void>,
) {
  const directory = await mkdtemp(path.join(tmpdir(), 'pokemon-csv-fields-'));
  try {
    const filePath = path.join(directory, 'pokemon.csv');
    await writeFile(filePath, `${header}\n${content}\n`);
    await verify(new CsvPokemonRepository(filePath));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe('CSV field validation through application and display models', () => {
  it('keeps mixed-case types consistent in DTOs, filters, averages and matchups', async () => {
    await withCsv(
      [
        '25,Pikachu, eLeCtRiC ,none,35,55,40,50,50,90,False',
        '26,Raichu,ELECTRIC, Fairy ,65,55,40,50,50,90,1.0',
      ].join('\n'),
      async (repository) => {
        const target = new GetPokemonBaseStatsUseCase(repository);

        const entries = await target.execute();
        const nonLegendaries = await target.execute({ excludeLegendaries: true });
        const averages = await new GetAveragePokemonStatsByTypeUseCase(
          repository,
          new StatsAverager(),
        ).execute();
        const list = buildPokemonListPage(entries, new URLSearchParams('type=electric'));
        const detail = buildPokemonDetailPageViewModel([entries[0]]).pokemons[0];

        expect(entries.map((entry) => [entry.primaryType, entry.secondaryType])).toEqual([
          ['Electric', null],
          ['Electric', 'Fairy'],
        ]);
        expect(nonLegendaries.map((entry) => entry.name)).toEqual(['Pikachu']);
        expect(averages.types.map((group) => [group.type, group.count])).toEqual([
          ['Electric', 2],
          ['Fairy', 1],
        ]);
        expect(averages.types[0].stats.find((stat) => stat.key === 'hp')?.average).toBe(50);
        expect(list.total).toBe(2);
        expect(list.typeOptions.map((type) => type.slug).sort()).toEqual(['electric', 'fairy']);
        expect(detail.offenseMatchups.find((type) => type.slug === 'water')?.multiplier).toBe(2);
        expect(detail.offenseMatchups.find((type) => type.slug === 'ground')?.multiplier).toBe(0);
        expect(detail.defenseMatchups.find((type) => type.slug === 'ground')?.multiplier).toBe(2);
      },
    );
  });

  it.each([
    ['Electrc,none,35,55,40,50,50,90,0', 'Type 1'],
    ['Electric,none,35,55,40,50,50,90,tru', 'Legendary'],
  ])('rejects a contaminated row before it can become a DTO: %s', async (values, column) => {
    await withCsv(`25,Pikachu,${values}`, async (repository) => {
      const target = new GetPokemonBaseStatsUseCase(repository);

      await expect(target.execute()).rejects.toThrow(`Row 1: column "${column}"`);
    });
  });

  it('rejects duplicate normalized types before repository data becomes a DTO', async () => {
    await withCsv(
      [
        '26,Raichu,Electric,none,60,90,55,90,80,110,0',
        '25,Pikachu,Electric, eLeCtRiC ,35,55,40,50,50,90,0',
      ].join('\n'),
      async (repository) => {
        const target = new GetPokemonBaseStatsUseCase(repository);

        await expect(target.execute()).rejects.toThrow(
          'Row 2: column "Type 2" must differ from "Type 1"',
        );
      },
    );
  });
});
