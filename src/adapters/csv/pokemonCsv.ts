// 基礎設施層：Pokemon CSV 解析與映射
import {
  parseAbilities,
  toTypeName,
  toMultiplier,
  type Pokemon,
} from '@/core/domain/pokemon/Pokemon';
import { TYPES, type TypeName, type Multiplier } from '@/core/domain/pokemon/types';
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

function parseNumber(
  record: Record<string, unknown>,
  key: string,
  index: number,
  optional = false,
): number | undefined {
  const raw = record[key];
  if (raw == null || raw === '') {
    if (optional) return undefined;
    throw new DataLoadError(`Row ${index}: ${key} is required`);
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (optional) return undefined;
      throw new DataLoadError(`Row ${index}: ${key} is required`);
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new DataLoadError(`Row ${index}: ${key} must be a number`);
}

function parseString(
  record: Record<string, unknown>,
  key: string,
  index: number,
  optional = false,
): string | undefined {
  const raw = record[key];
  if (raw == null) {
    if (optional) return undefined;
    throw new DataLoadError(`Row ${index}: ${key} is required`);
  }
  const str = typeof raw === 'string' ? raw.trim() : String(raw);
  if (!str) {
    if (optional) return undefined;
    throw new DataLoadError(`Row ${index}: ${key} is required`);
  }
  return str;
}

function parseRow(row: unknown, index: number): PokemonCsvRow {
  if (typeof row !== 'object' || row === null) {
    throw new DataLoadError(`Row ${index}: expected object`);
  }
  const record = row as Record<string, unknown>;
  const out: PokemonCsvRow = {
    Number: parseNumber(record, 'Number', index)!,
    Name: parseString(record, 'Name', index)!,
    'Type 1': parseString(record, 'Type 1', index)!,
    HP: parseNumber(record, 'HP', index)!,
    Att: parseNumber(record, 'Att', index)!,
    Def: parseNumber(record, 'Def', index)!,
    Spa: parseNumber(record, 'Spa', index)!,
    Spd: parseNumber(record, 'Spd', index)!,
    Spe: parseNumber(record, 'Spe', index)!,
    BST: parseNumber(record, 'BST', index)!,
    Generation: parseNumber(record, 'Generation', index)!,
  };

  const type2 = parseString(record, 'Type 2', index, true);
  if (type2) out['Type 2'] = type2;

  const abilities = parseString(record, 'Abilities', index, true);
  if (abilities) out.Abilities = abilities;

  const mean = parseNumber(record, 'Mean', index, true);
  if (mean !== undefined) out.Mean = mean;

  const sd = parseNumber(record, 'Standard Deviation', index, true);
  if (sd !== undefined) out['Standard Deviation'] = sd;

  const expType = parseString(record, 'Experience type', index, true);
  if (expType) out['Experience type'] = expType;

  const exp100 = parseNumber(record, 'Experience to level 100', index, true);
  if (exp100 !== undefined) out['Experience to level 100'] = exp100;

  const finalEvolution = parseString(record, 'Final Evolution', index, true);
  if (finalEvolution) out['Final Evolution'] = finalEvolution;

  const catchRate = parseNumber(record, 'Catch Rate', index, true);
  if (catchRate !== undefined) out['Catch Rate'] = catchRate;

  const legendary = parseString(record, 'Legendary', index, true);
  if (legendary) out.Legendary = legendary;

  const mega = parseString(record, 'Mega Evolution', index, true);
  if (mega) out['Mega Evolution'] = mega;

  const alolan = parseString(record, 'Alolan Form', index, true);
  if (alolan) out['Alolan Form'] = alolan;

  const galarian = parseString(record, 'Galarian Form', index, true);
  if (galarian) out['Galarian Form'] = galarian;

  for (const key of AGAINST_FIELDS) {
    const value = parseNumber(record, key, index, true);
    if (value !== undefined) {
      (out as unknown as Record<string, number | undefined>)[key] = value;
    }
  }

  const height = parseNumber(record, 'Height', index, true);
  if (height !== undefined) out.Height = height;

  const weight = parseNumber(record, 'Weight', index, true);
  if (weight !== undefined) out.Weight = weight;

  const bmi = parseNumber(record, 'BMI', index, true);
  if (bmi !== undefined) out.BMI = bmi;

  return out;
}

export function parsePokemonCsv(rows: unknown[]): PokemonCsvRow[] {
  return rows.map((row, index) => parseRow(row, index));
}

// 方便安全索引 "Against XXX" 欄位
export function toPokemon(row: PokemonCsvRow): Pokemon {
  // 建 against 物件（避免 any）
  const indexed = row as unknown as Record<AgainstKey, number | undefined>;
  const against = Object.fromEntries(
    TYPES.map((t) => [t, toMultiplier(indexed[`Against ${t}` as AgainstKey])]),
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
