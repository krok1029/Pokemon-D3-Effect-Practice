export interface PokemonQuery {
  includeLegendaries: boolean;
}

export const PokemonQueries = {
  withLegendaries(): PokemonQuery {
    return { includeLegendaries: true };
  },
  nonLegendaries(): PokemonQuery {
    return { includeLegendaries: false };
  },
};
