// tests/adapters/pokemonCsv.test.ts
import { describe, it, expect } from 'vitest';

import { parsePokemonCsv, toPokemon } from '@/adapters/csv/pokemonCsv';

describe('Domain：CSV Row → 內部模型映射', () => {
  it('能把最小必要欄位的 Row 轉為內部 Pokemon 物件', () => {
    const rowLike = {
      Number: '25',
      Name: 'Pikachu',
      'Type 1': 'Electric',
      HP: '35',
      Att: '55',
      Def: '40',
      Spa: '50',
      Spd: '50',
      Spe: '90',
      BST: '320',
      Generation: '1',
      Legendary: 'false',
      // 其餘欄位缺省 → 解析時允許；Against* 會在映射時補 1
    };

    const [decoded] = parsePokemonCsv([rowLike]);
    const p = toPokemon(decoded);

    expect(p.id).toBe(25);
    expect(p.name).toBe('Pikachu');
    expect(p.type1).toBe('Electric');
    expect(p.legendary).toBe(false);
    expect(p.against.Electric).toBe(1);
  });
});
