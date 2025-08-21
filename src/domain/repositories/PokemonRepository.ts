import type { Pokemon } from '@/domain/pokemon';

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}

export interface PokemonRepository {
  getAll(): Promise<ReadonlyArray<Pokemon>>;
  getById(id: number): Promise<Pokemon>;
  getByIdWithSimilar(
    id: number,
    k: number
  ): Promise<{ pokemon: Pokemon; similar: Pokemon[] }>;
}
