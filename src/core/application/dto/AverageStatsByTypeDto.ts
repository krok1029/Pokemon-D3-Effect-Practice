import { AverageStatDto } from './AverageStatsDto';

export type TypeAverageStatDto = {
  type: string;
  count: number;
  stats: AverageStatDto[];
};

export type AverageStatsByTypeDto = {
  types: TypeAverageStatDto[];
};
