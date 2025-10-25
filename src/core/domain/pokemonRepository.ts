import type { Pokemon } from './pokemon';

export interface PokemonRepository {
  getAll(): Promise<ReadonlyArray<Pokemon>>;
}
