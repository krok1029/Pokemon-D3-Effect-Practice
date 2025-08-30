import { Effect, Schema as S } from 'effect';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';
import { PokemonRepositoryEffectAdapter } from '@/application/repositories/PokemonRepositoryEffectAdapter';
import { invalidInput } from '../errors';
import { toBoolLike } from '@/domain/bool';

export const QuerySchema = S.Struct({
  q: S.optional(S.String),
  legendary: S.optional(S.String),
  page: S.optional(S.NumberFromString),
  pageSize: S.optional(S.NumberFromString),
  sort: S.optional(S.String),
});

export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

export function list(repo: PokemonRepository, input: QueryInput) {
  const repoEff = new PokemonRepositoryEffectAdapter(repo);
  const eff = S.decodeUnknown(QuerySchema)(input).pipe(
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap((q: Query) => {
      const legendary = toBoolLike(q.legendary);
      const params = {
        q: q.q,
        legendary: typeof legendary === 'boolean' ? legendary : undefined,
        page: q.page,
        pageSize: q.pageSize,
        sort: q.sort,
      };
      return repoEff.list(params);
    })
  );
  return Effect.either(eff);
}
