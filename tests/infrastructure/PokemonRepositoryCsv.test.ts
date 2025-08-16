import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import fs from 'node:fs/promises';
import { PokemonRepositoryCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('PokemonRepositoryCsv caching', () => {
  it('reads csv only once for multiple operations', async () => {
    const spy = vi.spyOn(fs, 'readFile');

    const repo = new PokemonRepositoryCsv(FIXTURE);
    const all = await Effect.runPromise(repo.getAll());
    const id = all[0].id;

    await Effect.runPromise(repo.getById(id));
    await Effect.runPromise(repo.getByIdWithSimilar(id, 2));
    await Effect.runPromise(repo.getAll());

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
