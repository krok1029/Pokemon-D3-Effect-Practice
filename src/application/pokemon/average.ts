import { Effect } from 'effect';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';

// 僅限 UI 需要的六圍鍵
const METRICS = [
  'hp',
  'attack',
  'defense',
  'sp_atk',
  'sp_def',
  'speed',
] as const;
export type StatKey = typeof METRICS[number];

export type AverageStats = {
  count: number;
  avgs: Array<{ key: StatKey; value: number }>;
};

/**
 * Use case：計算所有寶可夢的六圍平均
 * - Application 層：協調 Repository I/O 與純計算
 * - Domain/純函式：於此檔內完成（不涉 UI Label）
 */
export function average(repo: PokemonRepository) {
  const eff = Effect.tryPromise(() => repo.getAll()).pipe(
    Effect.map((rows) => {
      const n = rows.length;
      const sums = { hp: 0, attack: 0, defense: 0, sp_atk: 0, sp_def: 0, speed: 0 } as Record<StatKey, number>;
      for (const p of rows) {
        for (const k of METRICS) {
          // p[k] 是 number（依據 Domain 型別），這裡直接加總
          sums[k] += (p as any)[k] as number; // 型別為窄化方便，可改成顯式 Pick
        }
      }
      const avgs = METRICS.map((k) => ({
        key: k,
        value: n > 0 ? Math.round((sums[k] / n) * 10) / 10 : 0,
      }));
      return { count: n, avgs } satisfies AverageStats;
    })
  );

  return Effect.either(eff);
}

