import { Effect } from 'effect';
import type { PokemonRepository, PokemonListParams } from '@/domain/repositories/PokemonRepository';

export class PokemonRepositoryEffectAdapter {
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

  list(params: PokemonListParams) {
    return Effect.tryPromise(() => this.repo.list(params));
  }
}

