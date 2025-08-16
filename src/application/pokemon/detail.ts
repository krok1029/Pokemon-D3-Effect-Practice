import { Effect, Schema as S } from 'effect';
import { getByIdWithSimilar, NotFound as RepoNotFound } from '@/infrastructure/repositories/PokemonRepositoryCsv';
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

export function detail(path: string, input: Input) {
  const eff = S.decodeUnknown(PathSchema)(input.path).pipe(
    Effect.mapError((e) => invalidInput(String(e))),
    Effect.flatMap((p: Path) =>
      S.decodeUnknown(QuerySchema)(input.query).pipe(
        Effect.mapError((e) => invalidInput(String(e))),
        Effect.flatMap((q: Query) =>
          getByIdWithSimilar(path, p.id, q.k ?? 5).pipe(
            Effect.mapError((e) =>
              e instanceof RepoNotFound ? notFound(e.message) : invalidInput(String(e))
            )
          )
        )
      )
    )
  );
  return Effect.either(eff);
}
