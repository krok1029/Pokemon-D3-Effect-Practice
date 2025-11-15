import { afterEach, describe, expect, it } from 'vitest';

import { ConfigProvider } from '@/infra/config/ConfigProvider';

const ORIGINAL_ENV = { ...process.env };

const setEnv = (overrides: Partial<NodeJS.ProcessEnv>) => {
  process.env = { ...process.env, ...overrides };
};

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('ConfigProvider', () => {
  it('prefers explicit POKEMON_DATA_PATH when provided', () => {
    setEnv({
      POKEMON_DATA_PATH: '/tmp/custom.csv',
      NODE_ENV: 'production',
    });

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: '/tmp/custom.csv',
    });
  });

  it('falls back to fixture path during tests', () => {
    setEnv({
      POKEMON_DATA_PATH: undefined,
      NODE_ENV: 'test',
    });

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: 'data/pokemon_fixture_30.csv',
    });
  });

  it('defaults to production dataset when no env overrides exist', () => {
    setEnv({
      POKEMON_DATA_PATH: undefined,
      NODE_ENV: 'development',
    });

    expect(ConfigProvider.getPokemonDataConfig()).toEqual({
      pokemonCsvPath: 'data/pokemonCsv.csv',
    });
  });
});
