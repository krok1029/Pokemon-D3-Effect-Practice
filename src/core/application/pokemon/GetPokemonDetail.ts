import { invalidInput, isServiceError, type ServiceError } from '../errors';
import { ok, err, type Result } from '@/core/shared/result';
import {
  NotFound as RepoNotFound,
  type PokemonRepository,
} from '@/core/domain/pokemon/PokemonRepository';

export type PathInputValue = string | number | null | undefined;
export type PathInput = { id: PathInputValue };
export type Path = { id: number };

export type QueryInputValue = string | number | null | undefined;
export type QueryInput = { k?: QueryInputValue };
export type Query = { k?: number };

function toNumber(value: string | number, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) throw invalidInput(`${field} is required`);
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return Math.floor(parsed);
  }
  throw invalidInput(`${field} must be a number`);
}

function parsePath(input: PathInput): Path {
  if (input.id == null) throw invalidInput('id is required');
  return { id: toNumber(input.id, 'id') };
}

function parseQuery(input: QueryInput): Query {
  if (input.k == null) return {};
  return { k: toNumber(input.k, 'k') };
}

function toServiceError(error: unknown): ServiceError {
  if (isServiceError(error)) return error;
  if (error instanceof Error) return invalidInput(error.message);
  return invalidInput(String(error));
}

export async function detail(
  repo: PokemonRepository,
  input: { path: PathInput; query: QueryInput }
): Promise<Result<ServiceError | RepoNotFound, Awaited<ReturnType<PokemonRepository['getByIdWithSimilar']>>>> {
  try {
    const path = parsePath(input.path);
    const query = parseQuery(input.query);
    const result = await repo.getByIdWithSimilar(path.id, query.k ?? 5);
    return ok(result);
  } catch (error) {
    if (error instanceof RepoNotFound) {
      return err(error);
    }
    return err(toServiceError(error));
  }
}

