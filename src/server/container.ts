import 'reflect-metadata';

import { container } from 'tsyringe';

import { TOKENS } from '@/di/tokens';

import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
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

export { container };
