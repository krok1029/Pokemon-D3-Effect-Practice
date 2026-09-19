import { loadPokemonListPage } from '@/app/pokemon/presenter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const page = await loadPokemonListPage(new URL(request.url).searchParams);
  return Response.json(page, { headers: { 'Cache-Control': 'no-store' } });
}
