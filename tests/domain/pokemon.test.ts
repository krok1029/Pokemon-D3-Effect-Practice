import { describe, it, expect } from 'vitest';
import { TYPES, type TypeName, type Multiplier } from '@/domain/pokemon/types';
import { parseAbilities, multiplyAgainst } from '@/domain/pokemon/Pokemon';

describe('Abilities 與相剋工具函式', () => {
  it('parseAbilities：能以逗號/分號切割、修剪空白並去重（忽略大小寫）', () => {
    expect(parseAbilities('Overgrow, Chlorophyll; Overgrow ')).toEqual(['Overgrow', 'Chlorophyll']);
    expect(parseAbilities('')).toEqual([]);
  });

  it('multiplyAgainst：逐型別相乘，且結果必為合法倍率集合', () => {
    function baseAgainst(v: Multiplier = 1): Record<TypeName, Multiplier> {
      return Object.fromEntries(TYPES.map(t => [t, v])) as Record<TypeName, Multiplier>;
    }

    const a = baseAgainst(1);
    a.Fire = 0.5 as Multiplier;   // 對 Fire 抗
    a.Water = 2 as Multiplier;    // 對 Water 弱

    const b = baseAgainst(1);
    b.Fire = 2 as Multiplier;     // 另一屬性對 Fire 弱
    b.Grass = 0.5 as Multiplier;  // 對 Grass 抗

    const c = multiplyAgainst(a, b);
    expect(c.Fire).toBe(1);       // 0.5 * 2 = 1
    expect(c.Water).toBe(2);
    expect(c.Grass).toBe(0.5);

    for (const t of TYPES) {
      expect([0, 0.25, 0.5, 1, 2, 4]).toContain(c[t]);
    }
  });
});
