export const TOKENS = {
  PokemonRepository: Symbol.for('PokemonRepository'),
  GetAveragePokemonStatsUseCase: Symbol.for('GetAveragePokemonStatsUseCase'),
  GetAveragePokemonStatsByTypeUseCase: Symbol.for('GetAveragePokemonStatsByTypeUseCase'),
  StatsAverager: Symbol.for('StatsAverager'),
  PokemonDataConfig: Symbol.for('PokemonDataConfig'),
};

export type TokenMap = typeof TOKENS;
