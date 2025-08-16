import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import path from 'node:path';
import { list, QueryInput } from '@/application/pokemon/list';
import { PokemonRepositoryCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';

const DATA_PATH = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test'
    ? 'data/pokemon_fixture_30.csv'
    : 'data/pokemonCsv.csv'
);

// 把 URLSearchParams → QueryInput
function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

// API route
export async function GET(req: NextRequest) {
  const repo = new PokemonRepositoryCsv(DATA_PATH);
  const result = await Effect.runPromise(list(repo, getQueryInput(req)));
  if (result._tag === 'Left') {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: result.left.message } },
      { status: 400 }
    );
  }
  return NextResponse.json(result.right);
}
