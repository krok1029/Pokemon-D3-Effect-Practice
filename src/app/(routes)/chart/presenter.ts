import {
  getAveragePokemonStatsUseCase,
  getAveragePokemonStatsByTypeUseCase,
} from '@/server/useCases';

import {
  buildAverageStatsViewModel,
  AverageStatsViewModel,
} from './view-models/averageStatsViewModel';
import {
  buildTypeAverageStatsViewModel,
  TypeAverageStatsViewModel,
} from './view-models/typeAverageStatsViewModel';

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

export async function loadTypeAverageStatsViewModel(
  options: LoadAverageStatsOptions = {},
): Promise<TypeAverageStatsViewModel> {
  const useCase = getAveragePokemonStatsByTypeUseCase();
  const dto = await useCase.execute({
    excludeLegendaries: options.excludeLegendaries,
  });
  return buildTypeAverageStatsViewModel(dto);
}
