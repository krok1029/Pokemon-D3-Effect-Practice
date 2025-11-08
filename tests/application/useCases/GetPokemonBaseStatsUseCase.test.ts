import { describe, expect, it } from 'vitest';

import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';
import { PokemonQueries } from '@/core/domain/specifications/PokemonQuery';

import { createBaseStats, createPokemon } from '../../factories/pokemonFactory';
import { PokemonRepositoryStub } from '../../stubs/PokemonRepositoryStub';

describe('GetPokemonBaseStatsUseCase', () => {
  it('maps repository pokemons into DTO entries', async () => {
    const pokemons = [
      createPokemon({
        id: 25,
        name: 'Pikachu',
        primaryType: 'electric',
        secondaryType: null,
        stats: createBaseStats({
          hp: 35,
          attack: 55,
          defense: 40,
          spAtk: 50,
          spDef: 50,
          speed: 90,
        }),
      }),
      createPokemon({
        id: 150,
        name: 'Mewtwo',
        primaryType: 'psychic',
        secondaryType: null,
        isLegendary: true,
        stats: createBaseStats({
          hp: 106,
          attack: 110,
          defense: 90,
          spAtk: 154,
          spDef: 90,
          speed: 130,
        }),
      }),
    ];

    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetPokemonBaseStatsUseCase(repository);

    const result = await useCase.execute();

    expect(repository.lastQuery).toEqual(PokemonQueries.withLegendaries());
    expect(result).toEqual([
      {
        id: 25,
        name: 'Pikachu',
        isLegendary: false,
        primaryType: 'electric',
        secondaryType: null,
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          spAtk: 50,
          spDef: 50,
          speed: 90,
        },
      },
      {
        id: 150,
        name: 'Mewtwo',
        isLegendary: true,
        primaryType: 'psychic',
        secondaryType: null,
        stats: {
          hp: 106,
          attack: 110,
          defense: 90,
          spAtk: 154,
          spDef: 90,
          speed: 130,
        },
      },
    ]);
  });

  it('can request non-legendaries only', async () => {
    const pokemons = [
      createPokemon({
        name: 'Bulbasaur',
        primaryType: 'grass',
        stats: createBaseStats({
          hp: 45,
          attack: 49,
          defense: 49,
          spAtk: 65,
          spDef: 65,
          speed: 45,
        }),
      }),
    ];
    const repository = new PokemonRepositoryStub(pokemons);
    const useCase = new GetPokemonBaseStatsUseCase(repository);

    await useCase.execute({ excludeLegendaries: true });

    expect(repository.lastQuery).toEqual(PokemonQueries.nonLegendaries());
  });
});
