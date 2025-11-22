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

const STAT_KEYS: AverageStatKey[] = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];
const TYPE_SLUGS = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

type TypeSlug = (typeof TYPE_SLUGS)[number];

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

export type PokemonTypeMatchupCategory = 'super' | 'notVery' | 'neutral' | 'immune';

export type PokemonTypeMatchupViewModel = {
  slug: string;
  label: string;
  iconPath: string;
  color: string;
  multiplier: number;
  multiplierLabel: string;
  category: PokemonTypeMatchupCategory;
  order: number;
};

export type PokemonDetailEntryViewModel = {
  id: number;
  name: string;
  isLegendary: boolean;
  accentColor: string;
  imagePath: string | null;
  typeBadges: PokemonTypeBadgeViewModel[];
  stats: PokemonStatBarViewModel[];
  total: number;
  defenseMatchups: PokemonTypeMatchupViewModel[];
  offenseMatchups: PokemonTypeMatchupViewModel[];
};

export type PokemonDetailPageViewModel = {
  statOptions: Array<{ key: AverageStatKey; label: string }>;
  pokemons: PokemonDetailEntryViewModel[];
  typeOptions: PokemonTypeBadgeViewModel[];
  countLabel: string;
};

export function buildPokemonDetailPageViewModel(
  entries: PokemonStatsEntryDto[],
): PokemonDetailPageViewModel {
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

  const pokemons: PokemonDetailEntryViewModel[] = entries
    .map((entry) => {
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
      const defensiveTypes = types.map((type) => normalizeTypeSlug(type)) as TypeSlug[];
      const defenseMatchups = buildDefenseMatchups(defensiveTypes);
      const offenseMatchups = buildOffenseMatchups(defensiveTypes);

      const stats: PokemonStatBarViewModel[] = STAT_KEYS.map((key) => ({
        key,
        label: STAT_LABEL_MAP[key],
        value: entry.stats[key],
        ratio: Math.max(0, Math.min(1, entry.stats[key] / maxStat[key])),
      }));

      const total = stats.reduce((sum, stat) => sum + stat.value, 0);

      return {
        id: entry.id,
        name: entry.name,
        isLegendary: entry.isLegendary,
        accentColor: primaryColor,
        imagePath: findPokemonImagePath(entry.id),
        typeBadges: badges,
        stats,
        total,
        defenseMatchups,
        offenseMatchups,
      };
    })
    .sort((a, b) => a.id - b.id);

  const typeOptionMap = new Map<string, PokemonTypeBadgeViewModel>();
  pokemons.forEach((pokemon) => {
    pokemon.typeBadges.forEach((badge) => {
      if (!typeOptionMap.has(badge.slug)) {
        typeOptionMap.set(badge.slug, badge);
      }
    });
  });

  const typeOptions = Array.from(typeOptionMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'zh-Hant', { sensitivity: 'base' }),
  );

  return {
    statOptions: STAT_KEYS.map((key) => ({ key, label: STAT_LABEL_MAP[key] })),
    pokemons,
    typeOptions,
    countLabel: entries.length.toLocaleString(),
  };
}

function buildDefenseMatchups(defensiveTypes: TypeSlug[]): PokemonTypeMatchupViewModel[] {
  if (defensiveTypes.length === 0) {
    return [];
  }

  const matchups = TYPE_SLUGS.map((attackType, index) => {
    const multiplier = defensiveTypes.reduce((product, defender) => {
      const table = TYPE_EFFECTIVENESS_MATRIX[attackType];
      const effectiveness = table?.[defender] ?? 1;
      return product * effectiveness;
    }, 1);

    return {
      slug: attackType,
      label: translateType(attackType),
      iconPath: buildTypeIconPath(attackType),
      color: TYPE_COLOR_MAP[attackType] ?? '#64748b',
      multiplier,
      multiplierLabel: formatMultiplierLabel(multiplier),
      category: categorizeMultiplier(multiplier),
      order: index,
    };
  });

  return matchups.sort((a, b) => {
    if (Math.abs(b.multiplier - a.multiplier) > MULTIPLIER_EQUALITY_EPSILON) {
      return b.multiplier - a.multiplier;
    }
    return a.label.localeCompare(b.label, 'zh-Hant', { sensitivity: 'base' });
  });
}

function buildOffenseMatchups(offenseTypes: TypeSlug[]): PokemonTypeMatchupViewModel[] {
  if (offenseTypes.length === 0) {
    return [];
  }

  const matchups = TYPE_SLUGS.map((defenderType, index) => {
    const multiplier = offenseTypes.reduce((maxMultiplier, attackType) => {
      const table = TYPE_EFFECTIVENESS_MATRIX[attackType];
      const effectiveness = table?.[defenderType] ?? 1;
      return Math.max(maxMultiplier, effectiveness);
    }, 1);

    return {
      slug: defenderType,
      label: translateType(defenderType),
      iconPath: buildTypeIconPath(defenderType),
      color: TYPE_COLOR_MAP[defenderType] ?? '#64748b',
      multiplier,
      multiplierLabel: formatMultiplierLabel(multiplier),
      category: categorizeMultiplier(multiplier),
      order: index,
    };
  });

  return matchups.sort((a, b) => {
    if (Math.abs(b.multiplier - a.multiplier) > MULTIPLIER_EQUALITY_EPSILON) {
      return b.multiplier - a.multiplier;
    }
    return a.label.localeCompare(b.label, 'zh-Hant', { sensitivity: 'base' });
  });
}

function formatMultiplierLabel(multiplier: number): string {
  const rounded = Math.round(multiplier * 100) / 100;
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

const MULTIPLIER_EQUALITY_EPSILON = 0.0001;

function categorizeMultiplier(multiplier: number): PokemonTypeMatchupViewModel['category'] {
  if (Math.abs(multiplier) < MULTIPLIER_EQUALITY_EPSILON) {
    return 'immune';
  }
  if (multiplier > 1 + MULTIPLIER_EQUALITY_EPSILON) {
    return 'super';
  }
  if (multiplier < 1 - MULTIPLIER_EQUALITY_EPSILON) {
    return 'notVery';
  }
  return 'neutral';
}

const TYPE_EFFECTIVENESS_MATRIX: Record<TypeSlug, Partial<Record<TypeSlug, number>>> = {
  normal: {
    rock: 0.5,
    ghost: 0,
    steel: 0.5,
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    rock: 0.5,
    dragon: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    dragon: 0.5,
    ground: 2,
    rock: 2,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    dragon: 0.5,
    flying: 0.5,
    poison: 0.5,
    bug: 0.5,
    steel: 0.5,
    ground: 2,
    rock: 2,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    ice: 0.5,
    steel: 0.5,
    grass: 2,
    ground: 2,
    flying: 2,
    dragon: 2,
  },
  fighting: {
    normal: 2,
    ice: 2,
    rock: 2,
    dark: 2,
    steel: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    fairy: 0.5,
    ghost: 0,
  },
  poison: {
    grass: 2,
    fairy: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
  },
  ground: {
    fire: 2,
    electric: 2,
    poison: 2,
    rock: 2,
    steel: 2,
    grass: 0.5,
    bug: 0.5,
    flying: 0,
  },
  flying: {
    grass: 2,
    fighting: 2,
    bug: 2,
    electric: 0.5,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    steel: 0.5,
    dark: 0,
  },
  bug: {
    grass: 2,
    psychic: 2,
    dark: 2,
    fire: 0.5,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    ghost: 0.5,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    flying: 2,
    bug: 2,
    fighting: 0.5,
    ground: 0.5,
    steel: 0.5,
  },
  ghost: {
    ghost: 2,
    psychic: 2,
    dark: 0.5,
    normal: 0,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    psychic: 2,
    ghost: 2,
    fighting: 0.5,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    rock: 2,
    ice: 2,
    fairy: 2,
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    steel: 0.5,
  },
  fairy: {
    fighting: 2,
    dragon: 2,
    dark: 2,
    fire: 0.5,
    poison: 0.5,
    steel: 0.5,
  },
};
