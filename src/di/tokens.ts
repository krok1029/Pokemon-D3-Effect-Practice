export const TOKENS = {
  PokemonRepository: Symbol.for('PokemonRepository'),
  GetAveragePokemonStatsUseCase: Symbol.for('GetAveragePokemonStatsUseCase'),
  StatsAverager: Symbol.for('StatsAverager'),
  PokemonDataConfig: Symbol.for('PokemonDataConfig'),
};

export type TokenMap = typeof TOKENS;
