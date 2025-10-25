import { AverageStatsDto } from '@/core/application/dto/AverageStatsDto';

export type AverageStatViewModel = {
  label: string;
  value: string;
};

export type AverageStatsViewModel = {
  countLabel: string;
  stats: AverageStatViewModel[];
};

const STAT_LABEL_MAP: Record<AverageStatsDto['stats'][number]['key'], string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  spAtk: 'Special Attack',
  spDef: 'Special Defense',
  speed: 'Speed',
};

export function buildAverageStatsViewModel(dto: AverageStatsDto): AverageStatsViewModel {
  return {
    countLabel: dto.count.toLocaleString(),
    stats: dto.stats.map(({ key, average }) => ({
      label: STAT_LABEL_MAP[key],
      value: average.toFixed(1),
    })),
  };
}
