import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';
import type { ServiceError } from '../errors';
import { invalidInput } from '../errors';
import { toBoolLike } from '@/domain/bool';

export interface QueryInput {
  q?: string;
  legendary?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  [key: string]: string | undefined;
}

type Query = {
  q?: string;
  legendary?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
};

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

function parseNumber(value: string | undefined, field: string) {
  if (value == null) return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw invalidInput(`${field} 必須是數字`);
  }
  return num;
}

function parseQuery(input: QueryInput): Query {
  const result: Query = {};
  if (input.q) {
    result.q = input.q;
  }

  if (input.legendary != null) {
    const bool = toBoolLike(input.legendary);
    if (typeof bool !== 'boolean') {
      throw invalidInput('legendary 參數格式錯誤');
    }
    result.legendary = bool;
  }

  result.page = parseNumber(input.page, 'page');
  result.pageSize = parseNumber(input.pageSize, 'pageSize');

  if (input.sort) {
    result.sort = input.sort;
  }

  return result;
}

function toServiceError(error: unknown): ServiceError {
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

export async function list(repo: PokemonRepository, input: QueryInput) {
  try {
    const params = parseQuery(input);
    const result = await repo.list(params);
    return right(result);
  } catch (error) {
    return left(toServiceError(error));
  }
}
