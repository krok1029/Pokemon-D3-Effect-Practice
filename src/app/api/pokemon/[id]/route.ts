// src/app/api/pokemon/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import path from 'node:path';
import {
  detail,
  PathInput,
  QueryInput,
} from '@/application/pokemon/detail';
import { PokemonRepositoryCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';

const DATA_PATH = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test'
    ? 'data/pokemon_fixture_30.csv'
    : 'data/pokemonCsv.csv'
);

function getPathInput(params: { id: string }): PathInput {
  return { id: params.id };
}

function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const repo = new PokemonRepositoryCsv(DATA_PATH);
  const result = await Effect.runPromise(
    detail(repo, { path: getPathInput(ctx.params), query: getQueryInput(req) })
  );
  if (result._tag === 'Left') {
    const status = result.left._tag === 'NotFound' ? 404 : 400;
    const code = result.left._tag === 'NotFound' ? 'NOT_FOUND' : 'INVALID_INPUT';
    return NextResponse.json(
      { error: { code, message: result.left.message } },
      { status }
    );
  }
  return NextResponse.json(result.right);
}
