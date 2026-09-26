import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PokemonChartSelection } from '@/app/(routes)/chart/components/PokemonChartSelection';
import { buildPokemonStatsMatrixViewModel } from '@/app/(routes)/chart/view-models/pokemonStatsMatrixViewModel';
import { buildPokemonListPage } from '@/app/pokemon/view-models/pokemonListViewModel';

import type { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

const entries: PokemonStatsEntryDto[] = [
  { id: 25, name: 'Pikachu', primaryType: 'Electric' },
  { id: 125, name: 'Electabuzz', primaryType: 'Electric' },
  { id: 250, name: 'Ho-Oh', primaryType: 'Fire' },
  { id: 83, name: "Farfetch'd", primaryType: 'Normal' },
  { id: 83, name: "Galarian Farfetch'd", primaryType: 'Fighting' },
  { id: 122, name: 'Mr. Mime', primaryType: 'Psychic' },
  { id: 122, name: 'Galarian Mr. Mime', primaryType: 'Ice' },
].map((entry) => ({
  ...entry,
  isLegendary: false,
  secondaryType: null,
  stats: { hp: 50, attack: 50, defense: 50, spAtk: 50, spDef: 50, speed: 50 },
}));

const cases: [string, string[]][] = [
  ['#025', ['Pikachu']],
  ['025', ['Pikachu']],
  ['#25', ['Pikachu']],
  ['  #00025  ', ['Pikachu']],
  ['25', ['Pikachu', 'Electabuzz', 'Ho-Oh']],
  ['pIkA', ['Pikachu']],
  ['Farfetch’d', ["Farfetch'd", "Galarian Farfetch'd"]],
  ['Farfetch‘d', ["Farfetch'd", "Galarian Farfetch'd"]],
  ['Farfetchd', ["Farfetch'd", "Galarian Farfetch'd"]],
  ['Mr Mime', ['Mr. Mime', 'Galarian Mr. Mime']],
  ['mr.mime', ['Mr. Mime', 'Galarian Mr. Mime']],
  ['Mr.   Mime', ['Mr. Mime', 'Galarian Mr. Mime']],
  ['#025oops', []],
  ['#', []],
  [' . ’ ', []],
  ['000', []],
  ['皮卡丘', []],
];

describe('catalog and chart search formats', () => {
  it.each(cases)('finds the same forms for %s in both search entry points', (query, names) => {
    // Arrange
    const target = buildPokemonListPage;
    render(
      <PokemonChartSelection
        pokemons={buildPokemonStatsMatrixViewModel(entries).pokemons}
        isSelected={() => false}
        onTogglePokemon={() => {}}
      />,
    );

    // Act
    const result = target(entries, new URLSearchParams({ q: query }));
    fireEvent.change(screen.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' }), {
      target: { value: query },
    });

    // Assert
    expect(result.pokemons.map((pokemon) => pokemon.name).sort()).toEqual([...names].sort());
    expect(
      screen
        .queryAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
        .sort(),
    ).toEqual(names.map((name) => `選取 ${name}`).sort());
    expect(result.filters.search).toBe(query);
  });

  it('preserves empty-query catalog results and the chart search prompt', () => {
    // Arrange
    const target = buildPokemonListPage;
    render(
      <PokemonChartSelection
        pokemons={buildPokemonStatsMatrixViewModel(entries).pokemons}
        isSelected={() => false}
        onTogglePokemon={() => {}}
      />,
    );

    // Act
    const result = target(entries, new URLSearchParams({ q: '   ' }));

    // Assert
    expect(result.total).toBe(entries.length);
    expect(screen.getByRole('status')).toHaveTextContent('輸入名稱或圖鑑編號以尋找樣本。');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('applies catalog type and legendary filters to normalized search results', () => {
    // Arrange
    const target = buildPokemonListPage;
    const input = [...entries, { ...entries[0], name: 'Legendary Pikachu', isLegendary: true }];

    // Act
    const result = target(input, new URLSearchParams('q=%23025&type=electric&legendary=1'));

    // Assert
    expect(result.total).toBe(1);
    expect(result.pokemons.map((pokemon) => pokemon.name)).toEqual(['Legendary Pikachu']);
  });
});
