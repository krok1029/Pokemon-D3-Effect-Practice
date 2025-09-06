export const TOKENS = {
  PokemonRepository: Symbol('PokemonRepository'),
};

export type TokenMap = {
  [TOKENS.PokemonRepository]: import('@/domain/repositories/PokemonRepository').PokemonRepository;
};

