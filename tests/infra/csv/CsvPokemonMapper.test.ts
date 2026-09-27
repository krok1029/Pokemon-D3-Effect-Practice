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
    expect(pokemons.filter((pokemon) => pokemon.isLegendary)).toHaveLength(125);
    for (const [index, pokemon] of pokemons.entries()) {
      expect(pokemon.id).toBe(Number(rows[index].Number));
      expect(pokemon.primaryType).toBe(rows[index]['Type 1']);
      expect(pokemon.isLegendary).toBe(rows[index].Legendary === '1.0');
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
    expect(pokemon.types).toEqual(['Electric']);
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
    expect(pokemon.types).toEqual(['Electric', 'Fairy']);
  });

  it.each([
    [true, true],
    [false, false],
    [1, true],
    [0, false],
    [' TRUE ', true],
    ['False', false],
    ['1', true],
    ['0', false],
    [' 1.0 ', true],
    ['0.0', false],
  ])('accepts an explicit legendary flag %s as %s', (value, expected) => {
    const row = buildRow({ Legendary: value });

    const pokemon = CsvPokemonMapper.toDomain(row, 0);

    expect(pokemon.isLegendary).toBe(expected);
  });

  it.each(['tru', '1garbage', '-1', '0.5', -1, 0.5, '', ' ', undefined, null, NaN, Infinity])(
    'rejects an invalid legendary flag %s with its row and column',
    (value) => {
      const row = buildRow({ Legendary: value });

      expect(() => CsvPokemonMapper.toDomain(row, 7)).toThrow(
        'Row 8: column "Legendary" must be true, false, 0, 1, 0.0 or 1.0',
      );
    },
  );

  it('rejects a missing required Legendary column', () => {
    const row: Record<string, unknown> = buildRow();
    delete row.Legendary;

    expect(() => CsvPokemonMapper.toDomain(row, 1)).toThrow('Row 2: column "Legendary"');
  });

  it('normalizes all 18 types before creating domain entities', () => {
    const types = [
      'Normal',
      'Fire',
      'Water',
      'Electric',
      'Grass',
      'Ice',
      'Fighting',
      'Poison',
      'Ground',
      'Flying',
      'Psychic',
      'Bug',
      'Rock',
      'Ghost',
      'Dragon',
      'Dark',
      'Steel',
      'Fairy',
    ];

    const secondaryTypes = [...types.slice(1), types[0]];
    const pokemons = types.map((type, index) =>
      CsvPokemonMapper.toDomain(
        buildRow({
          'Type 1': ` ${type.toUpperCase()} `,
          'Type 2': secondaryTypes[index].toLowerCase(),
        }),
        index,
      ),
    );

    expect(pokemons.map((pokemon) => pokemon.primaryType)).toEqual(types);
    expect(pokemons.map((pokemon) => pokemon.secondaryType)).toEqual(secondaryTypes);
  });

  it.each(['Electric', 'electric', ' ELECTRIC '])(
    'rejects a duplicate secondary type after normalization: %s',
    (secondaryType) => {
      const row = buildRow({ 'Type 1': ' Electric ', 'Type 2': secondaryType });

      expect(() => CsvPokemonMapper.toDomain(row, 6)).toThrow(
        'Row 7: column "Type 2" must differ from "Type 1"',
      );
    },
  );

  it.each(['Type 1', 'Type 2'])('rejects unknown or non-string values in %s', (column) => {
    for (const value of ['Electrc', '???', 1, false, {}]) {
      const row = buildRow({ [column]: value });

      expect(() => CsvPokemonMapper.toDomain(row, 4)).toThrow(
        `Row 5: column "${column}" must be a recognized Pokemon type`,
      );
    }
  });

  it.each(['none', '', ' ', undefined, null])(
    'requires a real primary type instead of %s',
    (value) => {
      const row = buildRow({ 'Type 1': value });

      expect(() => CsvPokemonMapper.toDomain(row, 3)).toThrow(
        'Row 4: column "Type 1" must be a recognized Pokemon type',
      );
    },
  );

  it.each([' NoNe ', '', ' ', undefined, null])(
    'preserves an absent secondary type %s',
    (value) => {
      const row = buildRow({ 'Type 2': value });

      const pokemon = CsvPokemonMapper.toDomain(row, 0);

      expect(pokemon.secondaryType).toBeNull();
      expect(pokemon.types).toEqual(['Electric']);
    },
  );

  it.each(['data/pokemon_fixture_30.csv', 'tests/e2e/fixtures/navigation.csv'])(
    'maps every row of the existing fixture %s',
    async (filePath) => {
      const rows = await readCsvFile(filePath);

      const pokemons = rows.map((row, index) => CsvPokemonMapper.toDomain(row, index));

      expect(pokemons.length).toBeGreaterThan(0);
      expect(pokemons).toHaveLength(rows.length);
    },
  );

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
