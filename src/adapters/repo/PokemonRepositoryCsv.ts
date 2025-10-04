import type { Pokemon } from '@/core/domain/pokemon/Pokemon';
import type {
  PokemonListParams,
  PokemonListResult,
  PokemonRepository,
} from '@/core/domain/pokemon/PokemonRepository';

import { readCsv } from '@/adapters/csv/CsvService';
import { parsePokemonCsv, toPokemon } from '@/adapters/csv/pokemonCsv';
import {
  applyFilters,
  clampPage,
  clampPageSize,
  clampSimilarCount,
  distanceBetween,
  parseSortSpecs,
  requirePokemon,
  sortRows,
  DEFAULT_SIMILAR_COUNT,
} from '@/adapters/utils/repository-helpers';

export { NotFound } from '@/core/domain/pokemon/PokemonRepository';
export class PokemonRepositoryCsv implements PokemonRepository {
  private cache: ReadonlyArray<Pokemon> | undefined;

  constructor(private readonly path: string) {}

  async init(): Promise<void> {
    await this.loadData(true);
  }

  async getAll(): Promise<ReadonlyArray<Pokemon>> {
    return this.loadData();
  }

  async getById(id: number): Promise<Pokemon> {
    const data = await this.loadData();
    return requirePokemon(data, id);
  }

  async getByIdWithSimilar(
    id: number,
    count = DEFAULT_SIMILAR_COUNT,
  ): Promise<{
    pokemon: Pokemon;
    similar: Pokemon[];
  }> {
    const dataset = await this.loadData();
    const subject = requirePokemon(dataset, id);
    const limit = clampSimilarCount(count);

    const similar = dataset
      .filter((candidate) => candidate.id !== id)
      .map((candidate) => ({ candidate, distance: distanceBetween(subject, candidate) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((entry) => entry.candidate);

    return { pokemon: subject, similar };
  }

  async list(params: PokemonListParams): Promise<PokemonListResult> {
    const dataset = await this.loadData();
    const filtered = applyFilters(dataset, params);
    const sortSpecs = parseSortSpecs(params.sort);
    const sorted = sortRows(filtered, sortSpecs);

    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const start = (page - 1) * pageSize;

    return {
      total: filtered.length,
      page,
      pageSize,
      data: sorted.slice(start, start + pageSize),
    };
  }

  private async loadData(force = false): Promise<ReadonlyArray<Pokemon>> {
    if (!force && this.cache) {
      return this.cache;
    }

    const records = await readCsv(this.path);
    const pokemons = parsePokemonCsv(records).map(toPokemon);
    this.cache = pokemons;
    return pokemons;
  }
}
