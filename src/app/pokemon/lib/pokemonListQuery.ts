import { createPokemonFormId } from '@/core/domain/valueObjects/PokemonFormId';

export type PokemonListFilters = {
  search: string;
  typeFilter: string | null;
  onlyLegendary: boolean;
};

export function readPokemonListFilters(
  params: Pick<URLSearchParams, 'get'>,
  validTypes: readonly string[],
): PokemonListFilters {
  const type = params.get('type');
  return {
    search: params.get('q') ?? '',
    typeFilter: type && validTypes.includes(type) ? type : null,
    onlyLegendary: params.get('legendary') === '1',
  };
}

export const POKEMON_PAGE_SIZE = 24;

export function readPokemonListPage(params: Pick<URLSearchParams, 'get'>): number {
  const page = Number(params.get('page') ?? 1);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function pokemonListHref(filters: PokemonListFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.typeFilter) params.set('type', filters.typeFilter);
  if (filters.onlyLegendary) params.set('legendary', '1');
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/pokemon?${query}` : '/pokemon';
}

export function pokemonCardAnchor(pokemon: { id: number; name: string; formId?: string }): string {
  const form = pokemon.formId ?? createPokemonFormId(pokemon.name);
  return `pokemon-${pokemon.id}-${form}`;
}

export function pokemonDetailReturnHref(
  detailHref: string,
  listHref: string,
  anchor: string,
): string {
  const [path, query] = detailHref.split('?');
  const params = new URLSearchParams(query);
  params.set('returnTo', `${listHref}#${anchor}`);
  return `${path}?${params}`;
}

export function safePokemonListReturnHref(
  returnTo: string | undefined,
  validTypes: readonly string[],
): string {
  if (!returnTo?.startsWith('/pokemon')) return '/pokemon';
  try {
    const url = new URL(returnTo, 'https://pokemon.invalid');
    if (url.origin !== 'https://pokemon.invalid' || url.pathname !== '/pokemon') return '/pokemon';
    const href = pokemonListHref(
      readPokemonListFilters(url.searchParams, validTypes),
      readPokemonListPage(url.searchParams),
    );
    const anchor = /^#pokemon-\d+-[a-z0-9-]+$/.test(url.hash) ? url.hash : '';
    return href + anchor;
  } catch {
    return '/pokemon';
  }
}
