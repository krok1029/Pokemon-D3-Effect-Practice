import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';
import type { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import type { StatsAverager } from '@/core/domain/services/StatsAverager';

export const factories = {
  createGetAveragePokemonStatsUseCase(
    repository: PokemonRepository,
    statsAverager: StatsAverager,
  ): GetAveragePokemonStatsUseCase {
    return new GetAveragePokemonStatsUseCase(repository, statsAverager);
  },
  createGetAveragePokemonStatsByTypeUseCase(
    repository: PokemonRepository,
    statsAverager: StatsAverager,
  ): GetAveragePokemonStatsByTypeUseCase {
    return new GetAveragePokemonStatsByTypeUseCase(repository, statsAverager);
  },
  createGetPokemonBaseStatsUseCase(repository: PokemonRepository): GetPokemonBaseStatsUseCase {
    return new GetPokemonBaseStatsUseCase(repository);
  },
};
