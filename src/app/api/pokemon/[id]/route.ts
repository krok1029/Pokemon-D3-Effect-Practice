// src/app/api/pokemon/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import { detail, PathInput, QueryInput } from '@/application/pokemon/detail';
import '@/infrastructure/config'; // ensure DI container is initialized
import { container } from 'tsyringe';
import { TOKENS } from '@/di/tokens';

function getPathInput(params: { id: string }): PathInput {
  return { id: params.id };
}

function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const repo = container.resolve(TOKENS.PokemonRepository);
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
