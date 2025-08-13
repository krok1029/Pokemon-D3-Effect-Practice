// src/app/api/pokemon/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Effect, Either } from 'effect';
import path from 'node:path';
import { listFromCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';

const DATA_PATH = process.env.DATA_PATH ?? path.resolve(process.cwd(), 'data/pokemon_fixture_30.csv');

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const leg = url.searchParams.get('legendary');
  const legendary = leg === null ? undefined : /^(true|1|yes|y)$/i.test(leg);
  const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
  const pageSize = url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined;
  const sort = url.searchParams.get('sort') ?? undefined;

  const eff = listFromCsv(DATA_PATH, { q, legendary, page, pageSize, sort });
  const r = await Effect.runPromise(Effect.either(eff));
  if (Either.isRight(r)) return NextResponse.json(r.right);
  return NextResponse.json({ error: { code: 'DATA_LOAD_ERROR', message: 'failed to load' } }, { status: 500 });
}
