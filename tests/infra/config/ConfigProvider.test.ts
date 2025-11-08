import { afterEach, describe, expect, it } from 'vitest';

import { ConfigProvider } from '@/infra/config/ConfigProvider';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('ConfigProvider', () => {
  it('prefers explicit POKEMON_DATA_PATH when provided', () => {
    process.env.POKEMON_DATA_PATH = '/tmp/custom.csv';
    process.env.NODE_ENV = 'production';

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: '/tmp/custom.csv',
    });
  });

  it('falls back to fixture path during tests', () => {
    delete process.env.POKEMON_DATA_PATH;
    process.env.NODE_ENV = 'test';

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: 'data/pokemon_fixture_30.csv',
    });
  });

  it('defaults to production dataset when no env overrides exist', () => {
    delete process.env.POKEMON_DATA_PATH;
    process.env.NODE_ENV = 'development';

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: 'data/pokemonCsv.csv',
    });
  });
});
