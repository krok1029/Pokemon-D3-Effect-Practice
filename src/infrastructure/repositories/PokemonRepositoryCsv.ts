// src/infrastructure/repositories/PokemonRepositoryCsv.ts
import { Effect } from 'effect';
import { readCsv } from '@/infrastructure/csv/CsvService';
import type { Pokemon } from '@/domain/pokemon';
import { parsePokemonCsv, toPokemon } from '@/infrastructure/csv/pokemonCsv';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';
import { NotFound } from '@/domain/repositories/PokemonRepository';

export { NotFound } from '@/domain/repositories/PokemonRepository';

/** 相似度計算（六圍的歐氏距離） */
const METRICS: ReadonlyArray<
  keyof Pick<Pokemon, 'hp' | 'attack' | 'defense' | 'sp_atk' | 'sp_def' | 'speed'>
> = ['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;

function distance(a: Pokemon, b: Pokemon): number {
  let sum = 0;
  for (const k of METRICS) {
    const d = (a[k] as number) - (b[k] as number);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export class PokemonRepositoryCsv implements PokemonRepository {
  constructor(private readonly path: string) {}

  getAll(): Effect.Effect<ReadonlyArray<Pokemon>, Error> {
    return readCsv(this.path).pipe(
      Effect.flatMap(parsePokemonCsv),
      Effect.map((rows) => rows.map(toPokemon))
    );
  }

  getById(id: number): Effect.Effect<Pokemon, Error> {
    return readCsv(this.path).pipe(
      Effect.flatMap(parsePokemonCsv),
      Effect.map((rows) => rows.map(toPokemon)),
      Effect.map((rows) => rows.find((p) => p.id === id)),
      Effect.flatMap((p) =>
        p ? Effect.succeed(p) : Effect.fail(new NotFound(`Pokemon ${id} not found`))
      )
    );
  }

  getByIdWithSimilar(
    id: number,
    k = 5
  ): Effect.Effect<{ pokemon: Pokemon; similar: Pokemon[] }, Error> {
    const kk = Math.max(0, Math.min(50, Math.floor(k)));
    return readCsv(this.path).pipe(
      Effect.flatMap(parsePokemonCsv),
      Effect.map((rows) => rows.map(toPokemon)),
      Effect.flatMap((rows) => {
        const self = rows.find((p) => p.id === id);
        if (!self) return Effect.fail(new NotFound(`Pokemon ${id} not found`));

        const sim = rows
          .filter((p) => p.id !== id)
          .map((p) => ({ p, dist: distance(self, p) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, kk)
          .map((x) => x.p);

        return Effect.succeed({ pokemon: self, similar: sim });
      })
    );
  }
}
