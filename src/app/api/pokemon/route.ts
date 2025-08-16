import { NextRequest, NextResponse } from 'next/server';
import { Effect, Schema as S } from 'effect';
import path from 'node:path';
import { PokemonRepository } from '@/domain/repositories/PokemonRepository';
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

// ❶ 定義 Schema（執行時存在的值）
export const QuerySchema = S.Struct({
  q: S.optional(S.String),
  legendary: S.optional(S.String), // 寬鬆接收，後面轉布林
  page: S.optional(S.NumberFromString),
  pageSize: S.optional(S.NumberFromString),
  sort: S.optional(S.String),
});

// ❷ 型別推導（編譯時存在）
export type Query = S.Schema.Type<typeof QuerySchema>; // 驗證後型別
export type QueryInput = S.Schema.Encoded<typeof QuerySchema>; // 驗證前型別

// ❸ 把 URLSearchParams → QueryInput
function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  // Object.fromEntries(entries()) 是 { [key: string]: string }
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

// ❹ 寬鬆轉布林
function toBoolLike(raw?: string | null): boolean | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return undefined;
}

// ❺ API route
export async function GET(req: NextRequest) {
  return await Effect.runPromise(
    Effect.match(
      // decodeUnknown 的輸入就是 QueryInput，回傳 Effect<never, ParseError, Query>
      Effect.flatMap(
        S.decodeUnknown(QuerySchema)(getQueryInput(req)),
        (q: Query) =>
          repo.list({
            ...q,
            legendary: toBoolLike(q.legendary),
          })
      ),
      {
        onFailure: (e) =>
          NextResponse.json(
            { error: { code: 'INVALID_INPUT', message: String(e) } },
            { status: 400 }
          ),
        onSuccess: (data) => NextResponse.json(data),
      }
    )
  );
}
