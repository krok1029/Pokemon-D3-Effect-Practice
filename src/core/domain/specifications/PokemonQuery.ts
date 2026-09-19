export interface PokemonQuery {
  includeLegendaries: boolean;
  id?: number;
  formId?: string;
}

export const PokemonQueries = {
  withLegendaries(): PokemonQuery {
    return { includeLegendaries: true };
  },
  nonLegendaries(): PokemonQuery {
    return { includeLegendaries: false };
  },
};
