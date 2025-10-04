import type { PokemonRepository } from '@/domain/pokemon/PokemonRepository';
import { invalidInput, isServiceError, type ServiceError } from '../errors';
import { ok, err, type Result } from '@/shared/result';

// 僅限 UI 需要的六圍鍵
const METRICS = [
  'hp',
  'attack',
  'defense',
  'sp_atk',
  'sp_def',
  'speed',
] as const;
export type StatKey = (typeof METRICS)[number];

export type AverageStats = {
  count: number;
  avgs: Array<{ key: StatKey; value: number }>;
};

function toServiceError(error: unknown): ServiceError {
  if (isServiceError(error)) return error;
  if (error instanceof Error) return invalidInput(error.message);
  return invalidInput(String(error));
}

export async function average(
  repo: PokemonRepository
): Promise<Result<ServiceError, AverageStats>> {
  try {
    const rows = await repo.getAll();
    const n = rows.length;
    const sums = { hp: 0, attack: 0, defense: 0, sp_atk: 0, sp_def: 0, speed: 0 } as Record<StatKey, number>;
    for (const p of rows) {
      for (const k of METRICS) {
        sums[k] += (p as any)[k] as number;
      }
    }
    const avgs = METRICS.map((k) => ({
      key: k,
      value: n > 0 ? Math.round((sums[k] / n) * 10) / 10 : 0,
    }));
    return ok({ count: n, avgs });
  } catch (error) {
    return err(toServiceError(error));
  }
}

