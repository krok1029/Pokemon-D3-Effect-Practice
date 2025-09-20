// 基礎設施層：Pokemon CSV 解析與映射
import { Effect } from 'effect';
import * as S from 'effect/Schema';
import { DataLoadError } from './CsvService';
import {
  parseAbilities,
  toTypeName,
  toMultiplier,
  type Pokemon,
} from '@/domain/pokemon/Pokemon';
import { TYPES, type TypeName, type Multiplier } from '@/domain/pokemon/types';
import { toBoolLike } from '@/shared/bool';

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

export const parsePokemonCsv = (
  rows: unknown[]
): Effect.Effect<PokemonCsvRow[], DataLoadError> =>
  Effect.forEach(rows, (r) =>
    S.decodeUnknown(PokemonCsvRow)(r).pipe(
      Effect.mapError((e) => new DataLoadError(String(e)))
    )
  );

// 方便安全索引 "Against XXX" 欄位
type AgainstKey = `Against ${TypeName}`;

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
