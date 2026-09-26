import { describe, expect, it } from 'vitest';

import { CsvPokemonMapper } from '@/infra/csv/CsvPokemonMapper';
import { readCsvFile } from '@/infra/csv/readCsv';

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
  it('maps every row of the current official dataset without truncating values', async () => {
    const rows = await readCsvFile('data/pokemonCsv.csv');

    const pokemons = rows.map((row, index) => CsvPokemonMapper.toDomain(row, index));

    expect(pokemons).toHaveLength(1032);
    expect(new Set(pokemons.map((pokemon) => pokemon.id)).size).toBe(898);
    for (const [index, pokemon] of pokemons.entries()) {
      expect(pokemon.id).toBe(Number(rows[index].Number));
      expect(pokemon.stats.toObject()).toEqual({
        hp: Number(rows[index].HP),
        attack: Number(rows[index].Att),
        defense: Number(rows[index].Def),
        spAtk: Number(rows[index].Spa),
        spDef: Number(rows[index].Spd),
        speed: Number(rows[index].Spe),
      });
    }
  });

  it.each(['Number', 'HP', 'Att', 'Def', 'Spa', 'Spd', 'Spe'])(
    'rejects a partially numeric %s with its row and column',
    (column) => {
      const row = buildRow({ [column]: '35oops' });

      expect(() => CsvPokemonMapper.toDomain(row, 6)).toThrow(
        `Row 7: column "${column}" must be an integer`,
      );
    },
  );

  it.each([
    '35.9',
    35.9,
    '35.0',
    '3e1',
    '0x23',
    '',
    ' ',
    null,
    undefined,
    NaN,
    Infinity,
    '9007199254740993',
    9007199254740992,
  ])('rejects invalid or unsafe integer input %s', (value) => {
    const row = buildRow({ Number: value });

    expect(() => CsvPokemonMapper.toDomain(row, 2)).toThrow(
      'Row 3: column "Number" must be an integer',
    );
  });

  it.each([' 025 ', 25, '+25'])('accepts a complete safe decimal integer %s', (value) => {
    const pokemon = CsvPokemonMapper.toDomain(buildRow({ Number: value }), 0);

    expect(pokemon.id).toBe(25);
  });

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
