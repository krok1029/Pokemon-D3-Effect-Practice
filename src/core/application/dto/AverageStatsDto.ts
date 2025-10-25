export type AverageStatKey = 'hp' | 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed';

export type AverageStatDto = {
  key: AverageStatKey;
  average: number;
};

export type AverageStatsDto = {
  count: number;
  stats: AverageStatDto[];
};
