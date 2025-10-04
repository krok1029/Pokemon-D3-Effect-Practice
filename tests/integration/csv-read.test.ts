// tests/integration/csv-read.test.ts
import { describe, it, expect } from 'vitest';
import { readCsv } from '@/infrastructure/csv/CsvService';
import { parsePokemonCsv } from '@/infrastructure/csv/pokemonCsv';

const FIXTURE = 'data/pokemon_fixture_30.csv';

describe('整合：CSV 解析', () => {
  it('能讀取 30 筆並解析欄位', async () => {
    const rawRows = await readCsv(FIXTURE);
    const rows = parsePokemonCsv(rawRows);
    expect(rows.length).toBe(30);
    expect(rows[0]).toHaveProperty('Name');
    expect(rows[0]).toHaveProperty('Against Fire');
  });
});
