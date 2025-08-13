// src/infrastructure/csv/pokemonCsv.ts
import * as S from 'effect/Schema';
import { parseAbilities } from '@/app/domain/pokemon';
import { TYPES, type TypeName, type Multiplier } from '@/app/domain/types';

const NumStr = S.NumberFromString;

export const PokemonCsvRow = S.Struct({
  Number: NumStr,
  Name: S.String,
  'Type 1': S.String,
  'Type 2': S.optional(S.String),

  Abilities: S.optional(S.String),

  HP: NumStr,
  Att: NumStr,
  Def: NumStr,
  Spa: NumStr,
  Spd: NumStr,
  Spe: NumStr,
  BST: NumStr,
  Mean: S.optional(NumStr),
  'Standard Deviation': S.optional(NumStr),
  Generation: NumStr,
  'Experience type': S.optional(S.String),
  'Experience to level 100': S.optional(NumStr),

  // 這些原始 CSV 常是 "true/false/1/0/yes/no" 等字串 → 先用 String，稍後再統一轉 boolean
  'Final Evolution': S.optional(S.String),
  'Catch Rate': S.optional(NumStr),
  Legendary: S.optional(S.String),
  'Mega Evolution': S.optional(S.String),
  'Alolan Form': S.optional(S.String),
  'Galarian Form': S.optional(S.String),

  // Against * 欄位（可缺，缺值在映射時補 1）
  'Against Normal': S.optional(NumStr),
  'Against Fire': S.optional(NumStr),
  'Against Water': S.optional(NumStr),
  'Against Electric': S.optional(NumStr),
  'Against Grass': S.optional(NumStr),
  'Against Ice': S.optional(NumStr),
  'Against Fighting': S.optional(NumStr),
  'Against Poison': S.optional(NumStr),
  'Against Ground': S.optional(NumStr),
  'Against Flying': S.optional(NumStr),
  'Against Psychic': S.optional(NumStr),
  'Against Bug': S.optional(NumStr),
  'Against Rock': S.optional(NumStr),
  'Against Ghost': S.optional(NumStr),
  'Against Dragon': S.optional(NumStr),
  'Against Dark': S.optional(NumStr),
  'Against Steel': S.optional(NumStr),
  'Against Fairy': S.optional(NumStr),

  Height: S.optional(NumStr),
  Weight: S.optional(NumStr),
  BMI: S.optional(NumStr),
});
export type PokemonCsvRow = S.Schema.Type<typeof PokemonCsvRow>;

// 內部模型（Normalized）
export type Pokemon = {
  id: number;
  name: string;
  type1: TypeName;
  type2?: TypeName | null;
  abilities: string[];
  hp: number;
  attack: number;
  defense: number;
  sp_atk: number;
  sp_def: number;
  speed: number;
  bst: number;
  mean?: number;
  sd?: number;
  generation: number;
  expType?: string;
  expTo100?: number;
  finalEvolution?: boolean;
  catchRate?: number;
  legendary: boolean;
  mega?: boolean;
  alolan?: boolean;
  galarian?: boolean;
  against: Record<TypeName, Multiplier>;
  height?: number;
  weight?: number;
  bmi?: number;
};

// —— 小工具：型別/倍率/布林轉換 ——
function toTypeName(raw: string): TypeName {
  if (!TYPES.includes(raw as TypeName)) throw new Error(`Unknown type: ${raw}`);
  return raw as TypeName;
}

function asMultiplier(n: number | undefined): Multiplier {
  const legal = [0, 0.25, 0.5, 1, 2, 4] as const;
  const v = n ?? 1;
  if (!legal.includes(v as Multiplier))
    throw new Error(`Illegal multiplier ${v}`);
  return v as Multiplier;
}

function toBool(raw?: string | null): boolean | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === '') return undefined;
  return s === '1.0';
}

// 方便安全索引 "Against XXX" 欄位
type AgainstKey = `Against ${TypeName}`;

export function toPokemon(row: PokemonCsvRow): Pokemon {
  // 建 against 物件（避免 any）
  const r = row as unknown as Record<AgainstKey, number | undefined>;
  const against = Object.fromEntries(
    TYPES.map((t) => [t, asMultiplier(r[`Against ${t}` as AgainstKey])])
  ) as Record<TypeName, Multiplier>;

  return {
    id: row.Number,
    name: row.Name,
    type1: toTypeName(row['Type 1']),
    type2: row['Type 2'] ? toTypeName(row['Type 2'] as string) : null,
    abilities: parseAbilities(row.Abilities ?? ''),
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
    finalEvolution: toBool(row['Final Evolution']),
    catchRate: row['Catch Rate'] ?? undefined,
    legendary: toBool(row.Legendary) ?? false,
    mega: toBool(row['Mega Evolution']),
    alolan: toBool(row['Alolan Form']),
    galarian: toBool(row['Galarian Form']),
    against,
    height: row.Height ?? undefined,
    weight: row.Weight ?? undefined,
    bmi: row.BMI ?? undefined,
  };
}
