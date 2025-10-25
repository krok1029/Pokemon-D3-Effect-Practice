import { TOKENS } from '@/di/tokens';

import { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';

import { container } from './container';

export function getPokemonRepository(): PokemonRepository {
  return container.resolve<PokemonRepository>(TOKENS.PokemonRepository);
}
