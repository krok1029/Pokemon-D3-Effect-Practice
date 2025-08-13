// src/infrastructure/csv/CsvService.ts
import { Effect } from 'effect';
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import * as S from 'effect/Schema';
import { PokemonCsvRow, toPokemon } from './pokemonCsv';

export class DataLoadError extends Error {}

export const readPokemonCsv = (path: string) =>
  // 1) 讀檔
  Effect.tryPromise({
    try: () => fs.readFile(path, 'utf8'),
    catch: (e) => new DataLoadError(`Failed to read CSV: ${JSON.stringify(e)}`),
  }).pipe(
    Effect.map((raw) => parse(raw, { columns: true, skip_empty_lines: true })),
    Effect.flatMap((rows) =>
      Effect.forEach(rows, (r) =>
        S.decodeUnknown(PokemonCsvRow)(r).pipe(
          Effect.mapError((e) => new DataLoadError(String(e)))
        )
      )
    ),
    Effect.map((decodedRows) => decodedRows.map(toPokemon))
  );
