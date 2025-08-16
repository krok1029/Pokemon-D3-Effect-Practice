import { Effect } from 'effect';
import type { Pokemon } from '@/domain/pokemon';

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}

export interface PokemonRepository {
  getAll(): Effect.Effect<ReadonlyArray<Pokemon>, Error>;
  getById(id: number): Effect.Effect<Pokemon, Error>;
  getByIdWithSimilar(
    id: number,
    k: number
  ): Effect.Effect<{ pokemon: Pokemon; similar: Pokemon[] }, Error>;
}
