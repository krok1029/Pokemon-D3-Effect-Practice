// tests/integration/repo-list.test.ts
import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { PokemonRepositoryCsv } from '@/infrastructure/repo/PokemonRepositoryCsv';
import { list } from '@/application/pokemon/ListPokemons';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：Application 查詢/排序/分頁', () => {
  it('legendary=true 過濾 + 多欄排序', async () => {
    const repo = new PokemonRepositoryCsv(FIXTURE);
    const eff = list(repo, {
      legendary: 'true',
      page: '1',
      pageSize: '100',
      sort: 'bst:desc,name:asc',
    });
    const r = await Effect.runPromise(eff);
    expect(Either.isRight(r)).toBe(true);
    if (Either.isRight(r)) {
      const out = r.right;
      expect(out.page).toBe(1);
      expect(out.pageSize).toBe(100);
      expect(out.total).toBeGreaterThan(0);
      expect(out.data.length).toBeGreaterThan(0);
      expect(out.data.every((p) => p.legendary)).toBe(true);
    }
  });
});
