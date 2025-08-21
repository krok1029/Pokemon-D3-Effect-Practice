import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Effect } from 'effect';
import { TYPES, type TypeName, type Multiplier } from '@/domain/types';
import type { Pokemon } from '@/domain/pokemon';
import type { EffectPokemonRepository } from '@/application/repositories/EffectPokemonRepository';
import { setPokemonRepository, createPokemonRepository } from '@/infrastructure/config';
import { GET } from '@/app/api/pokemon/route';

class MockRepo implements EffectPokemonRepository {
  constructor(private readonly data: Pokemon[]) {}
  getAll() {
    return Effect.succeed(this.data);
  }
  getById(id: number) {
    const p = this.data.find((x) => x.id === id);
    return p ? Effect.succeed(p) : Effect.fail(new Error('not found'));
  }
  getByIdWithSimilar(id: number, _k: number) {
    const p = this.data.find((x) => x.id === id);
    if (!p) return Effect.fail(new Error('not found'));
    return Effect.succeed({ pokemon: p, similar: [] });
  }
}

function dummyPokemon(id: number): Pokemon {
  const against = Object.fromEntries(
    TYPES.map((t) => [t, 1])
  ) as Record<TypeName, Multiplier>;
  return {
    id,
    name: `P${id}`,
    type1: 'Normal',
    type2: null,
    abilities: [],
    generation: 1,
    legendary: false,
    against,
    hp: 1,
    attack: 1,
    defense: 1,
    sp_atk: 1,
    sp_def: 1,
    speed: 1,
    bst: 6,
  };
}

describe('API route uses configured repository', () => {
  afterEach(() => {
    setPokemonRepository(createPokemonRepository());
  });

  it('returns data from mock repository', async () => {
    setPokemonRepository(new MockRepo([dummyPokemon(1234)]));
    const req = new NextRequest('http://test.local/api/pokemon');
    const res = await GET(req);
    const json = (await res.json()) as { data: Pokemon[] };
    expect(json.data[0].id).toBe(1234);
  });
});
