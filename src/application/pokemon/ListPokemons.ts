import type {
  PokemonListResult,
  PokemonRepository,
} from '@/domain/pokemon/PokemonRepository';
import { invalidInput, isServiceError, type ServiceError } from '../errors';
import { ok, err, type Result } from '@/shared/result';
import { toBoolLike } from '@/shared/bool';

// === Types ===
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

type QueryInputValue = string | number | null | undefined;

export type QueryInput = {
  q?: QueryInputValue;
  legendary?: QueryInputValue;
  page?: QueryInputValue;
  pageSize?: QueryInputValue;
  sort?: QueryInputValue;
};

export type Query = {
  q?: string;
  legendary?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

// === Utilities ===
function normalizeSort(
  input?: string
): `${SortKey}:${'asc' | 'desc'}` | undefined {
  if (!input) return undefined;
  const [rawKey, rawDir] = input.split(':').map((s) => s?.trim().toLowerCase());
  const dir = rawDir === 'desc' ? 'desc' : 'asc';
  const allowed: SortKey[] = [
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
  ];
  if (allowed.includes(rawKey as SortKey)) {
    return `${rawKey as SortKey}:${dir}`;
  }
  return undefined;
}

function toOptionalString(value: QueryInputValue, field: string): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  throw invalidInput(`${field} must be a string`);
}

function toOptionalNumber(value: QueryInputValue, field: string): number | undefined {
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

function decodeQuery(input: QueryInput): Query {
  return {
    q: toOptionalString(input.q, 'q'),
    legendary: toOptionalString(input.legendary, 'legendary'),
    page: toOptionalNumber(input.page, 'page'),
    pageSize: toOptionalNumber(input.pageSize, 'pageSize'),
    sort: toOptionalString(input.sort, 'sort'),
  } satisfies Query;
}

function toServiceError(error: unknown): ServiceError {
  if (isServiceError(error)) return error;
  if (error instanceof Error) return invalidInput(error.message);
  return invalidInput(String(error));
}

// === UseCase ===
export async function list(
  repo: PokemonRepository,
  input: QueryInput
): Promise<Result<ServiceError, PokemonListResult>> {
  try {
    const q = decodeQuery(input);
    const legendary = toBoolLike(q.legendary);

    const params = {
      q: q.q?.trim() ? q.q.trim() : undefined,
      legendary: typeof legendary === 'boolean' ? legendary : undefined,
      page: q.page && q.page > 0 ? q.page : 1,
      pageSize:
        q.pageSize && q.pageSize > 0 && q.pageSize <= 200 ? q.pageSize : 50,
      sort: normalizeSort(q.sort),
    } as const;

    const result = await repo.list(params);
    return ok(result);
  } catch (error) {
    return err(toServiceError(error));
  }
}

