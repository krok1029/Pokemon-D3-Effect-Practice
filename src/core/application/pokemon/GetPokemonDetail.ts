import { err, ok, type Result } from '@/core/shared/result';
import {
  NotFound as RepoNotFound,
  type PokemonRepository,
} from '@/core/domain/pokemon/PokemonRepository';
import { invalidInput, toServiceError, type ServiceError } from '../errors';

const DEFAULT_SIMILAR_COUNT = 5;

export type PathInputValue = string | number | null | undefined;
export type PathInput = { id: PathInputValue };

export type QueryInputValue = string | number | null | undefined;
export type QueryInput = { k?: QueryInputValue };

type DetailInput = { path: PathInput; query: QueryInput };
type DetailParams = { id: number; similarCount: number };

type DetailResult = Awaited<
  ReturnType<PokemonRepository['getByIdWithSimilar']>
>;

export async function detail(
  repo: PokemonRepository,
  input: DetailInput
): Promise<Result<ServiceError | RepoNotFound, DetailResult>> {
  try {
    const { id, similarCount } = parseDetailInput(input);
    const result = await repo.getByIdWithSimilar(id, similarCount);
    return ok(result);
  } catch (error) {
    if (error instanceof RepoNotFound) {
      return err(error);
    }
    return err(toServiceError(error));
  }
}

function parseDetailInput(input: DetailInput): DetailParams {
  const id = parseRequiredNumber(input.path.id, 'id');
  const similarCount = input.query.k == null
    ? DEFAULT_SIMILAR_COUNT
    : parseRequiredNumber(input.query.k, 'k');

  return { id, similarCount };
}

function parseRequiredNumber(value: PathInputValue | QueryInputValue, field: string): number {
  if (value == null) throw invalidInput(`${field} is required`);

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) throw invalidInput(`${field} is required`);
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed);
    }
  }

  throw invalidInput(`${field} must be a number`);
}
