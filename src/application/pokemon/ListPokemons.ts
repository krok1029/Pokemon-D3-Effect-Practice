import { Effect, Schema as S } from 'effect';
import type { PokemonRepository } from '@/domain/pokemon/PokemonRepository';
import { invalidInput } from '../errors';
import { toBoolLike } from '@/shared/bool';

// === Utilities ===
function fmtSchemaError(e: unknown) {
  return String(e);
}

type SortKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'sp_atk'
  | 'sp_def'
  | 'speed'
  | 'bst'
  | 'mean'
  | 'sd'
  | 'generation';

function normalizeSort(
  input?: string
): `${SortKey}:${'asc' | 'desc'}` | undefined {
  if (!input) return undefined;
  const [rawKey, rawDir] = input.split(':').map((s) => s?.trim().toLowerCase());
  const dir = rawDir === 'desc' ? 'desc' : 'asc';
  const allowed: SortKey[] = [
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
  ];
  if (allowed.includes(rawKey as SortKey)) {
    return `${rawKey as SortKey}:${dir}`;
  }
  return undefined;
}

// === Schema ===
export const QuerySchema = S.Struct({
  q: S.optional(S.String),
  legendary: S.optional(S.String),
  page: S.optional(S.NumberFromString),
  pageSize: S.optional(S.NumberFromString),
  sort: S.optional(S.String),
});

export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

// === UseCase ===
export function list(repo: PokemonRepository, input: QueryInput) {
  const eff = S.decodeUnknown(QuerySchema)(input).pipe(
    Effect.mapError((e) => invalidInput(fmtSchemaError(e))),
    Effect.flatMap((q: Query) => {
      const legendary = toBoolLike(q.legendary);

      const params = {
        q: q.q?.trim() ? q.q.trim() : undefined,
        legendary: typeof legendary === 'boolean' ? legendary : undefined,
        page: q.page && q.page > 0 ? q.page : 1,
        pageSize:
          q.pageSize && q.pageSize > 0 && q.pageSize <= 200 ? q.pageSize : 50,
        sort: normalizeSort(q.sort),
      } as const;

      return Effect.tryPromise(() => repo.list(params));
    })
  );

  return Effect.either(eff);
}

