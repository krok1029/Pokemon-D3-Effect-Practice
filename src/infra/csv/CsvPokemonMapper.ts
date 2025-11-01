import { Pokemon } from '@/core/domain/entities/Pokemon';
import { BaseStats } from '@/core/domain/valueObjects/BaseStats';

type RawRow = Record<string, unknown>;

const STAT_COLUMN_MAP = {
  hp: 'HP',
  attack: 'Att',
  defense: 'Def',
  spAtk: 'Spa',
  spDef: 'Spd',
  speed: 'Spe',
} as const;

const TYPE_COLUMN_MAP = {
  primary: 'Type 1',
  secondary: 'Type 2',
} as const;

export class CsvPokemonMapper {
  static toDomain(row: RawRow, index: number): Pokemon {
    const id = CsvPokemonMapper.readInteger(row, 'Number', index);
    const name = CsvPokemonMapper.readString(row, 'Name', index);
    const stats = BaseStats.create({
      hp: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.hp, index),
      attack: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.attack, index),
      defense: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.defense, index),
      spAtk: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.spAtk, index),
      spDef: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.spDef, index),
      speed: CsvPokemonMapper.readInteger(row, STAT_COLUMN_MAP.speed, index),
    });
    const isLegendary = CsvPokemonMapper.readBoolean(row, 'Legendary');
    const primaryType = CsvPokemonMapper.readString(row, TYPE_COLUMN_MAP.primary, index);
    const secondaryType = CsvPokemonMapper.readOptionalString(row, TYPE_COLUMN_MAP.secondary);
    return new Pokemon(id, name, stats, isLegendary, primaryType, secondaryType);
  }

  private static readInteger(row: RawRow, column: string, index: number): number {
    const value = row[column];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    throw new Error(`Row ${index + 1}: column "${column}" must be an integer`);
  }

  private static readString(row: RawRow, column: string, index: number): string {
    const value = row[column];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    throw new Error(`Row ${index + 1}: column "${column}" must be a non-empty string`);
  }

  private static readOptionalString(row: RawRow, column: string): string | null {
    const value = row[column];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0 && trimmed.toLowerCase() !== 'none') {
        return trimmed;
      }
    }
    return null;
  }

  private static readBoolean(row: RawRow, column: string): boolean {
    const value = row[column];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === '1.0') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === '0.0') {
        return false;
      }
      const numeric = Number.parseFloat(normalized);
      if (!Number.isNaN(numeric)) {
        return numeric !== 0;
      }
    }
    return false;
  }
}
