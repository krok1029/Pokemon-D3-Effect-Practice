import { Effect } from 'effect';
import type { Pokemon } from '@/infrastructure/csv/pokemonCsv';

export type ListQuery = {
  q?: string;
  legendary?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string; // 例如: "bst:desc,name:asc"
};

export interface PokemonRepository {
  list(query: ListQuery): Effect.Effect<{ total: number; page: number; pageSize: number; data: Pokemon[] }, Error, never>;
  getById(id: number): Effect.Effect<Pokemon, NotFound | Error, never>;
  getByIdWithSimilar(id: number, k?: number): Effect.Effect<{ pokemon: Pokemon; similar: Pokemon[] }, NotFound | Error, never>;
}

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}
