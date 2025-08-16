import { Effect, Schema as S } from 'effect';
import type { PokemonRepository } from '@/application/repositories/PokemonRepository';
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

export function list(repo: PokemonRepository, input: QueryInput) {
  const eff = S.decodeUnknown(QuerySchema)(input).pipe(
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap((q: Query) =>
      repo.list({
        ...q,
        legendary: toBoolLike(q.legendary),
      })
    )
  );
  return Effect.either(eff);
}
