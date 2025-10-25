import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import { StatsAverager } from '@/core/domain/services/StatsAverager';

export const factories = {
  createGetAveragePokemonStatsUseCase(
    repository: PokemonRepository,
    statsAverager: StatsAverager,
  ): GetAveragePokemonStatsUseCase {
    return new GetAveragePokemonStatsUseCase(repository, statsAverager);
  },
};
