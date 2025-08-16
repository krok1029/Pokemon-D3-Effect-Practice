import { Effect, Schema as S } from 'effect';
import type { PokemonRepository } from '@/application/repositories/PokemonRepository';
import type { Pokemon } from '@/domain/pokemon';
import { invalidInput } from '../errors';

export const QuerySchema = S.Struct({
  q: S.optional(S.String),
  legendary: S.optional(S.String),
  page: S.optional(S.NumberFromString),
  pageSize: S.optional(S.NumberFromString),
  sort: S.optional(S.String),
});

export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

function toBoolLike(raw?: string | null): boolean | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return undefined;
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

export function list(repo: PokemonRepository, input: QueryInput) {
  const eff = S.decodeUnknown(QuerySchema)(input).pipe(
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap((q: Query) =>
      repo.getAll().pipe(
        Effect.map((rows) => {
          let xs = rows.slice();

          if (q.q) {
            const qq = q.q.toLowerCase();
            xs = xs.filter((p) => p.name.toLowerCase().includes(qq));
          }
          const legendary = toBoolLike(q.legendary);
          if (typeof legendary === 'boolean') {
            xs = xs.filter((p) => p.legendary === legendary);
          }

          const sortPairs = parseSortParam(q.sort);
          if (sortPairs.length > 0) {
            xs.sort((a, b) => compareByPairs(a, b, sortPairs));
          }

          const page = Math.max(1, q.page ?? 1);
          const pageSize = Math.min(200, Math.max(1, q.pageSize ?? 50));
          const start = (page - 1) * pageSize;
          const data = xs.slice(start, start + pageSize);

          return { total: xs.length, page, pageSize, data };
        })
      )
    )
  );
  return Effect.either(eff);
}
