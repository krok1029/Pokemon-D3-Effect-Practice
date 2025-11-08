import { describe, expect, it } from 'vitest';

import { Pokemon } from '@/core/domain/entities/Pokemon';
import { BaseStats } from '@/core/domain/valueObjects/BaseStats';

const stats = BaseStats.create({
  hp: 45,
  attack: 49,
  defense: 49,
  spAtk: 65,
  spDef: 65,
  speed: 45,
});

describe('Pokemon entity', () => {
  it('exposes primary and optional secondary types', () => {
    const primaryOnly = new Pokemon(1, 'Bulbasaur', stats, false, 'grass', null);
    expect(primaryOnly.types).toEqual(['grass']);

    const dualType = new Pokemon(2, 'Charizard', stats, false, 'fire', 'flying');
    expect(dualType.types).toEqual(['fire', 'flying']);
  });

  it('validates constructor inputs', () => {
    expect(() => new Pokemon(0, 'Invalid', stats, false, 'fire', null)).toThrow(/id/i);
    expect(() => new Pokemon(1, '   ', stats, false, 'fire', null)).toThrow(/name/i);
    expect(() => new Pokemon(1, 'Valid', stats, false, '   ', null)).toThrow(/primary type/i);
  });
});
