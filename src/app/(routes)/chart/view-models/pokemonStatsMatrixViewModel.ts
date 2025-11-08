import { AverageStatKey } from '@/core/application/dto/AverageStatsDto';
import { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

import { STAT_LABEL_MAP } from './averageStatsViewModel';
import {
  buildTypeIconPath,
  normalizeTypeSlug,
  translateType,
  TYPE_COLOR_MAP,
} from './typeAverageStatsViewModel';

export type PokemonScatterPointViewModel = {
  id: number;
  name: string;
  isLegendary: boolean;
  primaryType: string;
  secondaryType: string | null;
  typeLabel: string;
  typeSlug: string;
  iconPath: string;
  color: string;
  stats: Record<AverageStatKey, number>;
};

export type PokemonStatsMatrixViewModel = {
  statOptions: Array<{
    key: AverageStatKey;
    label: string;
  }>;
  pokemons: PokemonScatterPointViewModel[];
};

const STAT_ORDER: AverageStatKey[] = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];

export function buildPokemonStatsMatrixViewModel(
  entries: PokemonStatsEntryDto[],
): PokemonStatsMatrixViewModel {
  const statOptions = STAT_ORDER.map((key) => ({
    key,
    label: STAT_LABEL_MAP[key],
  }));

  const pokemons = entries.map((entry) => {
    const slug = normalizeTypeSlug(entry.primaryType);
    return {
      id: entry.id,
      name: entry.name,
      isLegendary: entry.isLegendary,
      primaryType: entry.primaryType,
      secondaryType: entry.secondaryType,
      typeLabel: translateType(entry.primaryType),
      typeSlug: slug,
      iconPath: buildTypeIconPath(entry.primaryType),
      color: TYPE_COLOR_MAP[slug] ?? '#64748b',
      stats: entry.stats,
    };
  });

  return {
    statOptions,
    pokemons,
  };
}
