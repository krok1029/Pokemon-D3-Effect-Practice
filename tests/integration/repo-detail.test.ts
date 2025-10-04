import { describe, it, expect } from 'vitest';
import { readCsv } from '@/adapters/csv/CsvService';
import { parsePokemonCsv } from '@/adapters/csv/pokemonCsv';
import { PokemonRepositoryCsv } from '@/adapters/repo/PokemonRepositoryCsv';
import { NotFound } from '@/core/domain/pokemon/PokemonRepository';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：單筆 + 相似度', () => {
  it('能取第一筆資料的詳細與相似度 top K（不包含自己）', async () => {
    // 先讀取 CSV 拿到一個存在的 id
    const rows = parsePokemonCsv(await readCsv(FIXTURE));
    expect(rows.length).toBeGreaterThan(0);

    const id = rows[0].Number;
    const k = 5;

    const repo = new PokemonRepositoryCsv(FIXTURE);
    const { pokemon, similar } = await repo.getByIdWithSimilar(id, k);
    expect(pokemon.id).toBe(id);
    expect(similar.length).toBeLessThanOrEqual(k);
    // 不包含自己
    expect(similar.some((p) => p.id === id)).toBe(false);
    // 相似清單穩定存在
    expect(similar.length).toBeGreaterThan(0);
  });

  it('找不到 id 時回 NotFound', async () => {
    const repo = new PokemonRepositoryCsv(FIXTURE);
    await expect(repo.getByIdWithSimilar(9999, 0)).rejects.toBeInstanceOf(NotFound);
  });
});
