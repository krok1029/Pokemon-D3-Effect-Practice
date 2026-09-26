import { describe, expect, it } from 'vitest';

import { buildPokemonStatsMatrixViewModel } from '@/app/(routes)/chart/view-models/pokemonStatsMatrixViewModel';

import type { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

const entry: PokemonStatsEntryDto = {
  id: 6,
  name: 'Mega Charizard X',
  isLegendary: false,
  primaryType: 'Fire',
  secondaryType: 'Dragon',
  stats: { hp: 78, attack: 130, defense: 111, spAtk: 130, spDef: 85, speed: 100 },
};

const target = buildPokemonStatsMatrixViewModel;

describe('chart form links', () => {
  it('preserves supplied identity instead of deriving it again from a display name', () => {
    // Arrange: A stable identity can differ from the current display name.
    const input = { ...entry, formId: 'stable-form/x & y' };

    // Act
    const result = target([input]).pokemons[0];

    // Assert: The query string round-trips the original form without changing its data.
    expect(result).toMatchObject({ ...input, typeLabel: '火', typeSlug: 'fire' });
    expect(result.detailHref).toBe('/pokemon/6?form=stable-form%2Fx+%26+y');
  });

  it('keeps legacy DTOs compatible with the existing form URL contract', () => {
    // Arrange: Older callers omit the optional DTO formId.
    const entries = [
      entry,
      { ...entry, name: 'Charizard' },
      { ...entry, name: 'Mega Charizard Y' },
    ];

    // Act
    const result = target(entries).pokemons;

    // Assert: Sharing a species number cannot collapse distinct form destinations.
    expect(result.map(({ detailHref }) => detailHref)).toEqual([
      '/pokemon/6?form=mega-charizard-x',
      '/pokemon/6?form=charizard',
      '/pokemon/6?form=mega-charizard-y',
    ]);
    expect(target([...entries].reverse()).pokemons.reverse()).toEqual(result);
  });
});
