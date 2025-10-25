import { BASE_STAT_KEYS, type BaseStatKey } from '@/core/domain/pokemon';
import type { PokemonRepository } from '@/core/domain/pokemonRepository';

export type AverageStatEntry = { key: BaseStatKey; average: number };

export type AverageStats = {
  count: number;
  stats: AverageStatEntry[];
};

export async function getAveragePokemonStats(repo: PokemonRepository): Promise<AverageStats> {
  const pokemons = await repo.getAll();
  const count = pokemons.length;

  if (count === 0) {
    return { count: 0, stats: BASE_STAT_KEYS.map((key) => ({ key, average: 0 })) };
  }

  const totals = initTotals();

  for (const pokemon of pokemons) {
    for (const key of BASE_STAT_KEYS) {
      totals[key] += pokemon.stats[key];
    }
  }

  const stats = BASE_STAT_KEYS.map((key) => ({
    key,
    average: roundTo(totals[key] / count, 1),
  }));

  return { count, stats };
}

function initTotals(): Record<BaseStatKey, number> {
  return BASE_STAT_KEYS.reduce<Record<BaseStatKey, number>>(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<BaseStatKey, number>,
  );
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
