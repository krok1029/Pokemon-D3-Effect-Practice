import path from 'node:path';

import { BASE_STAT_KEYS, type BaseStats, type Pokemon } from '@/core/domain/pokemon';
import type { PokemonRepository } from '@/core/domain/pokemonRepository';

import { readCsvFile } from '@/infra/csv/readCsv';

type RawRow = Record<string, unknown>;

const STAT_COLUMN_MAP: Record<(typeof BASE_STAT_KEYS)[number], string> = {
  hp: 'HP',
  attack: 'Att',
  defense: 'Def',
  sp_atk: 'Spa',
  sp_def: 'Spd',
  speed: 'Spe',
};

export interface PokemonCsvRepositoryOptions {
  /**
   * CSV 檔案的絕對路徑。允許傳入相對值，會以 `process.cwd()` 換成絕對路徑。
   */
  filePath: string;
}

export class PokemonCsvRepository implements PokemonRepository {
  private readonly filePath: string;
  private cache: ReadonlyArray<Pokemon> | null = null;

  constructor(options: PokemonCsvRepositoryOptions) {
    this.filePath = path.isAbsolute(options.filePath)
      ? options.filePath
      : path.join(process.cwd(), options.filePath);
  }

  async getAll(): Promise<ReadonlyArray<Pokemon>> {
    if (this.cache) {
      return this.cache;
    }

    const rows = await readCsvFile(this.filePath);
    const pokemons = rows.map((row, index) => toPokemon(row, index));
    this.cache = pokemons;
    return pokemons;
  }
}

function toPokemon(row: RawRow, index: number): Pokemon {
  return {
    id: readInteger(row, 'Number', index),
    name: readString(row, 'Name', index),
    stats: readStats(row, index),
  };
}

function readStats(row: RawRow, index: number): BaseStats {
  return BASE_STAT_KEYS.reduce<BaseStats>((acc, key) => {
    const column = STAT_COLUMN_MAP[key];
    acc[key] = readNumber(row, column, index);
    return acc;
  }, {} as BaseStats);
}

function readNumber(row: RawRow, column: string, index: number): number {
  const value = row[column];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Row ${index + 1}: column "${column}" must be a number`);
}

function readInteger(row: RawRow, column: string, index: number): number {
  const num = readNumber(row, column, index);
  return Math.trunc(num);
}

function readString(row: RawRow, column: string, index: number): string {
  const value = row[column];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value);
  }
  throw new Error(`Row ${index + 1}: column "${column}" must be a non-empty string`);
}
