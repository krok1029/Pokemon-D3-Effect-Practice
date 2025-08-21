// src/infrastructure/repositories/PokemonRepositoryCsv.ts
import { Effect } from 'effect';
import { readCsv } from '@/infrastructure/csv/CsvService';
import type { Pokemon } from '@/domain/pokemon';
import { parsePokemonCsv, toPokemon } from '@/infrastructure/csv/pokemonCsv';
import {
  NotFound,
  PokemonListParams,
  PokemonListResult,
} from '@/domain/repositories/PokemonRepository';
import type { EffectPokemonRepository } from '@/application/repositories/EffectPokemonRepository';

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

export class PokemonRepositoryCsv implements EffectPokemonRepository {
  private readonly data: Promise<ReadonlyArray<Pokemon>>;

  constructor(private readonly path: string) {
    const promise = Effect.runPromise(
      readCsv(path).pipe(
        Effect.flatMap(parsePokemonCsv),
        Effect.map((rows) => rows.map(toPokemon))
      )
    );
    // avoid unhandled rejection warnings
    promise.catch(() => {});
    this.data = promise;
  }

  private load(): Effect.Effect<ReadonlyArray<Pokemon>, Error> {
    return Effect.tryPromise({
      try: () => this.data,
      catch: (e) => e as Error,
    });
  }

  getAll(): Effect.Effect<ReadonlyArray<Pokemon>, Error> {
    return this.load();
  }

  getById(id: number): Effect.Effect<Pokemon, Error> {
    return this.load().pipe(
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
    return this.load().pipe(
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

  list(params: PokemonListParams): Effect.Effect<PokemonListResult, Error> {
    const ALLOWED_SORT_KEYS = new Set<keyof Pokemon>([
      'id',
      'name',
      'type1',
      'type2',
      'hp',
      'attack',
      'defense',
      'sp_atk',
      'sp_def',
      'speed',
      'bst',
      'mean',
      'sd',
      'generation',
      'expType',
      'expTo100',
      'finalEvolution',
      'catchRate',
      'legendary',
      'mega',
      'alolan',
      'galarian',
      'height',
      'weight',
      'bmi',
    ] as Array<keyof Pokemon>);

    type SortDir = 'asc' | 'desc';
    type SortPair = readonly [keyof Pokemon, SortDir];

    function parseSortParam(sort?: string): SortPair[] {
      if (!sort) return [];
      const parts = sort
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const pairs: SortPair[] = [];
      for (const part of parts) {
        const [fieldRaw, dirRaw] = part.split(':');
        const key = fieldRaw as keyof Pokemon;
        if (!ALLOWED_SORT_KEYS.has(key)) continue;
        const dir: SortDir = dirRaw?.toLowerCase() === 'desc' ? 'desc' : 'asc';
        pairs.push([key, dir]);
      }
      return pairs;
    }

    function getValue<K extends keyof Pokemon>(p: Pokemon, key: K): Pokemon[K] {
      return p[key];
    }

    function normalizeForCompare(v: unknown): number | string {
      if (v == null) return '';
      const t = typeof v;
      if (t === 'number') return v as number;
      if (t === 'boolean') return (v as boolean) ? 1 : 0;
      return String(v);
    }

    function compareByPairs(a: Pokemon, b: Pokemon, pairs: SortPair[]): number {
      for (const [key, dir] of pairs) {
        const av = normalizeForCompare(getValue(a, key));
        const bv = normalizeForCompare(getValue(b, key));
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
      }
      return 0;
    }

    return this.load().pipe(
      Effect.map((rows) => {
        let xs = rows.slice();

        if (params.q) {
          const qq = params.q.toLowerCase();
          xs = xs.filter((p) => p.name.toLowerCase().includes(qq));
        }
        if (typeof params.legendary === 'boolean') {
          xs = xs.filter((p) => p.legendary === params.legendary);
        }

        const sortPairs = parseSortParam(params.sort);
        if (sortPairs.length > 0) {
          xs.sort((a, b) => compareByPairs(a, b, sortPairs));
        }

        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
        const start = (page - 1) * pageSize;
        const data = xs.slice(start, start + pageSize);

        return { total: xs.length, page, pageSize, data };
      })
    );
  }
}
