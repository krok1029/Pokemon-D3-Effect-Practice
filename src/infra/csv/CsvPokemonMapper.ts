import { Pokemon } from '@/core/domain/entities/Pokemon';
import { BaseStats } from '@/core/domain/valueObjects/BaseStats';

type RawRow = Record<string, unknown>;

const POKEMON_TYPES = new Map(
  [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
  ].map((type) => [type.toLowerCase(), type]),
);

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
    const isLegendary = CsvPokemonMapper.readBoolean(row, 'Legendary', index);
    const primaryType = CsvPokemonMapper.readType(row, TYPE_COLUMN_MAP.primary, index);
    const secondaryType = CsvPokemonMapper.readSecondaryType(row, index);
    return new Pokemon(id, name, stats, isLegendary, primaryType, secondaryType);
  }

  private static readInteger(row: RawRow, column: string, index: number): number {
    const value = row[column];
    if (typeof value === 'number' && Number.isSafeInteger(value)) {
      return value;
    }
    if (typeof value === 'string' && /^[+-]?\d+$/.test(value.trim())) {
      const parsed = Number(value.trim());
      if (Number.isSafeInteger(parsed)) {
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

  private static readType(row: RawRow, column: string, index: number): string {
    const value = row[column];
    if (typeof value === 'string') {
      const type = POKEMON_TYPES.get(value.trim().toLowerCase());
      if (type) {
        return type;
      }
    }
    throw new Error(`Row ${index + 1}: column "${column}" must be a recognized Pokemon type`);
  }

  private static readSecondaryType(row: RawRow, index: number): string | null {
    const value = row[TYPE_COLUMN_MAP.secondary];
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '' || normalized === 'none') {
        return null;
      }
    }
    return CsvPokemonMapper.readType(row, TYPE_COLUMN_MAP.secondary, index);
  }

  private static readBoolean(row: RawRow, column: string, index: number): boolean {
    const value = row[column];
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 0 || value === 1) {
      return value === 1;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === '1.0') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === '0.0') {
        return false;
      }
    }
    throw new Error(`Row ${index + 1}: column "${column}" must be true, false, 0, 1, 0.0 or 1.0`);
  }
}
