import { PokemonRepository } from '../../domain/repositories/PokemonRepository';
import { StatsAverager } from '../../domain/services/StatsAverager';
import { PokemonQueries } from '../../domain/specifications/PokemonQuery';
import { AverageStatsDto } from '../dto/AverageStatsDto';

export interface GetAveragePokemonStatsInput {
  excludeLegendaries?: boolean;
}

export class GetAveragePokemonStatsUseCase {
  constructor(
    private readonly repository: PokemonRepository,
    private readonly statsAverager: StatsAverager,
  ) {}

  async execute(input: GetAveragePokemonStatsInput = {}): Promise<AverageStatsDto> {
    const query = input.excludeLegendaries
      ? PokemonQueries.nonLegendaries()
      : PokemonQueries.withLegendaries();

    const pokemons = await this.repository.findBy(query);
    const stats = this.statsAverager.average(pokemons, {
      excludeLegendaries: input.excludeLegendaries,
    });

    const { hp, attack, defense, spAtk, spDef, speed } = stats.toObject();

    return {
      count: pokemons.length,
      stats: [
        { key: 'hp', average: roundTo(hp, 1) },
        { key: 'attack', average: roundTo(attack, 1) },
        { key: 'defense', average: roundTo(defense, 1) },
        { key: 'spAtk', average: roundTo(spAtk, 1) },
        { key: 'spDef', average: roundTo(spDef, 1) },
        { key: 'speed', average: roundTo(speed, 1) },
      ],
    };
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
