import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/pokemon/lib/pokemonImages', () => {
  const imageMap: Record<number, string> = {
    1: '/img/001.png',
  };
  return {
    findPokemonImagePath: (id: number) => imageMap[id] ?? null,
  };
});

import { buildPokemonDetailPageViewModel } from '@/app/pokemon/view-models/pokemonDetailViewModel';

import { PokemonStatsEntryDto } from '@/core/application/dto/PokemonStatsDto';

describe('buildPokemonDetailPageViewModel', () => {
  const entries: PokemonStatsEntryDto[] = [
    {
      id: 2,
      name: 'Beta',
      isLegendary: false,
      primaryType: 'Water',
      secondaryType: null,
      stats: { hp: 50, attack: 40, defense: 60, spAtk: 70, spDef: 40, speed: 30 },
    },
    {
      id: 1,
      name: 'Alpha',
      isLegendary: true,
      primaryType: 'Fire',
      secondaryType: 'Flying',
      stats: { hp: 100, attack: 80, defense: 90, spAtk: 100, spDef: 90, speed: 80 },
    },
  ];

  it('sorts pokemons by id, maps badges, stats, totals and type options', () => {
    const vm = buildPokemonDetailPageViewModel(entries);

    expect(vm.countLabel).toBe('2');
    expect(vm.statOptions.map((s) => s.key)).toEqual([
      'hp',
      'attack',
      'defense',
      'spAtk',
      'spDef',
      'speed',
    ]);

    expect(vm.pokemons.map((p) => p.id)).toEqual([1, 2]); // sorted by id

    const alpha = vm.pokemons[0];
    expect(alpha.name).toBe('Alpha');
    expect(alpha.imagePath).toBe('/img/001.png');
    expect(alpha.typeBadges.map((b) => b.slug)).toEqual(['fire', 'flying']);
    expect(alpha.accentColor).toBe(alpha.typeBadges[0].color);
    expect(alpha.total).toBe(540);
    expect(alpha.stats.find((s) => s.key === 'attack')?.ratio).toBeCloseTo(1);

    const beta = vm.pokemons[1];
    expect(beta.typeBadges).toHaveLength(1);
    expect(beta.typeBadges[0].slug).toBe('water');
    expect(beta.stats.find((s) => s.key === 'attack')?.ratio).toBeCloseTo(0.5);

    expect(vm.typeOptions.map((t) => t.slug)).toEqual(['water', 'fire', 'flying']);
  });
});
