import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';

const CSV_PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
  trim: true,
} as const;

export async function readCsvFile(path: string): Promise<Record<string, unknown>[]> {
  const content = await fs.readFile(path, 'utf8');
  const records = parse(content, CSV_PARSE_OPTIONS) as Record<string, unknown>[];
  return records;
}
