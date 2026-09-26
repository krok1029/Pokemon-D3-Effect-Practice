import {
  buildTypeIconPath,
  normalizeTypeSlug,
  translateType,
  TYPE_COLOR_MAP,
} from '@/app/(routes)/chart/view-models/typeAverageStatsViewModel';
import { buildDatasetSummaryViewModel } from '@/app/view-models/datasetSummaryViewModel';

import type { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

import {
  buildPokemonCardViewModel,
  getPokemonStatMaximums,
  type PokemonTypeBadgeViewModel,
} from './pokemonCardViewModel';
import {
  readPokemonListFilters,
  readPokemonListPage,
  POKEMON_PAGE_SIZE,
} from '../lib/pokemonListQuery';
import { createPokemonSearchMatcher } from '../lib/pokemonSearch';

function getTypeOptions(entries: PokemonStatsEntryDto[]): PokemonTypeBadgeViewModel[] {
  const types = new Set(
    entries
      .flatMap((entry) => [entry.primaryType, entry.secondaryType])
      .filter((type): type is string => Boolean(type?.trim())),
  );
  return Array.from(types, (type) => {
    const slug = normalizeTypeSlug(type);
    return {
      slug,
      label: translateType(type),
      iconPath: buildTypeIconPath(type),
      color: TYPE_COLOR_MAP[slug] ?? '#64748b',
    };
  }).sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant', { sensitivity: 'base' }));
}

export function buildPokemonListPage(entries: PokemonStatsEntryDto[], params: URLSearchParams) {
  const typeOptions = getTypeOptions(entries);
  const filters = readPokemonListFilters(
    params,
    typeOptions.map((type) => type.slug),
  );
  const matchesSearch = createPokemonSearchMatcher(filters.search);
  const filtered = entries
    .filter(
      (entry) =>
        (!filters.onlyLegendary || entry.isLegendary) &&
        (!filters.typeFilter ||
          [entry.primaryType, entry.secondaryType].some(
            (type) => type && normalizeTypeSlug(type) === filters.typeFilter,
          )) &&
        matchesSearch(entry),
    )
    .sort((a, b) => a.id - b.id);
  const requested = readPokemonListPage(params);
  const lastPage = Math.max(1, Math.ceil(filtered.length / POKEMON_PAGE_SIZE));
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, lastPage) : 1;
  const maximums = getPokemonStatMaximums(entries);
  return {
    pokemons: filtered
      .slice((page - 1) * POKEMON_PAGE_SIZE, page * POKEMON_PAGE_SIZE)
      .map((entry) => buildPokemonCardViewModel(entry, maximums)),
    page,
    pageSize: POKEMON_PAGE_SIZE,
    total: filtered.length,
    filters,
    typeOptions,
    summary: buildDatasetSummaryViewModel(entries),
  };
}

export type PokemonListPage = ReturnType<typeof buildPokemonListPage>;
