import { Pokemon } from '../entities/Pokemon';
import { PokemonQuery } from '../specifications/PokemonQuery';

export interface PokemonRepository {
  findBy(query: PokemonQuery): Promise<readonly Pokemon[]>;
}
