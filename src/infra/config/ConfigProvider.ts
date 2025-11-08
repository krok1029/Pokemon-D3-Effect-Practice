export interface PokemonDataConfig {
  pokemonCsvPath: string;
}

export class ConfigProvider {
  static getPokemonDataConfig(): PokemonDataConfig {
    // return { pokemonCsvPath: 'data/pokemon_fixture_30.csv' };
    if (process.env.POKEMON_DATA_PATH) {
      return { pokemonCsvPath: process.env.POKEMON_DATA_PATH };
    }

    if (process.env.NODE_ENV === 'test') {
      return { pokemonCsvPath: 'data/pokemon_fixture_30.csv' };
    }

    return { pokemonCsvPath: 'data/pokemonCsv.csv' };
  }
}
