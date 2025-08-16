// tests/integration/csv-read.test.ts
import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { readPokemonCsv } from '@/infrastructure/csv/CsvService';
import { TYPES } from '@/domain/types';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：CSV 載入與映射', () => {
  it('能讀取 30 筆並映射完整欄位', async () => {
    const r = await Effect.runPromise(Effect.either(readPokemonCsv(FIXTURE)));
    expect(Either.isRight(r)).toBe(true);
    if (Either.isRight(r)) {
      const rows = r.right;
      expect(rows.length).toBe(30);
      expect(rows[0]).toHaveProperty('name');
      expect(Object.keys(rows[0].against)).toHaveLength(TYPES.length);
    }
  });
});
