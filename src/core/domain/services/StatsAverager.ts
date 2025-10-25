import { Pokemon } from '../entities/Pokemon';
import { BaseStats } from '../valueObjects/BaseStats';

export interface AverageOptions {
  excludeLegendaries?: boolean;
}

export class StatsAverager {
  average(pokemons: readonly Pokemon[], options: AverageOptions = {}): BaseStats {
    const filtered = options.excludeLegendaries
      ? pokemons.filter((pokemon) => !pokemon.isLegendary)
      : pokemons;

    if (filtered.length === 0) {
      return BaseStats.zero();
    }

    const total = filtered.reduce((acc, pokemon) => acc.add(pokemon.stats), BaseStats.zero());

    return total.div(filtered.length);
  }
}
