import { TOKENS } from '@/di/tokens';

import { GetAveragePokemonStatsByTypeUseCase } from '@/core/application/useCases/GetAveragePokemonStatsByTypeUseCase';
import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';
import { GetPokemonBaseStatsUseCase } from '@/core/application/useCases/GetPokemonBaseStatsUseCase';

import { container } from './container';

export function getAveragePokemonStatsUseCase(): GetAveragePokemonStatsUseCase {
  return container.resolve<GetAveragePokemonStatsUseCase>(TOKENS.GetAveragePokemonStatsUseCase);
}

export function getAveragePokemonStatsByTypeUseCase(): GetAveragePokemonStatsByTypeUseCase {
  return container.resolve<GetAveragePokemonStatsByTypeUseCase>(
    TOKENS.GetAveragePokemonStatsByTypeUseCase,
  );
}

export function getPokemonBaseStatsUseCase(): GetPokemonBaseStatsUseCase {
  return container.resolve<GetPokemonBaseStatsUseCase>(TOKENS.GetPokemonBaseStatsUseCase);
}
