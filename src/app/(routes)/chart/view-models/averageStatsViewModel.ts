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
  attack: '物攻',
  defense: '物防',
  spAtk: '特攻',
  spDef: '特防',
  speed: '速度',
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
