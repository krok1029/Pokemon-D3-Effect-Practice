import { TOKENS } from '@/di/tokens';

import { GetAveragePokemonStatsUseCase } from '@/core/application/useCases/GetAveragePokemonStatsUseCase';

import { container } from './container';

export function getAveragePokemonStatsUseCase(): GetAveragePokemonStatsUseCase {
  return container.resolve<GetAveragePokemonStatsUseCase>(TOKENS.GetAveragePokemonStatsUseCase);
}
