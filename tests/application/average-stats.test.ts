import { describe, it, expect } from 'vitest';
import { average } from '@/core/application/pokemon/AverageStats';
import type { Pokemon, PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';
import { TYPES } from '@/core/domain/pokemon/types';

const againstOnes = Object.fromEntries(TYPES.map((t) => [t, 1])) as Pokemon['against'];

describe('Application:average', () => {
  it('computes per-metric averages and rounds to 0.1', async () => {
    const repo: PokemonRepository = {
      getAll: async () => [
        createPokemon({ id: 1, hp: 10, attack: 20, defense: 30, sp_atk: 40, sp_def: 50, speed: 60 }),
        createPokemon({ id: 2, hp: 0, attack: 10, defense: 20, sp_atk: 30, sp_def: 40, speed: 50 }),
      ],
      getById: async () => createPokemon({ id: 99 }),
      getByIdWithSimilar: async () => ({ pokemon: createPokemon({ id: 100 }), similar: [] }),
      list: async () => ({ total: 0, page: 1, pageSize: 0, data: [] }),
    };

    const result = await average(repo);
    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right.count).toBe(2);
      const avgs = Object.fromEntries(result.right.avgs.map((x) => [x.key, x.value]));
      expect(avgs).toMatchObject({
        hp: 5,
        attack: 15,
        defense: 25,
        sp_atk: 35,
        sp_def: 45,
        speed: 55,
      });
    }
  });

  it('propagates repository errors as ServiceError', async () => {
    const repo: PokemonRepository = {
      getAll: async () => {
        throw new Error('boom');
      },
      getById: async () => createPokemon({ id: 1 }),
      getByIdWithSimilar: async () => ({ pokemon: createPokemon({ id: 1 }), similar: [] }),
      list: async () => ({ total: 0, page: 1, pageSize: 0, data: [] }),
    };

    const result = await average(repo);
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('InvalidInput');
    }
  });
});

function createPokemon(overrides: Partial<Pokemon> & { id: number }): Pokemon {
  return {
    id: overrides.id,
    name: overrides.name ?? `Pokemon-${overrides.id}`,
    type1: overrides.type1 ?? 'Normal',
    type2: overrides.type2 ?? null,
    abilities: overrides.abilities ?? [],
    generation: overrides.generation ?? 1,
    legendary: overrides.legendary ?? false,
    against: overrides.against ?? againstOnes,
    hp: overrides.hp ?? 1,
    attack: overrides.attack ?? 1,
    defense: overrides.defense ?? 1,
    sp_atk: overrides.sp_atk ?? 1,
    sp_def: overrides.sp_def ?? 1,
    speed: overrides.speed ?? 1,
    bst: overrides.bst ?? 6,
    mean: overrides.mean,
    sd: overrides.sd,
    expType: overrides.expType,
    expTo100: overrides.expTo100,
    finalEvolution: overrides.finalEvolution,
    catchRate: overrides.catchRate,
    mega: overrides.mega,
    alolan: overrides.alolan,
    galarian: overrides.galarian,
    height: overrides.height,
    weight: overrides.weight,
    bmi: overrides.bmi,
  };
}
