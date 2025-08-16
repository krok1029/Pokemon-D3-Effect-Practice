import { Effect } from 'effect';
import type { Pokemon } from '@/domain/pokemon';

export type ListQuery = {
  q?: string;
  legendary?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
};

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}

export interface PokemonRepository {
  list(query: ListQuery): Effect.Effect<{
    total: number;
    page: number;
    pageSize: number;
    data: Pokemon[];
  }, Error>;
  getById(id: number): Effect.Effect<Pokemon, Error>;
  getByIdWithSimilar(
    id: number,
    k: number
  ): Effect.Effect<{ pokemon: Pokemon; similar: Pokemon[] }, Error>;
}
