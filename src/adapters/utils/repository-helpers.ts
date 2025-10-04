import type { Pokemon } from '@/core/domain/pokemon/Pokemon';
import { NotFound } from '@/core/domain/pokemon/PokemonRepository';
import type { PokemonListParams } from '@/core/domain/pokemon/PokemonRepository';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_SIMILAR_COUNT = 5;
export const MAX_SIMILAR_COUNT = 50;

const STAT_KEYS: ReadonlyArray<
  keyof Pick<Pokemon, 'hp' | 'attack' | 'defense' | 'sp_atk' | 'sp_def' | 'speed'>
> = ['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;

const ALLOWED_SORT_KEYS = new Set<keyof Pokemon>([
  'id',
  'name',
  'type1',
  'type2',
  'hp',
  'attack',
  'defense',
  'sp_atk',
  'sp_def',
  'speed',
  'bst',
  'mean',
  'sd',
  'generation',
  'expType',
  'expTo100',
  'finalEvolution',
  'catchRate',
  'legendary',
  'mega',
  'alolan',
  'galarian',
  'height',
  'weight',
  'bmi',
]);

type SortDirection = 'asc' | 'desc';
type SortSpec = readonly [keyof Pokemon, SortDirection];

export function distanceBetween(a: Pokemon, b: Pokemon): number {
  const sumOfSquares = STAT_KEYS.reduce((total, key) => {
    const difference = (a[key] as number) - (b[key] as number);
    return total + difference * difference;
  }, 0);
  return Math.sqrt(sumOfSquares);
}

export function clampSimilarCount(value: number): number {
  const normalized = Math.floor(value);
  if (!Number.isFinite(normalized)) return DEFAULT_SIMILAR_COUNT;
  return Math.max(0, Math.min(MAX_SIMILAR_COUNT, normalized));
}

export function clampPage(value: number | undefined): number {
  if (!value || value <= 0) return DEFAULT_PAGE;
  return Math.floor(value);
}

export function clampPageSize(value: number | undefined): number {
  if (!value || value <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

export function applyFilters(
  rows: ReadonlyArray<Pokemon>,
  params: Pick<PokemonListParams, 'q' | 'legendary'>,
): Pokemon[] {
  let result = rows;
  if (params.q) {
    const query = params.q.toLowerCase();
    result = result.filter((pokemon) => pokemon.name.toLowerCase().includes(query));
  }
  if (typeof params.legendary === 'boolean') {
    result = result.filter((pokemon) => pokemon.legendary === params.legendary);
  }
  return Array.from(result);
}

export function parseSortSpecs(sort?: string): SortSpec[] {
  if (!sort) return [];
  return sort
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap((token) => {
      const [field, direction] = token.split(':');
      const key = field?.trim() as keyof Pokemon;
      if (!ALLOWED_SORT_KEYS.has(key)) return [];
      const dir: SortDirection = direction?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      return [[key, dir] as SortSpec];
    });
}

export function sortRows(rows: ReadonlyArray<Pokemon>, specs: SortSpec[]): Pokemon[] {
  if (specs.length === 0) return [...rows];
  return [...rows].sort((a, b) => compareBySpecs(a, b, specs));
}

export function compareBySpecs(a: Pokemon, b: Pokemon, specs: SortSpec[]): number {
  for (const [key, direction] of specs) {
    const left = normalizeComparable(a[key]);
    const right = normalizeComparable(b[key]);
    if (left < right) return direction === 'asc' ? -1 : 1;
    if (left > right) return direction === 'asc' ? 1 : -1;
  }
  return 0;
}

export function normalizeComparable(value: unknown): number | string {
  if (value == null) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value);
}

export function requirePokemon(dataset: ReadonlyArray<Pokemon>, id: number): Pokemon {
  const pokemon = dataset.find((entry) => entry.id === id);
  if (!pokemon) throw new NotFound(`Pokemon ${id} not found`);
  return pokemon;
}
