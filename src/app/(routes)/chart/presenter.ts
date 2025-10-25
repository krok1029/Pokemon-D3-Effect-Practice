import { getAveragePokemonStatsUseCase } from '@/server/useCases';

import {
  buildAverageStatsViewModel,
  AverageStatsViewModel,
} from './view-models/averageStatsViewModel';

export async function loadAverageStatsViewModel(): Promise<AverageStatsViewModel> {
  const useCase = getAveragePokemonStatsUseCase();
  const dto = await useCase.execute();
  return buildAverageStatsViewModel(dto);
}
