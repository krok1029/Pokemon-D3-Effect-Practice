import type { PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';

import type { InjectionToken } from 'tsyringe';

export const TOKENS = {
  PokemonRepository: Symbol('PokemonRepository') as InjectionToken<PokemonRepository>,
};
