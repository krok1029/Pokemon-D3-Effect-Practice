import { Pokemon } from '@/core/domain/entities/Pokemon';
import { BaseStatKey, BaseStats } from '@/core/domain/valueObjects/BaseStats';

let globalPokemonId = 1000;

const defaultStatsTemplate: Record<BaseStatKey, number> = {
  hp: 60,
  attack: 60,
  defense: 60,
  spAtk: 60,
  spDef: 60,
  speed: 60,
};

export const createBaseStats = (overrides: Partial<Record<BaseStatKey, number>> = {}): BaseStats =>
  BaseStats.create({
    ...defaultStatsTemplate,
    ...overrides,
  });

type CreatePokemonOptions = {
  id?: number;
  name?: string;
  stats?: BaseStats;
  isLegendary?: boolean;
  primaryType?: string;
  secondaryType?: string | null;
};

export const createPokemon = (options: CreatePokemonOptions = {}): Pokemon => {
  const id = options.id ?? ++globalPokemonId;
  const name = options.name ?? `Pokemon-${id}`;
  const stats = options.stats ?? createBaseStats();
  const isLegendary = options.isLegendary ?? false;
  const primaryType = options.primaryType ?? 'fire';
  const secondaryType = options.secondaryType ?? null;

  return new Pokemon(id, name, stats, isLegendary, primaryType, secondaryType);
};
