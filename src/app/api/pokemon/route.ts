import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import { list, QueryInput } from '@/application/pokemon/list';
import '@/infrastructure/config'; // ensure DI container is initialized
import { container } from '@/di/container';
import { TOKENS } from '@/di/tokens';

// 把 URLSearchParams → QueryInput
function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

// API route
export async function GET(req: NextRequest) {
  const repo = container.resolve(TOKENS.PokemonRepository);
  const result = await Effect.runPromise(list(repo, getQueryInput(req)));
  if (result._tag === 'Left') {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: result.left.message } },
      { status: 400 }
    );
  }
  return NextResponse.json(result.right);
}
