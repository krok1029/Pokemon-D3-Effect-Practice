import { AverageStatsByTypeDto } from '@/core/application/dto/AverageStatsByTypeDto';
import { AverageStatKey } from '@/core/application/dto/AverageStatsDto';

import { STAT_LABEL_MAP } from './averageStatsViewModel';

export type TypeAverageStatEntryViewModel = {
  type: string;
  typeSlug: string;
  iconPath: string;
  typeLabel: string;
  countLabel: string;
  stats: Array<{
    key: AverageStatKey;
    label: string;
    value: number;
    valueLabel: string;
  }>;
};

export type TypeAverageStatsViewModel = {
  types: TypeAverageStatEntryViewModel[];
  statOptions: Array<{
    key: AverageStatKey;
    label: string;
  }>;
};

export function buildTypeAverageStatsViewModel(
  dto: AverageStatsByTypeDto,
): TypeAverageStatsViewModel {
  const types = dto.types
    .map((typeEntry) => ({
      type: typeEntry.type,
      typeSlug: normalizeTypeSlug(typeEntry.type),
      iconPath: buildTypeIconPath(typeEntry.type),
      typeLabel: translateType(typeEntry.type),
      countLabel: typeEntry.count.toLocaleString(),
      stats: typeEntry.stats.map((stat) => ({
        key: stat.key,
        label: STAT_LABEL_MAP[stat.key],
        value: stat.average,
        valueLabel: stat.average.toFixed(1),
      })),
    }))
    .sort((a, b) => a.type.localeCompare(b.type, 'zh-Hant', { sensitivity: 'base' }));

  const uniqueKeys: AverageStatKey[] = [];
  for (const typeEntry of dto.types) {
    for (const stat of typeEntry.stats) {
      if (!uniqueKeys.includes(stat.key)) {
        uniqueKeys.push(stat.key);
      }
    }
  }

  const statOptions = uniqueKeys.map((key) => ({
    key,
    label: STAT_LABEL_MAP[key],
  }));

  return {
    types,
    statOptions,
  };
}

function normalizeTypeSlug(type: string): string {
  return type
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function buildTypeIconPath(type: string): string {
  const slug = normalizeTypeSlug(type);
  return `/types/${slug}.svg`;
}

const TYPE_LABEL_MAP: Record<string, string> = {
  bug: '蟲',
  dark: '惡',
  dragon: '龍',
  electric: '電',
  fairy: '妖精',
  fighting: '格鬥',
  fire: '火',
  flying: '飛行',
  ghost: '幽靈',
  grass: '草',
  ground: '地面',
  ice: '冰',
  normal: '一般',
  poison: '毒',
  psychic: '超能力',
  rock: '岩石',
  steel: '鋼',
  water: '水',
};

function translateType(type: string): string {
  const slug = normalizeTypeSlug(type);
  return TYPE_LABEL_MAP[slug] ?? type;
}
