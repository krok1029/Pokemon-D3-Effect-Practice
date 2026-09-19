import { describe, expect, it } from 'vitest';

import { buildPokemonDetailPageViewModel } from '@/app/pokemon/view-models/pokemonDetailViewModel';
import { buildPokemonListPage } from '@/app/pokemon/view-models/pokemonListViewModel';

import type { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

const entries: PokemonStatsEntryDto[] = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  name: `Sample ${index + 1}`,
  isLegendary: index % 2 === 0,
  primaryType: 'Fire',
  secondaryType: index % 2 === 0 ? 'Flying' : null,
  stats: { hp: index + 1, attack: 50, defense: 50, spAtk: 50, spDef: 50, speed: 50 },
}));

describe('pokemon list pages', () => {
  it('returns only one sorted batch with full counts and the same global stat scale', () => {
    // Arrange
    const input = [...entries].reverse();
    // Act
    const target = buildPokemonListPage(input, new URLSearchParams('page=2'));
    // Assert
    expect(target.total).toBe(50);
    expect(target.page).toBe(2);
    expect(target.pokemons.map((pokemon) => pokemon.id)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 25),
    );
    expect(target.pokemons[0].stats[0].ratio).toBe(0.5);
    expect(target.summary.sampleCountLabel).toBe('50');
    expect(target.summary.speciesCountLabel).toBe('50');
    expect(target.pokemons[0]).not.toHaveProperty('offenseMatchups');
    expect(target.pokemons[0]).not.toHaveProperty('defenseMatchups');
  });

  it('preserves existing card values without serializing detailed matchups', () => {
    // Arrange
    const { offenseMatchups, defenseMatchups, ...card } =
      buildPokemonDetailPageViewModel(entries).pokemons[0];
    // Act
    const target = buildPokemonListPage(entries, new URLSearchParams());
    // Assert
    expect(target.pokemons[0]).toEqual(card);
    expect(offenseMatchups).toHaveLength(18);
    expect(defenseMatchups).toHaveLength(18);
  });

  it('combines case-insensitive name, secondary type and legendary filters before paging', () => {
    // Arrange
    const params = new URLSearchParams('q=sAmPlE+1&type=flying&legendary=1&page=9');
    // Act
    const target = buildPokemonListPage(entries, params);
    // Assert
    expect(target.page).toBe(1);
    expect(target.total).toBe(6);
    expect(target.pokemons.map((pokemon) => pokemon.id)).toEqual([1, 11, 13, 15, 17, 19]);
  });

  it('clamps beyond the final page and handles invalid page numbers and empty results', () => {
    // Arrange / Act
    const last = buildPokemonListPage(entries, new URLSearchParams('page=9999'));
    const invalid = ['-1', '1.5', 'abc', 'Infinity'].map((page) =>
      buildPokemonListPage(entries, new URLSearchParams({ page })),
    );
    const empty = buildPokemonListPage(entries, new URLSearchParams('q=missing&page=2'));
    // Assert
    expect(last.page).toBe(3);
    expect(last.pokemons.map((pokemon) => pokemon.id)).toEqual([49, 50]);
    expect(invalid.map((result) => result.page)).toEqual([1, 1, 1, 1]);
    expect(empty).toMatchObject({ page: 1, total: 0, pokemons: [] });
  });
});
