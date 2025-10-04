// src/infrastructure/csv/CsvService.ts
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

export class DataLoadError extends Error {}

export async function readCsv(path: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return parse(raw, { columns: true, skip_empty_lines: true }) as unknown[];
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);
    throw new DataLoadError(`Failed to read CSV: ${message}`);
  }
}
