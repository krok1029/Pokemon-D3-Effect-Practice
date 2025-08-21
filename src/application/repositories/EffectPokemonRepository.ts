import { Effect } from 'effect';
import type { Pokemon } from '@/domain/pokemon';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';

export interface EffectPokemonRepository {
  getAll(): Effect.Effect<ReadonlyArray<Pokemon>, Error>;
  getById(id: number): Effect.Effect<Pokemon, Error>;
  getByIdWithSimilar(
    id: number,
    k: number
  ): Effect.Effect<{ pokemon: Pokemon; similar: Pokemon[] }, Error>;
}

export class PokemonRepositoryEffectAdapter implements EffectPokemonRepository {
  constructor(private readonly repo: PokemonRepository) {}

  getAll() {
    return Effect.tryPromise(() => this.repo.getAll());
  }

  getById(id: number) {
    return Effect.tryPromise(() => this.repo.getById(id));
  }

  getByIdWithSimilar(id: number, k: number) {
    return Effect.tryPromise(() => this.repo.getByIdWithSimilar(id, k));
  }
}
