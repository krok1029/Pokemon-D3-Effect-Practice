import { describe, expect, it } from 'vitest';

import { PokemonQueries } from '@/core/domain/specifications/PokemonQuery';

describe('PokemonQueries', () => {
  it('builds a query including legendaries by default', () => {
    expect(PokemonQueries.withLegendaries()).toEqual({ includeLegendaries: true });
  });

  it('builds a non-legendary query when requested', () => {
    expect(PokemonQueries.nonLegendaries()).toEqual({ includeLegendaries: false });
  });
});
