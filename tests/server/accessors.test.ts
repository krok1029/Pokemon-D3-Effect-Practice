import { describe, expect, it } from 'vitest';

import { getPokemonRepository } from '@/server/pokemonRepository';
import {
  getAveragePokemonStatsByTypeUseCase,
  getAveragePokemonStatsUseCase,
  getPokemonBaseStatsUseCase,
} from '@/server/useCases';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';

import { CsvPokemonRepository } from '@/infra/csv/CsvPokemonRepository';

describe('server container accessors', () => {
  it('returns a singleton CsvPokemonRepository', () => {
    const repoA = getPokemonRepository();
    const repoB = getPokemonRepository();

    expect(repoA).toBeInstanceOf(CsvPokemonRepository);
    expect(repoA).toBe(repoB);
  });

  it('resolves registered use cases via container tokens', () => {
    expect(getAveragePokemonStatsUseCase()).toBeInstanceOf(GetAveragePokemonStatsUseCase);
    expect(getAveragePokemonStatsByTypeUseCase()).toBeInstanceOf(
      GetAveragePokemonStatsByTypeUseCase,
    );
    expect(getPokemonBaseStatsUseCase()).toBeInstanceOf(GetPokemonBaseStatsUseCase);
  });
});
