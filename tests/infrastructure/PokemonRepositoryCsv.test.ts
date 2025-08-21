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

describe('PokemonRepositoryCsv list', () => {
  it('supports filtering, sorting and pagination', async () => {
    const repo = new PokemonRepositoryCsv(FIXTURE);
    const out = await Effect.runPromise(
      repo.list({ legendary: true, page: 1, pageSize: 100, sort: 'bst:desc,name:asc' })
    );
    expect(out.total).toBeGreaterThan(0);
    expect(out.data.length).toBeGreaterThan(0);
    expect(out.data.every((p) => p.legendary)).toBe(true);
  });
});
