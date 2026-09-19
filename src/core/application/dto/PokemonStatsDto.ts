import type { AverageStatKey } from './AverageStatsDto';

export type PokemonStatsRecordDto = Record<AverageStatKey, number>;

export type PokemonStatsEntryDto = {
  id: number;
  formId?: string;
  name: string;
  isLegendary: boolean;
  primaryType: string;
  secondaryType: string | null;
  stats: PokemonStatsRecordDto;
};
