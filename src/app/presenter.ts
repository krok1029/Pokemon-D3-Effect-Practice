import { getPokemonBaseStatsUseCase } from '@/server/useCases';

import { buildDatasetSummaryViewModel } from './view-models/datasetSummaryViewModel';

export async function loadDatasetSummaryViewModel() {
  const entries = await getPokemonBaseStatsUseCase().execute();
  return buildDatasetSummaryViewModel(entries);
}
