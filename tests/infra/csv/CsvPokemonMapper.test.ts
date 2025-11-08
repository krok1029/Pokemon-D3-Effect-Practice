import { describe, expect, it } from 'vitest';

import { CsvPokemonMapper } from '@/infra/csv/CsvPokemonMapper';

const buildRow = (overrides: Record<string, unknown> = {}) => ({
  Number: '25',
  Name: ' Pikachu ',
  HP: '35',
  Att: '55',
  Def: '40',
  Spa: '50',
  Spd: '50',
  Spe: '90',
  Legendary: '0',
  'Type 1': 'electric',
  'Type 2': ' none ',
  ...overrides,
});

describe('CsvPokemonMapper', () => {
  it('converts a CSV row into a Pokemon domain entity', () => {
    const pokemon = CsvPokemonMapper.toDomain(buildRow(), 0);

    expect(pokemon.id).toBe(25);
    expect(pokemon.name).toBe('Pikachu');
    expect(pokemon.isLegendary).toBe(false);
    expect(pokemon.types).toEqual(['electric']);
    expect(pokemon.stats.toObject()).toMatchObject({
      hp: 35,
      attack: 55,
      defense: 40,
      spAtk: 50,
      spDef: 50,
      speed: 90,
    });
  });

  it('handles numeric/boolean columns and secondary types', () => {
    const pokemon = CsvPokemonMapper.toDomain(
      buildRow({
        Legendary: 1,
        'Type 2': 'fairy',
      }),
      4,
    );

    expect(pokemon.isLegendary).toBe(true);
    expect(pokemon.types).toEqual(['electric', 'fairy']);
  });

  it('throws descriptive errors when required columns are invalid', () => {
    expect(() =>
      CsvPokemonMapper.toDomain(
        buildRow({
          Number: 'not-a-number',
        }),
        1,
      ),
    ).toThrow(/row 2/i);

    expect(() =>
      CsvPokemonMapper.toDomain(
        buildRow({
          Name: '',
        }),
        3,
      ),
    ).toThrow(/row 4/i);
  });
});
