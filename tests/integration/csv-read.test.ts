// tests/integration/csv-read.test.ts
import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { readPokemonCsv } from '@/infrastructure/csv/CsvService';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：CSV 解析', () => {
  it('能讀取 30 筆並解析欄位', async () => {
    const r = await Effect.runPromise(Effect.either(readPokemonCsv(FIXTURE)));
    expect(Either.isRight(r)).toBe(true);
    if (Either.isRight(r)) {
      const rows = r.right;
      expect(rows.length).toBe(30);
      expect(rows[0]).toHaveProperty('Name');
      expect(rows[0]).toHaveProperty('Against Fire');
    }
  });
});
