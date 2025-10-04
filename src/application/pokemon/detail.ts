import {
  NotFound as RepoNotFound,
  type PokemonRepository,
} from '@/domain/repositories/PokemonRepository';
import type { ServiceError } from '../errors';
import { invalidInput, notFound } from '../errors';

export interface PathInput {
  id: string;
  [key: string]: string | undefined;
}

export interface QueryInput {
  k?: string;
  [key: string]: string | undefined;
}

export interface Input {
  path: PathInput;
  query: QueryInput;
}

type Result<T> =
  | { _tag: 'Left'; left: ServiceError }
  | { _tag: 'Right'; right: T };

const left = <T = never>(error: ServiceError): Result<T> => ({
  _tag: 'Left',
  left: error,
});

const right = <T>(value: T): Result<T> => ({
  _tag: 'Right',
  right: value,
});

function parsePath(input: PathInput): { id: number } {
  const value = Number(input.id);
  if (Number.isNaN(value)) {
    throw invalidInput('id 必須是數字');
  }
  return { id: value };
}

function parseQuery(input: QueryInput): { k?: number } {
  if (input.k == null) {
    return {};
  }
  const value = Number(input.k);
  if (Number.isNaN(value)) {
    throw invalidInput('k 必須是數字');
  }
  return { k: value };
}

function toServiceError(error: unknown): ServiceError {
  if (error instanceof RepoNotFound) {
    return notFound(error.message);
  }
  if (typeof error === 'object' && error !== null && '_tag' in error) {
    const maybe = error as { _tag?: unknown; message?: unknown };
    if (typeof maybe._tag === 'string' && typeof maybe.message === 'string') {
      return maybe as ServiceError;
    }
  }
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '未知錯誤';
  return invalidInput(message);
}

export async function detail(repo: PokemonRepository, input: Input) {
  try {
    const path = parsePath(input.path);
    const query = parseQuery(input.query);
    const result = await repo.getByIdWithSimilar(path.id, query.k ?? 5);
    return right(result);
  } catch (error) {
    return left(toServiceError(error));
  }
}
