// 基礎設施層：CSV 讀取服務（純 I/O 工具）
import { Effect } from 'effect';
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

export class DataLoadError extends Error {}

export const readCsv = (
  path: string
): Effect.Effect<unknown[], DataLoadError> =>
  Effect.tryPromise({
    try: () => fs.readFile(path, 'utf8'),
    catch: (e) => new DataLoadError(`Failed to read CSV: ${JSON.stringify(e)}`),
  }).pipe(
    Effect.map((raw) =>
      parse(raw, { columns: true, skip_empty_lines: true }) as unknown[]
    )
  );
