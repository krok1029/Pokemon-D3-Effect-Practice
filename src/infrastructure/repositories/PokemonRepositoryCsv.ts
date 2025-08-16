// src/infrastructure/repositories/PokemonRepositoryCsv.ts
import { Effect } from 'effect';
import { readPokemonCsv } from '@/infrastructure/csv/CsvService';
import type { Pokemon } from '@/domain/pokemon';

export type ListQuery = {
  q?: string;
  legendary?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string; // 例："bst:desc,name:asc"
};

export class NotFound extends Error {
  readonly _tag = 'NotFound';
  constructor(message: string) {
    super(message);
  }
}

/** 允許排序的欄位（白名單） */
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

/** 將不同型別正規化成可排序的 number 或 string（避免使用 any） */
function normalizeForCompare(v: unknown): number | string {
  if (v == null) return ''; // null/undefined 排到最前
  const t = typeof v;
  if (t === 'number') return v as number;
  if (t === 'boolean') return (v as boolean) ? 1 : 0;
  return String(v); // string / enum / 其他
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

export function listFromCsv(path: string, query: ListQuery) {
  return readPokemonCsv(path).pipe(
    Effect.map((rows) => {
      let xs = rows.slice();

      // 名稱搜尋（大小寫不敏感）
      if (query.q) {
        const q = query.q.toLowerCase();
        xs = xs.filter((p) => p.name.toLowerCase().includes(q));
      }
      // 傳說過濾
      if (typeof query.legendary === 'boolean') {
        xs = xs.filter((p) => {
          return p.legendary === query.legendary;
        });
      }

      // 多欄排序（依白名單）
      const sortPairs = parseSortParam(query.sort);
      if (sortPairs.length > 0) {
        xs.sort((a, b) => compareByPairs(a, b, sortPairs));
      }

      // 分頁
      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 50));
      const start = (page - 1) * pageSize;
      const data = xs.slice(start, start + pageSize);

      return { total: xs.length, page, pageSize, data };
    })
  );
}

/** 取單筆 */
export function getById(path: string, id: number) {
  return readPokemonCsv(path).pipe(
    Effect.map((rows) => rows.find((p) => p.id === id)),
    Effect.flatMap((p) =>
      p
        ? Effect.succeed(p)
        : Effect.fail(new NotFound(`Pokemon ${id} not found`))
    )
  );
}

/** 相似度計算（六圍的歐氏距離） */
const METRICS: ReadonlyArray<
  keyof Pick<
    Pokemon,
    'hp' | 'attack' | 'defense' | 'sp_atk' | 'sp_def' | 'speed'
  >
> = ['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;

function distance(a: Pokemon, b: Pokemon): number {
  let sum = 0;
  for (const k of METRICS) {
    const d = (a[k] as number) - (b[k] as number);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** 單筆 + 相似度 Top K（排除自己） */
export function getByIdWithSimilar(path: string, id: number, k = 5) {
  const kk = Math.max(0, Math.min(50, Math.floor(k)));
  return readPokemonCsv(path).pipe(
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
