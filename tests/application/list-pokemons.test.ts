import { describe, it, expect } from 'vitest';
import { list } from '@/core/application/pokemon/ListPokemons';
import type {
  Pokemon,
  PokemonListParams,
  PokemonListResult,
  PokemonRepository,
} from '@/core/domain/pokemon/PokemonRepository';
import { TYPES } from '@/core/domain/pokemon/types';

const noopPokemon: Pokemon = {
  id: 0,
  name: 'noop',
  type1: 'Normal',
  type2: null,
  abilities: [],
  generation: 1,
  legendary: false,
  against: Object.fromEntries(TYPES.map((t) => [t, 1])) as Pokemon['against'],
  hp: 1,
  attack: 1,
  defense: 1,
  sp_atk: 1,
  sp_def: 1,
  speed: 1,
  bst: 6,
};

describe('Application:list', () => {
  it('normalizes query parameters before delegating to repository', async () => {
    const captured: PokemonListParams[] = [];
    const repo: PokemonRepository = {
      getAll: async () => [noopPokemon],
      getById: async () => noopPokemon,
      getByIdWithSimilar: async () => ({ pokemon: noopPokemon, similar: [] }),
      list: async (params) => {
        captured.push(params);
        return Promise.resolve<PokemonListResult>({
          total: 1,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 0,
          data: [noopPokemon],
        });
      },
    };

    const result = await list(repo, {
      q: ' Pikachu  ',
      legendary: 'true',
      page: '2',
      pageSize: '500',
      sort: 'HP:DESC',
    });

    expect(result._tag).toBe('Right');
    expect(captured[0]).toEqual({
      q: 'Pikachu',
      legendary: true,
      page: 2,
      pageSize: 200,
      sort: 'hp:desc',
    });
  });

  it('returns InvalidInput when numeric fields cannot be parsed', async () => {
    const repo: PokemonRepository = {
      getAll: async () => [noopPokemon],
      getById: async () => noopPokemon,
      getByIdWithSimilar: async () => ({ pokemon: noopPokemon, similar: [] }),
      list: async () => {
        throw new Error('should not be called');
      },
    };

    const result = await list(repo, { page: 'NaN' });
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('InvalidInput');
    }
  });
});

