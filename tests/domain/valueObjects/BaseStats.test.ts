import { describe, expect, it } from 'vitest';

import { BaseStats } from '@/core/domain/valueObjects/BaseStats';

const sampleStats = {
  hp: 50,
  attack: 60,
  defense: 70,
  spAtk: 80,
  spDef: 90,
  speed: 100,
} as const;

describe('BaseStats', () => {
  it('creates immutable stats when all values are valid', () => {
    const stats = BaseStats.create(sampleStats);

    expect(stats.toObject()).toEqual(sampleStats);
  });

  it('rejects invalid stat values', () => {
    expect(() =>
      BaseStats.create({
        ...sampleStats,
        hp: 0,
      }),
    ).toThrowError(/hp/i);

    expect(() =>
      BaseStats.create({
        ...sampleStats,
        attack: 256,
      }),
    ).toThrowError(/attack/i);
  });

  it('adds and divides stats correctly', () => {
    const statsA = BaseStats.create(sampleStats);
    const statsB = BaseStats.create({
      hp: 10,
      attack: 20,
      defense: 30,
      spAtk: 40,
      spDef: 50,
      speed: 60,
    });

    const sum = statsA.add(statsB);
    expect(sum.toObject()).toEqual({
      hp: 60,
      attack: 80,
      defense: 100,
      spAtk: 120,
      spDef: 140,
      speed: 160,
    });

    const average = sum.div(2);
    expect(average.toObject()).toEqual({
      hp: 30,
      attack: 40,
      defense: 50,
      spAtk: 60,
      spDef: 70,
      speed: 80,
    });
  });

  it('throws when dividing by non-positive divisor', () => {
    const stats = BaseStats.create(sampleStats);
    expect(() => stats.div(0)).toThrow();
    expect(() => stats.div(-1)).toThrow();
  });
});
