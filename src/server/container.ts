import 'reflect-metadata';

import { container } from 'tsyringe';

import { TOKENS } from '@/di/tokens';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';
import type { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import { StatsAverager } from '@/core/domain/services/StatsAverager';

import { ConfigProvider } from '@/infra/config/ConfigProvider';
import { CsvPokemonRepository } from '@/infra/csv/CsvPokemonRepository';

import { factories } from './factories';

const pokemonDataConfig = ConfigProvider.getPokemonDataConfig();

container.register(TOKENS.PokemonDataConfig, { useValue: pokemonDataConfig });

container.registerSingleton<StatsAverager>(TOKENS.StatsAverager, StatsAverager);

container.register<PokemonRepository>(TOKENS.PokemonRepository, {
  useValue: new CsvPokemonRepository(pokemonDataConfig.pokemonCsvPath),
});

container.register<GetAveragePokemonStatsUseCase>(TOKENS.GetAveragePokemonStatsUseCase, {
  useFactory: (c) =>
    factories.createGetAveragePokemonStatsUseCase(
      c.resolve(TOKENS.PokemonRepository),
      c.resolve(TOKENS.StatsAverager),
    ),
});

container.register<GetAveragePokemonStatsByTypeUseCase>(
  TOKENS.GetAveragePokemonStatsByTypeUseCase,
  {
    useFactory: (c) =>
      factories.createGetAveragePokemonStatsByTypeUseCase(
        c.resolve(TOKENS.PokemonRepository),
        c.resolve(TOKENS.StatsAverager),
      ),
  },
);

container.register<GetPokemonBaseStatsUseCase>(TOKENS.GetPokemonBaseStatsUseCase, {
  useFactory: (c) =>
    factories.createGetPokemonBaseStatsUseCase(c.resolve(TOKENS.PokemonRepository)),
});

export { container };
