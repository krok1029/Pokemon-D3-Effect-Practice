import { STAT_LABEL_MAP } from '@/app/(routes)/chart/view-models/averageStatsViewModel';
import {
  buildTypeIconPath,
  normalizeTypeSlug,
  translateType,
  TYPE_COLOR_MAP,
} from '@/app/(routes)/chart/view-models/typeAverageStatsViewModel';
import { findPokemonImagePath } from '@/app/pokemon/lib/pokemonImages';

import { AverageStatKey } from '@/core/application/dto/AverageStatsDto';
import { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';
import { createPokemonFormId } from '@/core/domain/valueObjects/PokemonFormId';

export const STAT_KEYS: AverageStatKey[] = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];

export type PokemonTypeBadgeViewModel = {
  slug: string;
  label: string;
  iconPath: string;
  color: string;
};

export type PokemonStatBarViewModel = {
  key: AverageStatKey;
  label: string;
  value: number;
  ratio: number;
};

export type PokemonCardViewModel = {
  id: number;
  formId?: string;
  detailHref?: string;
  name: string;
  isLegendary: boolean;
  accentColor: string;
  imagePath: string | null;
  typeBadges: PokemonTypeBadgeViewModel[];
  stats: PokemonStatBarViewModel[];
  total: number;
};

export function getPokemonStatMaximums(
  entries: PokemonStatsEntryDto[],
): Record<AverageStatKey, number> {
  const maxStat: Record<AverageStatKey, number> = {
    hp: 1,
    attack: 1,
    defense: 1,
    spAtk: 1,
    spDef: 1,
    speed: 1,
  };

  for (const entry of entries) {
    for (const key of STAT_KEYS) {
      maxStat[key] = Math.max(maxStat[key], entry.stats[key]);
    }
  }

  return maxStat;
}

export function buildPokemonCardViewModel(
  entry: PokemonStatsEntryDto,
  maxStat: Record<AverageStatKey, number>,
): PokemonCardViewModel {
  const types = [entry.primaryType, entry.secondaryType].filter((type): type is string =>
    Boolean(type?.trim()),
  );

  const badges: PokemonTypeBadgeViewModel[] = types.map((type) => {
    const slug = normalizeTypeSlug(type);
    return {
      slug,
      label: translateType(type),
      iconPath: buildTypeIconPath(type),
      color: TYPE_COLOR_MAP[slug] ?? '#64748b',
    };
  });

  const primaryColor = badges[0]?.color ?? '#60a5fa';

  const stats: PokemonStatBarViewModel[] = STAT_KEYS.map((key) => ({
    key,
    label: STAT_LABEL_MAP[key],
    value: entry.stats[key],
    ratio: Math.max(0, Math.min(1, entry.stats[key] / maxStat[key])),
  }));

  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const formId = entry.formId ?? createPokemonFormId(entry.name);

  return {
    id: entry.id,
    formId,
    detailHref: `/pokemon/${entry.id}?${new URLSearchParams({ form: formId })}`,
    name: entry.name,
    isLegendary: entry.isLegendary,
    accentColor: primaryColor,
    imagePath: findPokemonImagePath(entry.id, formId),
    typeBadges: badges,
    stats,
    total,
  };
}
