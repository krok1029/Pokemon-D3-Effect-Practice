import { Pokemon } from '../../domain/entities/Pokemon';
import { PokemonRepository } from '../../domain/repositories/PokemonRepository';
import { StatsAverager } from '../../domain/services/StatsAverager';
import { PokemonQueries } from '../../domain/specifications/PokemonQuery';
import { AverageStatsByTypeDto, TypeAverageStatDto } from '../dto/AverageStatsByTypeDto';
import { AverageStatDto } from '../dto/AverageStatsDto';

export interface GetAveragePokemonStatsByTypeInput {
  excludeLegendaries?: boolean;
}

export class GetAveragePokemonStatsByTypeUseCase {
  constructor(
    private readonly repository: PokemonRepository,
    private readonly statsAverager: StatsAverager,
  ) {}

  async execute(input: GetAveragePokemonStatsByTypeInput = {}): Promise<AverageStatsByTypeDto> {
    const query = input.excludeLegendaries
      ? PokemonQueries.nonLegendaries()
      : PokemonQueries.withLegendaries();

    const pokemons = await this.repository.findBy(query);

    const groups = groupPokemonsByType(pokemons);
    const types = groups.map((group) => this.buildTypeAverage(group.type, group.pokemons));

    return {
      types: types.sort((a, b) => a.type.localeCompare(b.type, 'en')),
    };
  }

  private buildTypeAverage(type: string, pokemons: readonly Pokemon[]): TypeAverageStatDto {
    const stats = this.statsAverager.average(pokemons);
    const { hp, attack, defense, spAtk, spDef, speed } = stats.toObject();

    const statEntries: AverageStatDto[] = [
      { key: 'hp', average: roundTo(hp, 1) },
      { key: 'attack', average: roundTo(attack, 1) },
      { key: 'defense', average: roundTo(defense, 1) },
      { key: 'spAtk', average: roundTo(spAtk, 1) },
      { key: 'spDef', average: roundTo(spDef, 1) },
      { key: 'speed', average: roundTo(speed, 1) },
    ];

    return {
      type,
      count: pokemons.length,
      stats: statEntries,
    };
  }
}

type PokemonGroup = {
  type: string;
  pokemons: Pokemon[];
};

function groupPokemonsByType(pokemons: readonly Pokemon[]): PokemonGroup[] {
  const typeMap = new Map<string, Pokemon[]>();

  for (const pokemon of pokemons) {
    for (const type of pokemon.types) {
      const bucket = typeMap.get(type);
      if (bucket) {
        bucket.push(pokemon);
      } else {
        typeMap.set(type, [pokemon]);
      }
    }
  }

  return Array.from(typeMap.entries(), ([type, group]) => ({
    type,
    pokemons: group,
  }));
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
