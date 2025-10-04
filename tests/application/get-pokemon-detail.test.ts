import { describe, it, expect } from 'vitest';

import { detail } from '@/core/application/pokemon/GetPokemonDetail';
import type { Pokemon, PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';
import { NotFound } from '@/core/domain/pokemon/PokemonRepository';
import { TYPES } from '@/core/domain/pokemon/types';

const dummyAgainst = Object.fromEntries(TYPES.map((t) => [t, 1])) as Pokemon['against'];
const dummyPokemon: Pokemon = {
  id: 42,
  name: 'Pikachu',
  type1: 'Electric',
  type2: null,
  abilities: [],
  generation: 1,
  legendary: false,
  against: dummyAgainst,
  hp: 1,
  attack: 1,
  defense: 1,
  sp_atk: 1,
  sp_def: 1,
  speed: 1,
  bst: 6,
};

describe('Application:detail', () => {
  it('parses path/query and uses default similar count', async () => {
    let captured: { id: number; k: number } | null = null;
    const repo: PokemonRepository = {
      getAll: async () => [dummyPokemon],
      getById: async () => dummyPokemon,
      getByIdWithSimilar: async (id, k) => {
        captured = { id, k };
        return { pokemon: dummyPokemon, similar: [] };
      },
      list: async () => ({ total: 0, page: 1, pageSize: 0, data: [] }),
    };

    const result = await detail(repo, { path: { id: '42' }, query: {} });
    expect(result._tag).toBe('Right');
    expect(captured).toEqual({ id: 42, k: 5 });
  });

  it('rejects invalid id input', async () => {
    const repo: PokemonRepository = {
      getAll: async () => [dummyPokemon],
      getById: async () => dummyPokemon,
      getByIdWithSimilar: async () => ({ pokemon: dummyPokemon, similar: [] }),
      list: async () => ({ total: 0, page: 1, pageSize: 0, data: [] }),
    };

    const result = await detail(repo, { path: { id: '' }, query: {} });
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('InvalidInput');
    }
  });

  it('funnels repository NotFound into Left', async () => {
    const repo: PokemonRepository = {
      getAll: async () => [dummyPokemon],
      getById: async () => dummyPokemon,
      getByIdWithSimilar: async () => {
        throw new NotFound('missing');
      },
      list: async () => ({ total: 0, page: 1, pageSize: 0, data: [] }),
    };

    const result = await detail(repo, { path: { id: '999' }, query: { k: '3' } });
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(NotFound);
    }
  });
});
