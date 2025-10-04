import type { InjectionToken } from 'tsyringe';
import type { PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';

export const TOKENS = {
  PokemonRepository: Symbol('PokemonRepository') as InjectionToken<PokemonRepository>,
};
