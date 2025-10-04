export type InvalidInput = { _tag: 'InvalidInput'; message: string };
export type NotFound = { _tag: 'NotFound'; message: string };
export type ServiceError = InvalidInput | NotFound;

export const invalidInput = (message: string): InvalidInput => ({
  _tag: 'InvalidInput',
  message,
});

export const notFound = (message: string): NotFound => ({
  _tag: 'NotFound',
  message,
});

export function isInvalidInput(error: unknown): error is InvalidInput {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { _tag?: unknown })._tag === 'InvalidInput'
  );
}

export function isServiceError(error: unknown): error is ServiceError {
  if (typeof error !== 'object' || error === null) return false;
  const tag = (error as { _tag?: unknown })._tag;
  return tag === 'InvalidInput' || tag === 'NotFound';
}

export function toServiceError(error: unknown): ServiceError {
  if (isServiceError(error)) return error;
  if (error instanceof Error) return invalidInput(error.message);
  return invalidInput(String(error));
}
