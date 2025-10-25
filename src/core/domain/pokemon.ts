export const BASE_STAT_KEYS = ['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;

export type BaseStatKey = (typeof BASE_STAT_KEYS)[number];

export type BaseStats = Record<BaseStatKey, number>;

export type Pokemon = {
  id: number;
  name: string;
  stats: BaseStats;
};

export const BASE_STAT_LABELS: Record<BaseStatKey, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  sp_atk: 'Special Attack',
  sp_def: 'Special Defense',
  speed: 'Speed',
};
