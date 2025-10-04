// tests/integration/repo-list.test.ts
import { describe, it, expect } from 'vitest';

import { list } from '@/core/application/pokemon/ListPokemons';
import { isOk } from '@/core/shared/result';

import { PokemonRepositoryCsv } from '@/adapters/repo/PokemonRepositoryCsv';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：Application 查詢/排序/分頁', () => {
  it('legendary=true 過濾 + 多欄排序', async () => {
    const repo = new PokemonRepositoryCsv(FIXTURE);
    const res = await list(repo, {
      legendary: 'true',
      page: '1',
      pageSize: '100',
      sort: 'bst:desc,name:asc',
    });
    expect(isOk(res)).toBe(true);
    if (isOk(res)) {
      const out = res.right;
      expect(out.page).toBe(1);
      expect(out.pageSize).toBe(100);
      expect(out.total).toBeGreaterThan(0);
      expect(out.data.length).toBeGreaterThan(0);
      expect(out.data.every((p) => p.legendary)).toBe(true);
    }
  });
});
