import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import { list, QueryInput } from '@/application/pokemon/list';
import '@/infrastructure/config'; // 初始化 DI 容器（Composition Root）
import { container } from 'tsyringe';
import { TOKENS } from '@/di/tokens';

// 將 URLSearchParams 轉換為 UseCase 的 QueryInput
function getQueryInput(req: NextRequest): QueryInput {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries()) as QueryInput;
}

// API 路由：只負責解析 → 呼叫 UseCase → 執行 Effect → 回應
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
