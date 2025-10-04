export type Left<E> = { _tag: 'Left'; left: E };
export type Right<A> = { _tag: 'Right'; right: A };
export type Result<E, A> = Left<E> | Right<A>;

export function ok<A>(value: A): Right<A> {
  return { _tag: 'Right', right: value };
}

export function err<E>(error: E): Left<E> {
  return { _tag: 'Left', left: error };
}

export function isOk<E, A>(result: Result<E, A>): result is Right<A> {
  return result._tag === 'Right';
}

export function isErr<E, A>(result: Result<E, A>): result is Left<E> {
  return result._tag === 'Left';
}

export async function wrap<E, A>(
  fn: () => Promise<A>,
  onError: (error: unknown) => E,
): Promise<Result<E, A>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(onError(error));
  }
}
