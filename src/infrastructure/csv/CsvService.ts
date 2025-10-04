// 基礎設施層：CSV 讀取服務（純 I/O 工具）
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

export class DataLoadError extends Error {}

export async function readCsv(path: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return parse(raw, { columns: true, skip_empty_lines: true }) as unknown[];
  } catch (error) {
    if (error instanceof DataLoadError) throw error;
    throw new DataLoadError(`Failed to read CSV: ${String(error)}`);
  }
}
