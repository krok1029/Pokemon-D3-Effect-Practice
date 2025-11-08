import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PokemonQueries } from '@/core/domain/specifications/PokemonQuery';

import { CsvPokemonRepository } from '@/infra/csv/CsvPokemonRepository';

import { createPokemon } from '../../factories/pokemonFactory';

const mockReadCsv = vi.fn();
const mockToDomain = vi.fn();

vi.mock('@/infra/csv/readCsv', () => ({
  readCsvFile: (...args: unknown[]) => mockReadCsv(...(args as Parameters<typeof mockReadCsv>)),
}));

vi.mock('@/infra/csv/CsvPokemonMapper', () => ({
  CsvPokemonMapper: {
    toDomain: (...args: unknown[]) => mockToDomain(...(args as Parameters<typeof mockToDomain>)),
  },
}));

describe('CsvPokemonRepository', () => {
  beforeEach(() => {
    mockReadCsv.mockReset();
    mockToDomain.mockReset();
  });

  it('loads CSV rows once and caches the Pokemon list', async () => {
    const rows = [{ Number: '1' }, { Number: '2' }];
    const pokemons = [createPokemon({ id: 1 }), createPokemon({ id: 2, isLegendary: true })];
    mockReadCsv.mockResolvedValue(rows);
    mockToDomain.mockImplementation((row: unknown, index: number) => pokemons[index]);

    const repository = new CsvPokemonRepository('data/pokemon.csv');

    const result1 = await repository.findBy(PokemonQueries.withLegendaries());
    const result2 = await repository.findBy(PokemonQueries.nonLegendaries());

    expect(mockReadCsv).toHaveBeenCalledTimes(1);
    expect(mockToDomain).toHaveBeenCalledTimes(rows.length);
    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(1);
    expect(result2[0].isLegendary).toBe(false);
  });

  it('resolves relative paths against process.cwd()', async () => {
    mockReadCsv.mockResolvedValue([{ Number: '1' }]);
    const pokemon = createPokemon({ id: 10 });
    mockToDomain.mockReturnValue(pokemon);

    const repository = new CsvPokemonRepository('relative/path.csv');
    const result = await repository.findBy(PokemonQueries.withLegendaries());

    expect(result).toEqual([pokemon]);
    expect(mockReadCsv).toHaveBeenCalledWith(expect.stringContaining('relative/path.csv'));
  });
});
