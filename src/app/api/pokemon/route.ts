import { NextRequest, NextResponse } from 'next/server';

import { list, type QueryInput } from '@/core/application/pokemon/ListPokemons';

import { getPokemonRepository } from '@/adapters/config';

// 將 URLSearchParams 轉換為 UseCase 的 QueryInput
function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  const entries = Object.fromEntries(url.searchParams.entries());
  return entries as QueryInput;
}

// API 路由：只負責解析 → 呼叫 UseCase → 回應
export async function GET(req: NextRequest) {
  const repo = getPokemonRepository();
  const result = await list(repo, getQueryInput(req));
  if (result._tag === 'Left') {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: result.left.message } },
      { status: 400 },
    );
  }
  return NextResponse.json(result.right);
}
