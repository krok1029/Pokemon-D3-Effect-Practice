import { getAveragePokemonStatsUseCase } from '@/server/useCases';

import {
  buildAverageStatsViewModel,
  AverageStatsViewModel,
} from './view-models/averageStatsViewModel';

export type LoadAverageStatsOptions = {
  excludeLegendaries?: boolean;
};

export async function loadAverageStatsViewModel(
  options: LoadAverageStatsOptions = {},
): Promise<AverageStatsViewModel> {
  const useCase = getAveragePokemonStatsUseCase();
  const dto = await useCase.execute({
    excludeLegendaries: options.excludeLegendaries,
  });
  return buildAverageStatsViewModel(dto);
}
