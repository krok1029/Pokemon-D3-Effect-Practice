import { Effect, Schema as S } from 'effect';
import { invalidInput } from '../errors';
import { NotFound as RepoNotFound, type PokemonRepository } from '@/domain/pokemon/PokemonRepository';

export const PathSchema = S.Struct({ id: S.NumberFromString });
export type Path = S.Schema.Type<typeof PathSchema>;
export type PathInput = S.Schema.Encoded<typeof PathSchema>;

export const QuerySchema = S.Struct({ k: S.optional(S.NumberFromString) });
export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

export function detail(
  repo: PokemonRepository,
  input: { path: PathInput; query: QueryInput }
) {
  const eff = S.decodeUnknown(PathSchema)(input.path).pipe(
    Effect.zip(S.decodeUnknown(QuerySchema)(input.query)),
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap(([path, query]) =>
      Effect.tryPromise(() => repo.getByIdWithSimilar(path.id, query.k ?? 5))
    ),
    Effect.catchAll((e) =>
      e instanceof RepoNotFound
        ? Effect.fail(e)
        : Effect.fail(invalidInput(String(e)))
    )
  );

  return Effect.either(eff);
}

