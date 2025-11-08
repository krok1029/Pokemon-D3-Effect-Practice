import { describe, expect, it } from 'vitest';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { StatsAverager } from '@/core/domain/services/StatsAverager';
import { PokemonQueries } from '@/core/domain/specifications/PokemonQuery';

import { createBaseStats, createPokemon } from '../../factories/pokemonFactory';
import { PokemonRepositoryStub } from '../../stubs/PokemonRepositoryStub';

const uniformStats = (value: number) =>
  createBaseStats({
    hp: value,
    attack: value,
    defense: value,
    spAtk: value,
    spDef: value,
    speed: value,
  });

describe('GetAveragePokemonStatsByTypeUseCase', () => {
  it('groups pokemons by both primary and secondary type and returns sorted averages', async () => {
    const pokemons = [
      createPokemon({
        name: 'Flare',
        primaryType: 'fire',
        stats: uniformStats(10),
      }),
      createPokemon({
        name: 'Smaug',
        primaryType: 'fire',
        secondaryType: 'dragon',
        stats: uniformStats(20),
      }),
      createPokemon({
        name: 'Draco',
        primaryType: 'dragon',
        stats: uniformStats(30),
      }),
      createPokemon({
        name: 'Splash',
        primaryType: 'water',
        stats: uniformStats(40),
      }),
    ];

    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetAveragePokemonStatsByTypeUseCase(repository, new StatsAverager());

    const result = await useCase.execute();

    expect(result.types).toEqual([
      {
        type: 'dragon',
        count: 2,
        stats: [
          { key: 'hp', average: 25 },
          { key: 'attack', average: 25 },
          { key: 'defense', average: 25 },
          { key: 'spAtk', average: 25 },
          { key: 'spDef', average: 25 },
          { key: 'speed', average: 25 },
        ],
      },
      {
        type: 'fire',
        count: 2,
        stats: [
          { key: 'hp', average: 15 },
          { key: 'attack', average: 15 },
          { key: 'defense', average: 15 },
          { key: 'spAtk', average: 15 },
          { key: 'spDef', average: 15 },
          { key: 'speed', average: 15 },
        ],
      },
      {
        type: 'water',
        count: 1,
        stats: [
          { key: 'hp', average: 40 },
          { key: 'attack', average: 40 },
          { key: 'defense', average: 40 },
          { key: 'spAtk', average: 40 },
          { key: 'spDef', average: 40 },
          { key: 'speed', average: 40 },
        ],
      },
    ]);
  });

  it('requests non-legendary query when exclude flag is set', async () => {
    const pokemons = [
      createPokemon({
        name: 'NormalMon',
        primaryType: 'grass',
        stats: uniformStats(50),
      }),
    ];
    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetAveragePokemonStatsByTypeUseCase(repository, new StatsAverager());

    await useCase.execute({ excludeLegendaries: true });

    expect(repository.lastQuery).toEqual(PokemonQueries.nonLegendaries());
  });
});
