import {
  parseAbilities,
  toMultiplier,
  toTypeName,
  type Pokemon,
} from '@/core/domain/pokemon/Pokemon';
import { TYPES, type Multiplier, type TypeName } from '@/core/domain/pokemon/types';
import { toBoolLike } from '@/core/shared/bool';

import { DataLoadError } from './CsvService';

const AGAINST_FIELDS = [
  'Against Normal',
  'Against Fire',
  'Against Water',
  'Against Electric',
  'Against Grass',
  'Against Ice',
  'Against Fighting',
  'Against Poison',
  'Against Ground',
  'Against Flying',
  'Against Psychic',
  'Against Bug',
  'Against Rock',
  'Against Ghost',
  'Against Dragon',
  'Against Dark',
  'Against Steel',
  'Against Fairy',
] as const;

type AgainstKey = (typeof AGAINST_FIELDS)[number];
type RawRecord = Record<string, unknown>;

const OPTIONAL_STRING_KEYS = [
  'Type 2',
  'Abilities',
  'Experience type',
  'Final Evolution',
  'Legendary',
  'Mega Evolution',
  'Alolan Form',
  'Galarian Form',
] as const;

const OPTIONAL_NUMBER_KEYS = [
  'Mean',
  'Standard Deviation',
  'Experience to level 100',
  'Catch Rate',
  'Height',
  'Weight',
  'BMI',
] as const;

export type PokemonCsvRow = {
  Number: number;
  Name: string;
  'Type 1': string;
  'Type 2'?: string;
  Abilities?: string;
  HP: number;
  Att: number;
  Def: number;
  Spa: number;
  Spd: number;
  Spe: number;
  BST: number;
  Mean?: number;
  'Standard Deviation'?: number;
  Generation: number;
  'Experience type'?: string;
  'Experience to level 100'?: number;
  'Final Evolution'?: string;
  'Catch Rate'?: number;
  Legendary?: string;
  'Mega Evolution'?: string;
  'Alolan Form'?: string;
  'Galarian Form'?: string;
  'Against Normal'?: number;
  'Against Fire'?: number;
  'Against Water'?: number;
  'Against Electric'?: number;
  'Against Grass'?: number;
  'Against Ice'?: number;
  'Against Fighting'?: number;
  'Against Poison'?: number;
  'Against Ground'?: number;
  'Against Flying'?: number;
  'Against Psychic'?: number;
  'Against Bug'?: number;
  'Against Rock'?: number;
  'Against Ghost'?: number;
  'Against Dragon'?: number;
  'Against Dark'?: number;
  'Against Steel'?: number;
  'Against Fairy'?: number;
  Height?: number;
  Weight?: number;
  BMI?: number;
};

export function parsePokemonCsv(rows: unknown[]): PokemonCsvRow[] {
  return rows.map((row, index) => parseRow(row, index));
}

export function toPokemon(row: PokemonCsvRow): Pokemon {
  return {
    id: row.Number,
    name: row.Name,
    type1: toTypeName(row['Type 1']),
    type2: row['Type 2'] ? toTypeName(row['Type 2']) : null,
    abilities: parseAbilities(row.Abilities),
    hp: row.HP,
    attack: row.Att,
    defense: row.Def,
    sp_atk: row.Spa,
    sp_def: row.Spd,
    speed: row.Spe,
    bst: row.BST,
    mean: row.Mean ?? undefined,
    sd: row['Standard Deviation'] ?? undefined,
    generation: row.Generation,
    expType: row['Experience type'] ?? undefined,
    expTo100: row['Experience to level 100'] ?? undefined,
    finalEvolution: toBoolLike(row['Final Evolution']),
    catchRate: row['Catch Rate'] ?? undefined,
    legendary: toBoolLike(row.Legendary) ?? false,
    mega: toBoolLike(row['Mega Evolution']),
    alolan: toBoolLike(row['Alolan Form']),
    galarian: toBoolLike(row['Galarian Form']),
    against: buildAgainst(row),
    height: row.Height ?? undefined,
    weight: row.Weight ?? undefined,
    bmi: row.BMI ?? undefined,
  };
}

function parseRow(row: unknown, index: number): PokemonCsvRow {
  const record = ensureRecord(row, index);

  const output: PokemonCsvRow = {
    Number: readNumber(record, 'Number', index),
    Name: readString(record, 'Name', index),
    'Type 1': readString(record, 'Type 1', index),
    HP: readNumber(record, 'HP', index),
    Att: readNumber(record, 'Att', index),
    Def: readNumber(record, 'Def', index),
    Spa: readNumber(record, 'Spa', index),
    Spd: readNumber(record, 'Spd', index),
    Spe: readNumber(record, 'Spe', index),
    BST: readNumber(record, 'BST', index),
    Generation: readNumber(record, 'Generation', index),
  };

  for (const key of OPTIONAL_STRING_KEYS) {
    const value = readOptionalString(record, key);
    if (value !== undefined) {
      output[key] = value;
    }
  }

  for (const key of OPTIONAL_NUMBER_KEYS) {
    const value = readOptionalNumber(record, key, index);
    if (value !== undefined) {
      output[key] = value;
    }
  }

  for (const field of AGAINST_FIELDS) {
    const value = readOptionalNumber(record, field, index);
    if (value !== undefined) {
      (output as unknown as Record<AgainstKey, number | undefined>)[field] = value;
    }
  }

  return output;
}

function buildAgainst(row: PokemonCsvRow): Record<TypeName, Multiplier> {
  const indexed = row as unknown as Record<AgainstKey, number | undefined>;
  return Object.fromEntries(
    TYPES.map((type) => [type, toMultiplier(indexed[`Against ${type}` as AgainstKey])]),
  ) as Record<TypeName, Multiplier>;
}

function ensureRecord(row: unknown, index: number): RawRecord {
  if (typeof row !== 'object' || row === null) {
    throw new DataLoadError(`Row ${index}: expected object`);
  }
  return row as RawRecord;
}

function readNumber(record: RawRecord, key: string, index: number): number {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseNumberString(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  throw new DataLoadError(`Row ${index}: ${key} must be a number`);
}

function readOptionalNumber(record: RawRecord, key: string, index: number): number | undefined {
  const value = record[key];
  if (value == null || value === '') {
    return undefined;
  }
  return readNumber(record, key, index);
}

function readString(record: RawRecord, key: string, index: number): string {
  const value = readOptionalString(record, key);
  if (value === undefined) {
    throw new DataLoadError(`Row ${index}: ${key} is required`);
  }
  return value;
}

function readOptionalString(record: RawRecord, key: string): string | undefined {
  const value = record[key];
  if (value == null) {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : String(value).trim();
  if (!text) {
    return undefined;
  }
  return text;
}

function parseNumberString(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
