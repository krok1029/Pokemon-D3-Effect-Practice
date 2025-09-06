import { container } from './container';
import { TOKENS } from './tokens';
import { createPokemonRepository } from '@/infrastructure/config';

// Register default providers. This file should be imported once on app start.
export function registerDefaultProviders() {
  container.registerInstance(TOKENS.PokemonRepository, createPokemonRepository());
}

