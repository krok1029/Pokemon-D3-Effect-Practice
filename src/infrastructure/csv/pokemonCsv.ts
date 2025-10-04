// src/infrastructure/csv/pokemonCsv.ts
import { DataLoadError } from './CsvService';
import {
  parseAbilities,
  toTypeName,
  toMultiplier,
  type Pokemon,
} from '@/domain/pokemon';
import { TYPES, type TypeName, type Multiplier } from '@/domain/types';
import { toBoolLike } from '@/domain/bool';

export interface PokemonCsvRow {
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
}

type AgainstKey = `Against ${TypeName}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
  rowIndex: number
): string {
  const value = record[key];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new DataLoadError(`第 ${rowIndex + 1} 列缺少必要欄位 ${key}`);
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const str = String(value).trim();
  return str === '' ? undefined : str;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  rowIndex: number
): number {
  const value = record[key];
  const str = typeof value === 'string' ? value : value != null ? String(value) : undefined;
  if (str == null || str === '') {
    throw new DataLoadError(`第 ${rowIndex + 1} 列缺少必要數值欄位 ${key}`);
  }
  const num = Number(str);
  if (Number.isNaN(num)) {
    throw new DataLoadError(`第 ${rowIndex + 1} 列欄位 ${key} 需為數字，實際為 ${str}`);
  }
  return num;
}

function readOptionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const str = String(value).trim();
  if (str === '') return undefined;
  const num = Number(str);
  if (Number.isNaN(num)) {
    throw new DataLoadError(`欄位 ${key} 需為數字，實際為 ${str}`);
  }
  return num;
}

function parseRow(row: unknown, index: number): PokemonCsvRow {
  if (!isRecord(row)) {
    throw new DataLoadError(`第 ${index + 1} 列資料格式不正確`);
  }
  return {
    Number: readNumber(row, 'Number', index),
    Name: readString(row, 'Name', index),
    'Type 1': readString(row, 'Type 1', index),
    'Type 2': readOptionalString(row, 'Type 2'),
    Abilities: readOptionalString(row, 'Abilities'),
    HP: readNumber(row, 'HP', index),
    Att: readNumber(row, 'Att', index),
    Def: readNumber(row, 'Def', index),
    Spa: readNumber(row, 'Spa', index),
    Spd: readNumber(row, 'Spd', index),
    Spe: readNumber(row, 'Spe', index),
    BST: readNumber(row, 'BST', index),
    Mean: readOptionalNumber(row, 'Mean'),
    'Standard Deviation': readOptionalNumber(row, 'Standard Deviation'),
    Generation: readNumber(row, 'Generation', index),
    'Experience type': readOptionalString(row, 'Experience type'),
    'Experience to level 100': readOptionalNumber(row, 'Experience to level 100'),
    'Final Evolution': readOptionalString(row, 'Final Evolution'),
    'Catch Rate': readOptionalNumber(row, 'Catch Rate'),
    Legendary: readOptionalString(row, 'Legendary'),
    'Mega Evolution': readOptionalString(row, 'Mega Evolution'),
    'Alolan Form': readOptionalString(row, 'Alolan Form'),
    'Galarian Form': readOptionalString(row, 'Galarian Form'),
    'Against Normal': readOptionalNumber(row, 'Against Normal'),
    'Against Fire': readOptionalNumber(row, 'Against Fire'),
    'Against Water': readOptionalNumber(row, 'Against Water'),
    'Against Electric': readOptionalNumber(row, 'Against Electric'),
    'Against Grass': readOptionalNumber(row, 'Against Grass'),
    'Against Ice': readOptionalNumber(row, 'Against Ice'),
    'Against Fighting': readOptionalNumber(row, 'Against Fighting'),
    'Against Poison': readOptionalNumber(row, 'Against Poison'),
    'Against Ground': readOptionalNumber(row, 'Against Ground'),
    'Against Flying': readOptionalNumber(row, 'Against Flying'),
    'Against Psychic': readOptionalNumber(row, 'Against Psychic'),
    'Against Bug': readOptionalNumber(row, 'Against Bug'),
    'Against Rock': readOptionalNumber(row, 'Against Rock'),
    'Against Ghost': readOptionalNumber(row, 'Against Ghost'),
    'Against Dragon': readOptionalNumber(row, 'Against Dragon'),
    'Against Dark': readOptionalNumber(row, 'Against Dark'),
    'Against Steel': readOptionalNumber(row, 'Against Steel'),
    'Against Fairy': readOptionalNumber(row, 'Against Fairy'),
    Height: readOptionalNumber(row, 'Height'),
    Weight: readOptionalNumber(row, 'Weight'),
    BMI: readOptionalNumber(row, 'BMI'),
  };
}

export function parsePokemonCsv(rows: unknown[]): PokemonCsvRow[] {
  return rows.map((row, index) => parseRow(row, index));
}

export function toPokemon(row: PokemonCsvRow): Pokemon {
  // 建 against 物件（避免 any）
  const r = row as unknown as Record<AgainstKey, number | undefined>;
  const against = Object.fromEntries(
    TYPES.map((t) => [t, toMultiplier(r[`Against ${t}` as AgainstKey])])
  ) as Record<TypeName, Multiplier>;

  return {
    id: row.Number,
    name: row.Name,
    type1: toTypeName(row['Type 1']),
    type2: row['Type 2'] ? toTypeName(row['Type 2'] as string) : null,
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
    against,
    height: row.Height ?? undefined,
    weight: row.Weight ?? undefined,
    bmi: row.BMI ?? undefined,
  };
}
