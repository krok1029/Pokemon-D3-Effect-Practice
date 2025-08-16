import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { readCsv } from '@/infrastructure/csv/CsvService';
import { parsePokemonCsv } from '@/infrastructure/csv/pokemonCsv';
import { PokemonRepositoryCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';
import { NotFound } from '@/application/repositories/PokemonRepository';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：單筆 + 相似度', () => {
  it('能取第一筆資料的詳細與相似度 top K（不包含自己）', async () => {
    // 先讀取 CSV 拿到一個存在的 id
    const rows = await Effect.runPromise(
      readCsv(FIXTURE).pipe(Effect.flatMap(parsePokemonCsv))
    );
    expect(rows.length).toBeGreaterThan(0);

    const id = rows[0].Number;
    const k = 5;

    const repo = new PokemonRepositoryCsv(FIXTURE);
    const eff = repo.getByIdWithSimilar(id, k);
    const r = await Effect.runPromise(Effect.either(eff));
    expect(Either.isRight(r)).toBe(true);

    if (Either.isRight(r)) {
      const { pokemon, similar } = r.right;
      expect(pokemon.id).toBe(id);
      expect(similar.length).toBeLessThanOrEqual(k);
      // 不包含自己
      expect(similar.some((p) => p.id === id)).toBe(false);
      // 相似清單穩定存在
      expect(similar.length).toBeGreaterThan(0);
    }
  });

  it('找不到 id 時回 NotFound', async () => {
    const repo = new PokemonRepositoryCsv(FIXTURE);
    const eff = repo.getByIdWithSimilar(9999, 0);

    const r = await Effect.runPromise(Effect.either(eff));
    expect(Either.isLeft(r)).toBe(true);

    if (Either.isLeft(r)) {
      expect(r.left).toBeInstanceOf(NotFound); // ← 這裡檢查你的 NotFound
      expect(String(r.left)).toContain('Pokemon 9999'); //（可選）訊息也驗證一下
    }
  });
});
