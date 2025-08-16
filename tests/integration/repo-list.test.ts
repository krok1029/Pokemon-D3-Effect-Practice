// tests/integration/repo-list.test.ts
import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { PokemonRepository } from '@/domain/repositories/PokemonRepository';
import {
  PokemonRepository as PokemonRepositoryCsv,
} from '@/infrastructure/repositories/PokemonRepositoryCsv';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：Repository 查詢/排序/分頁', () => {
  it('legendary=true 過濾 + 多欄排序', async () => {
    const repo: PokemonRepository = new PokemonRepositoryCsv(FIXTURE);
    const eff = repo.list({ legendary: true, page: 1, pageSize: 100, sort: 'bst:desc,name:asc' });
    const r = await Effect.runPromise(Effect.either(eff));
    expect(Either.isRight(r)).toBe(true);
    if (Either.isRight(r)) {
      const out = r.right;
      expect(out.data.length).toBeGreaterThan(0);
      expect(out.data.every(p => p.legendary)).toBe(true);
    }
  });
});
