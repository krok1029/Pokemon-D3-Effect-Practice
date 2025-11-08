import { describe, expect, it } from 'vitest';

import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { StatsAverager } from '@/core/domain/services/StatsAverager';
import { PokemonQueries } from '@/core/domain/specifications/PokemonQuery';

import { createBaseStats, createPokemon } from '../../factories/pokemonFactory';
import { PokemonRepositoryStub } from '../../stubs/PokemonRepositoryStub';

describe('GetAveragePokemonStatsUseCase', () => {
  it('returns averaged stats and count including legendaries by default', async () => {
    const pokemons = [
      createPokemon({
        name: 'Alpha',
        stats: createBaseStats({
          hp: 40,
          attack: 50,
          defense: 60,
          spAtk: 70,
          spDef: 80,
          speed: 90,
        }),
      }),
      createPokemon({
        name: 'Beta',
        stats: createBaseStats({
          hp: 50,
          attack: 70,
          defense: 80,
          spAtk: 90,
          spDef: 100,
          speed: 110,
        }),
        isLegendary: true,
      }),
    ];
    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetAveragePokemonStatsUseCase(repository, new StatsAverager());

    const result = await useCase.execute();

    expect(repository.lastQuery).toEqual(PokemonQueries.withLegendaries());
    expect(result).toEqual({
      count: 2,
      stats: [
        { key: 'hp', average: 45 },
        { key: 'attack', average: 60 },
        { key: 'defense', average: 70 },
        { key: 'spAtk', average: 80 },
        { key: 'spDef', average: 90 },
        { key: 'speed', average: 100 },
      ],
    });
  });

  it('can exclude legendary pokemons when requested', async () => {
    const pokemons = [
      createPokemon({
        name: 'Gamma',
        stats: createBaseStats({
          hp: 80,
          attack: 80,
          defense: 80,
          spAtk: 80,
          spDef: 80,
          speed: 80,
        }),
      }),
    ];
    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetAveragePokemonStatsUseCase(repository, new StatsAverager());

    const result = await useCase.execute({ excludeLegendaries: true });

    expect(repository.lastQuery).toEqual(PokemonQueries.nonLegendaries());
    expect(result.count).toBe(1);
    expect(result.stats.every((entry) => entry.average === 80)).toBe(true);
  });
});
