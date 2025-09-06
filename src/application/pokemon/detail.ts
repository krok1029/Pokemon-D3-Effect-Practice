import { Effect, Schema as S } from 'effect';
import { NotFound as RepoNotFound, type PokemonRepository } from '@/domain/repositories/PokemonRepository';
import { PokemonRepositoryEffectAdapter } from '@/application/repositories/PokemonRepositoryEffectAdapter';
import { invalidInput, notFound } from '../errors';

export const PathSchema = S.Struct({ id: S.NumberFromString });
export type Path = S.Schema.Type<typeof PathSchema>;
export type PathInput = S.Schema.Encoded<typeof PathSchema>;

export const QuerySchema = S.Struct({ k: S.optional(S.NumberFromString) });
export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

export interface Input {
  path: PathInput;
  query: QueryInput;
}

export function detail(repo: PokemonRepository, input: Input) {
  const repoEff = new PokemonRepositoryEffectAdapter(repo);
  const eff = S.decodeUnknown(PathSchema)(input.path).pipe(
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap((p: Path) =>
      S.decodeUnknown(QuerySchema)(input.query).pipe(
        Effect.mapError((e) => invalidInput(String(e))),
        Effect.flatMap((q: Query) =>
          repoEff.getByIdWithSimilar(p.id, q.k ?? 5).pipe(
            Effect.mapError((e: unknown) =>
              e instanceof RepoNotFound
                ? notFound((e as RepoNotFound).message)
                : invalidInput(String(e))
            )
          )
        )
      )
    )
  );
  return Effect.either(eff);
}
