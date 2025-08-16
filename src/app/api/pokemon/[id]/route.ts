// src/app/api/pokemon/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Effect, Schema as S } from 'effect';
import path from 'node:path';
import {
  PokemonRepository,
  NotFound,
} from '@/domain/repositories/PokemonRepository';
import {
  PokemonRepository as PokemonRepositoryCsv,
} from '@/infrastructure/repositories/PokemonRepositoryCsv';

const DATA_PATH = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test'
    ? 'data/pokemon_fixture_30.csv'
    : 'data/pokemonCsv.csv'
);

const repo: PokemonRepository = new PokemonRepositoryCsv(DATA_PATH);

// Path: /api/pokemon/[id]
export const PathSchema = S.Struct({ id: S.NumberFromString });
export type Path = S.Schema.Type<typeof PathSchema>;
export type PathInput = S.Schema.Encoded<typeof PathSchema>;

// Query: ?k=5
export const QuerySchema = S.Struct({ k: S.optional(S.NumberFromString) });
export type Query = S.Schema.Type<typeof QuerySchema>;
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>;

function getPathInput(params: { id: string }): PathInput {
  return { id: params.id };
}

function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  // decode path & query → 取得已驗證的數值
  const eff = Effect.flatMap(
    S.decodeUnknown(PathSchema)(getPathInput(ctx.params)),
    (p: Path) =>
      Effect.flatMap(
        S.decodeUnknown(QuerySchema)(getQueryInput(_req)),
        (q: Query) => repo.getByIdWithSimilar(p.id, q.k ?? 5)
      )
  );

  return await Effect.runPromise(
    Effect.match(eff, {
      onFailure: (e) => {
        const status = e instanceof NotFound ? 404 : 400;
        const code = e instanceof NotFound ? 'NOT_FOUND' : 'INVALID_INPUT';
        return NextResponse.json(
          { error: { code, message: String(e) } },
          { status }
        );
      },
      onSuccess: (data) => NextResponse.json(data),
    })
  );
}
