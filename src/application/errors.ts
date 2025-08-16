export type InvalidInput = { _tag: 'InvalidInput'; message: string };
export type NotFound = { _tag: 'NotFound'; message: string };
export type ServiceError = InvalidInput | NotFound;

export const invalidInput = (message: string): InvalidInput => ({ _tag: 'InvalidInput', message });
export const notFound = (message: string): NotFound => ({ _tag: 'NotFound', message });
