import type { Pokemon } from './Pokemon';

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}

export interface PokemonListParams {
  q?: string;
  legendary?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface PokemonListResult {
  total: number;
  page: number;
  pageSize: number;
  data: ReadonlyArray<Pokemon>;
}

export interface PokemonRepository {
  getAll(): Promise<ReadonlyArray<Pokemon>>;
  getById(id: number): Promise<Pokemon>;
  getByIdWithSimilar(
    id: number,
    k: number
  ): Promise<{ pokemon: Pokemon; similar: Pokemon[] }>;
  list(params: PokemonListParams): Promise<PokemonListResult>;
}

