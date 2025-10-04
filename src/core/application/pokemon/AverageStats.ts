import type { Pokemon } from '@/core/domain/pokemon/Pokemon';
import type { PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';
import { err, ok, type Result } from '@/core/shared/result';

import { toServiceError, type ServiceError } from '../errors';

const METRICS = ['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;

export type StatKey = (typeof METRICS)[number];

export type AverageStats = {
  count: number;
  avgs: Array<{ key: StatKey; value: number }>;
};

export async function average(
  repo: PokemonRepository,
): Promise<Result<ServiceError, AverageStats>> {
  try {
    const pokemons = await repo.getAll();
    const aggregates = aggregateStats(pokemons);
    return ok(aggregates);
  } catch (error) {
    return err(toServiceError(error));
  }
}

function aggregateStats(rows: ReadonlyArray<Pokemon>): AverageStats {
  const totals = initTotals();

  for (const pokemon of rows) {
    for (const metric of METRICS) {
      totals[metric] += pokemon[metric];
    }
  }

  const count = rows.length;
  const avgs = METRICS.map((metric) => ({
    key: metric,
    value: count > 0 ? roundToTenths(totals[metric] / count) : 0,
  }));

  return { count, avgs };
}

function initTotals(): Record<StatKey, number> {
  return METRICS.reduce<Record<StatKey, number>>(
    (acc, metric) => {
      acc[metric] = 0;
      return acc;
    },
    {} as Record<StatKey, number>,
  );
}

function roundToTenths(value: number): number {
  return Math.round(value * 10) / 10;
}
