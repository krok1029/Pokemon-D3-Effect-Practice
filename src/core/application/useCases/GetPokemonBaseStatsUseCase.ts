import { PokemonRepository } from '../../domain/repositories/PokemonRepository';
import { PokemonQueries } from '../../domain/specifications/PokemonQuery';
import { PokemonStatsEntryDto } from '../dto/PokemonStatsDto';

export interface GetPokemonBaseStatsInput {
  excludeLegendaries?: boolean;
}

export class GetPokemonBaseStatsUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(input: GetPokemonBaseStatsInput = {}): Promise<PokemonStatsEntryDto[]> {
    const query = input.excludeLegendaries
      ? PokemonQueries.nonLegendaries()
      : PokemonQueries.withLegendaries();

    const pokemons = await this.repository.findBy(query);

    return pokemons.map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
      isLegendary: pokemon.isLegendary,
      primaryType: pokemon.primaryType,
      secondaryType: pokemon.secondaryType,
      stats: pokemon.stats.toObject(),
    }));
  }
}
