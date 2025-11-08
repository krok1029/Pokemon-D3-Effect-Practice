import { describe, expect, it } from 'vitest';

import { Pokemon } from '@/core/domain/entities/Pokemon';
import { StatsAverager } from '@/core/domain/services/StatsAverager';
import { BaseStats } from '@/core/domain/valueObjects/BaseStats';

const buildPokemon = ({
  id,
  name,
  stats,
  isLegendary = false,
}: {
  id: number;
  name: string;
  stats: BaseStats;
  isLegendary?: boolean;
}) => new Pokemon(id, name, stats, isLegendary, 'fire', null);

describe('StatsAverager', () => {
  const averager = new StatsAverager();

  it('returns zero stats when the input list is empty', () => {
    const result = averager.average([]);

    expect(result.toObject()).toEqual(BaseStats.zero().toObject());
  });

  it('averages all pokemons by default (including legendaries)', () => {
    const pokemons = [
      buildPokemon({
        id: 1,
        name: 'Charmander',
        stats: BaseStats.create({
          hp: 39,
          attack: 52,
          defense: 43,
          spAtk: 60,
          spDef: 50,
          speed: 65,
        }),
      }),
      buildPokemon({
        id: 2,
        name: 'Moltres',
        stats: BaseStats.create({
          hp: 90,
          attack: 100,
          defense: 90,
          spAtk: 125,
          spDef: 85,
          speed: 90,
        }),
        isLegendary: true,
      }),
    ];

    const result = averager.average(pokemons);

    expect(result.toObject()).toEqual({
      hp: 64.5,
      attack: 76,
      defense: 66.5,
      spAtk: 92.5,
      spDef: 67.5,
      speed: 77.5,
    });
  });

  it('can exclude legendary pokemons when requested', () => {
    const normal = buildPokemon({
      id: 3,
      name: 'Pikachu',
      stats: BaseStats.create({
        hp: 35,
        attack: 55,
        defense: 40,
        spAtk: 50,
        spDef: 50,
        speed: 90,
      }),
    });
    const legendary = buildPokemon({
      id: 4,
      name: 'Zapdos',
      stats: BaseStats.create({
        hp: 90,
        attack: 90,
        defense: 85,
        spAtk: 125,
        spDef: 90,
        speed: 100,
      }),
      isLegendary: true,
    });

    const result = averager.average([normal, legendary], { excludeLegendaries: true });

    expect(result.toObject()).toEqual(normal.stats.toObject());
  });
});
