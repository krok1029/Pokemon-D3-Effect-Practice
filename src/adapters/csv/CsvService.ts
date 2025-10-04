import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';

export class DataLoadError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const CSV_PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
} as const;

export async function readCsv(path: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return parse(raw, CSV_PARSE_OPTIONS) as unknown[];
  } catch (error) {
    if (error instanceof DataLoadError) {
      throw error;
    }
    throw new DataLoadError(`Failed to read CSV: ${formatError(error)}`);
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
