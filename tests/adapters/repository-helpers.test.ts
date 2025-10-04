import { describe, it, expect } from 'vitest';

import type { Pokemon } from '@/core/domain/pokemon/Pokemon';
import { NotFound } from '@/core/domain/pokemon/PokemonRepository';
import { TYPES } from '@/core/domain/pokemon/types';

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SIMILAR_COUNT,
  applyFilters,
  clampPage,
  clampPageSize,
  clampSimilarCount,
  compareBySpecs,
  distanceBetween,
  normalizeComparable,
  parseSortSpecs,
  requirePokemon,
  sortRows,
} from '@/adapters/utils/repository-helpers';

const againstOnes = Object.fromEntries(TYPES.map((t) => [t, 1])) as Pokemon['against'];

function createPokemon(overrides: Partial<Pokemon> & { id: number; name: string }): Pokemon {
  return {
    id: overrides.id,
    name: overrides.name,
    type1: overrides.type1 ?? 'Normal',
    type2: overrides.type2 ?? null,
    abilities: overrides.abilities ?? [],
    generation: overrides.generation ?? 1,
    legendary: overrides.legendary ?? false,
    against: overrides.against ?? againstOnes,
    hp: overrides.hp ?? 50,
    attack: overrides.attack ?? 60,
    defense: overrides.defense ?? 40,
    sp_atk: overrides.sp_atk ?? 70,
    sp_def: overrides.sp_def ?? 65,
    speed: overrides.speed ?? 80,
    bst: overrides.bst ?? 365,
    mean: overrides.mean,
    sd: overrides.sd,
    expType: overrides.expType,
    expTo100: overrides.expTo100,
    finalEvolution: overrides.finalEvolution,
    catchRate: overrides.catchRate,
    mega: overrides.mega,
    alolan: overrides.alolan,
    galarian: overrides.galarian,
    height: overrides.height,
    weight: overrides.weight,
    bmi: overrides.bmi,
  };
}

describe('repository helpers', () => {
  const pikachu = createPokemon({ id: 25, name: 'Pikachu', speed: 90, attack: 55 });
  const bulbasaur = createPokemon({ id: 1, name: 'Bulbasaur', speed: 45, attack: 49 });
  const mewtwo = createPokemon({
    id: 150,
    name: 'Mewtwo',
    legendary: true,
    speed: 130,
    attack: 110,
  });
  const dataset = [pikachu, bulbasaur, mewtwo];

  it('clampSimilarCount keeps values within range', () => {
    expect(clampSimilarCount(10)).toBe(10);
    expect(clampSimilarCount(-5)).toBe(0);
    expect(clampSimilarCount(999)).toBe(50);
    expect(clampSimilarCount(Number.NaN)).toBe(DEFAULT_SIMILAR_COUNT);
  });

  it('clampPage and clampPageSize apply defaults and bounds', () => {
    expect(clampPage(undefined)).toBe(DEFAULT_PAGE);
    expect(clampPage(3)).toBe(3);
    expect(clampPage(0)).toBe(DEFAULT_PAGE);

    expect(clampPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(10)).toBe(10);
    expect(clampPageSize(500)).toBe(200);
  });

  it('applyFilters supports text query and legendary flag', () => {
    const filteredByText = applyFilters(dataset, { q: 'chu' });
    expect(filteredByText).toHaveLength(1);
    expect(filteredByText[0].id).toBe(25);

    const filteredLegendary = applyFilters(dataset, { legendary: true });
    expect(filteredLegendary).toHaveLength(1);
    expect(filteredLegendary[0].id).toBe(150);
  });

  it('parseSortSpecs parses multiple fields with direction', () => {
    const specs = parseSortSpecs('speed:desc,name:asc');
    expect(specs).toEqual([
      ['speed', 'desc'],
      ['name', 'asc'],
    ]);
  });

  it('sortRows orders rows based on specs', () => {
    const specs = parseSortSpecs('attack:asc,speed:desc');
    const sorted = sortRows(dataset, specs);
    expect(sorted.map((p) => p.id)).toEqual([1, 25, 150]);

    const reversed = sortRows(dataset, parseSortSpecs('attack:desc'));
    expect(reversed.map((p) => p.id)).toEqual([150, 25, 1]);
  });

  it('compareBySpecs handles tie-breaking', () => {
    const specs = parseSortSpecs('speed:desc,attack:asc');
    const result = compareBySpecs(pikachu, bulbasaur, specs);
    expect(result).toBeLessThan(0);
  });

  it('normalizeComparable coerces values consistently', () => {
    expect(normalizeComparable(undefined)).toBe('');
    expect(normalizeComparable(5)).toBe(5);
    expect(normalizeComparable(true)).toBe(1);
    expect(normalizeComparable('abc')).toBe('abc');
  });

  it('distanceBetween returns euclidean distance', () => {
    const distance = distanceBetween(pikachu, bulbasaur);
    expect(distance).toBeGreaterThan(0);
    expect(distanceBetween(pikachu, pikachu)).toBe(0);
  });

  it('requirePokemon returns match or throws NotFound', () => {
    expect(requirePokemon(dataset, 25)).toBe(pikachu);
    expect(() => requirePokemon(dataset, 9999)).toThrowError(NotFound);
  });
});
