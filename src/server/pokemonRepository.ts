import type { PokemonRepository } from '@/core/domain/pokemonRepository';

import { PokemonCsvRepository } from '@/infra/pokemonCsvRepository';

let repository: PokemonRepository | null = null;

export function getPokemonRepository(): PokemonRepository {
  if (!repository) {
    repository = new PokemonCsvRepository({ filePath: 'data/pokemonCsv.csv' });
  }
  return repository;
}
