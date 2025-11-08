import { Pokemon } from '@/core/domain/entities/Pokemon';
import { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import { PokemonQuery } from '@/core/domain/specifications/PokemonQuery';

export class PokemonRepositoryStub implements PokemonRepository {
  public lastQuery?: PokemonQuery;

  constructor(private readonly response: readonly Pokemon[]) {}

  async findBy(query: PokemonQuery): Promise<readonly Pokemon[]> {
    this.lastQuery = query;
    return this.response;
  }
}
