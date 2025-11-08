import { describe, expect, it } from 'vitest';

import { factories } from '@/server/factories';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';
import type { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import { StatsAverager } from '@/core/domain/services/StatsAverager';

class PokemonRepositoryFake implements PokemonRepository {
  async findBy() {
    return [];
  }
}

describe('server factories', () => {
  const repository = new PokemonRepositoryFake();
  const statsAverager = new StatsAverager();

  it('creates GetAveragePokemonStatsUseCase', () => {
    const useCase = factories.createGetAveragePokemonStatsUseCase(repository, statsAverager);
    expect(useCase).toBeInstanceOf(GetAveragePokemonStatsUseCase);
  });

  it('creates GetAveragePokemonStatsByTypeUseCase', () => {
    const useCase = factories.createGetAveragePokemonStatsByTypeUseCase(repository, statsAverager);
    expect(useCase).toBeInstanceOf(GetAveragePokemonStatsByTypeUseCase);
  });

  it('creates GetPokemonBaseStatsUseCase', () => {
    const useCase = factories.createGetPokemonBaseStatsUseCase(repository);
    expect(useCase).toBeInstanceOf(GetPokemonBaseStatsUseCase);
  });
});
