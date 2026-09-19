import { PokemonRepository } from '../../domain/repositories/PokemonRepository';
import { PokemonQueries } from '../../domain/specifications/PokemonQuery';
import { PokemonStatsEntryDto } from '../dto/PokemonStatsDto';

export interface GetPokemonBaseStatsInput {
  excludeLegendaries?: boolean;
  id?: number;
  formId?: string;
}

export class GetPokemonBaseStatsUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(input: GetPokemonBaseStatsInput = {}): Promise<PokemonStatsEntryDto[]> {
    const query = input.excludeLegendaries
      ? PokemonQueries.nonLegendaries()
      : PokemonQueries.withLegendaries();

    if (input.id !== undefined) query.id = input.id;
    if (input.formId !== undefined) query.formId = input.formId;
    const pokemons = await this.repository.findBy(query);

    return pokemons.map((pokemon) => ({
      id: pokemon.id,
      formId: pokemon.formId,
      name: pokemon.name,
      isLegendary: pokemon.isLegendary,
      primaryType: pokemon.primaryType,
      secondaryType: pokemon.secondaryType,
      stats: pokemon.stats.toObject(),
    }));
  }

  async executeForForm(input: {
    id: number;
    formId?: string;
  }): Promise<PokemonStatsEntryDto | null> {
    const entries = await this.execute(input);
    if (input.formId !== undefined) return entries[0] ?? null;

    // The CSV has no canonical-form flag. Use the shortest name, then English name order,
    // so old species-only links have a deterministic default even when rows are reordered.
    return (
      [...entries].sort(
        (a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name, 'en'),
      )[0] ?? null
    );
  }
}
