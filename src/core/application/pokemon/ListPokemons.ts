import type { PokemonListResult, PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';
import { err, ok, type Result } from '@/core/shared/result';
import { toBoolLike } from '@/core/shared/bool';
import { invalidInput, toServiceError, type ServiceError } from '../errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const SORTABLE_KEYS = new Set<SortKey>([
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
]);

type SortKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'sp_atk'
  | 'sp_def'
  | 'speed'
  | 'bst'
  | 'mean'
  | 'sd'
  | 'generation';

type QueryValue = string | number | null | undefined;

export type QueryInput = {
  q?: QueryValue;
  legendary?: QueryValue;
  page?: QueryValue;
  pageSize?: QueryValue;
  sort?: QueryValue;
};

export type Query = {
  q?: string;
  legendary?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

type ListParams = Parameters<PokemonRepository['list']>[0];

type ParsedQuery = {
  search?: string;
  legendary?: boolean;
  page: number;
  pageSize: number;
  sort?: `${SortKey}:${'asc' | 'desc'}`;
};

export async function list(
  repo: PokemonRepository,
  input: QueryInput
): Promise<Result<ServiceError, PokemonListResult>> {
  try {
    const query = decodeQuery(input);
    const params = buildParams(query);
    const result = await repo.list(params);
    return ok(result);
  } catch (error) {
    return err(toServiceError(error));
  }
}

function decodeQuery(input: QueryInput): Query {
  return {
    q: toOptionalString(input.q, 'q'),
    legendary: toOptionalString(input.legendary, 'legendary'),
    page: toOptionalNumber(input.page, 'page'),
    pageSize: toOptionalNumber(input.pageSize, 'pageSize'),
    sort: toOptionalString(input.sort, 'sort'),
  } satisfies Query;
}

function buildParams(query: Query): ListParams {
  const parsed: ParsedQuery = {
    search: normalizeSearch(query.q),
    legendary: normalizeLegendary(query.legendary),
    page: normalizePage(query.page),
    pageSize: normalizePageSize(query.pageSize),
    sort: normalizeSort(query.sort),
  };

  return {
    q: parsed.search,
    legendary: parsed.legendary,
    page: parsed.page,
    pageSize: parsed.pageSize,
    sort: parsed.sort,
  };
}

function normalizeSearch(raw?: string): string | undefined {
  return raw?.trim() ? raw.trim() : undefined;
}

function normalizeLegendary(raw?: string): boolean | undefined {
  const legendary = toBoolLike(raw);
  return typeof legendary === 'boolean' ? legendary : undefined;
}

function normalizePage(raw?: number): number {
  return raw && raw > 0 ? raw : DEFAULT_PAGE;
}

function normalizePageSize(raw?: number): number {
  if (raw && raw > 0) {
    return Math.min(raw, MAX_PAGE_SIZE);
  }
  return DEFAULT_PAGE_SIZE;
}

function normalizeSort(
  input?: string
): `${SortKey}:${'asc' | 'desc'}` | undefined {
  if (!input) return undefined;
  const [rawKey, rawDir] = input.split(':').map((value) => value?.trim().toLowerCase());
  if (!SORTABLE_KEYS.has(rawKey as SortKey)) return undefined;
  const dir = rawDir === 'desc' ? 'desc' : 'asc';
  return `${rawKey as SortKey}:${dir}`;
}

function toOptionalString(value: QueryValue, field: string): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  throw invalidInput(`${field} must be a string`);
}

function toOptionalNumber(value: QueryValue, field: string): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw invalidInput(`${field} must be a number`);
}
