// API 路由：/api/pokemon/[id]
import { NextRequest, NextResponse } from 'next/server';

import {
  detail,
  type PathInput,
  type QueryInput,
} from '@/core/application/pokemon/GetPokemonDetail';

import { getPokemonRepository } from '@/adapters/config';

type RouteContext = { params: Promise<{ id: string }> };

function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

async function getPathInput(ctx: RouteContext): Promise<PathInput> {
  const params = await ctx.params;
  return { id: params.id };
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const repo = getPokemonRepository();
  const result = await detail(repo, {
    path: await getPathInput(ctx),
    query: getQueryInput(req),
  });
  if (result._tag === 'Left') {
    const status = result.left._tag === 'NotFound' ? 404 : 400;
    const code = result.left._tag === 'NotFound' ? 'NOT_FOUND' : 'INVALID_INPUT';
    return NextResponse.json({ error: { code, message: result.left.message } }, { status });
  }
  return NextResponse.json(result.right);
}
