import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import type { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import type { StatsAverager } from '@/core/domain/services/StatsAverager';

export const factories = {
  createGetAveragePokemonStatsUseCase(
    repository: PokemonRepository,
    statsAverager: StatsAverager,
  ): GetAveragePokemonStatsUseCase {
    return new GetAveragePokemonStatsUseCase(repository, statsAverager);
  },
};
