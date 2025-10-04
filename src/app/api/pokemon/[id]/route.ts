// API 路由：/api/pokemon/[id]
import { NextRequest, NextResponse } from 'next/server';
import {
  detail,
  type PathInput,
  type QueryInput,
} from '@/core/application/pokemon/GetPokemonDetail';
import { getPokemonRepository } from '@/adapters/config';

function getPathInput(params: { id: string }): PathInput {
  return { id: params.id };
}

function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  const entries = Object.fromEntries(url.searchParams.entries());
  return entries as QueryInput;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const repo = getPokemonRepository();
  const result = await detail(repo, {
    path: getPathInput(ctx.params),
    query: getQueryInput(req),
  });
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
