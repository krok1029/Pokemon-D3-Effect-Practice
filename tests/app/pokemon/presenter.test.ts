import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/useCases', () => ({
  getPokemonBaseStatsUseCase: vi.fn(),
}));

vi.mock('@/app/pokemon/view-models/pokemonDetailViewModel', () => ({
  buildPokemonDetailPageViewModel: vi.fn(),
}));

import { getPokemonBaseStatsUseCase } from '@/server/useCases';

import { loadPokemonDetailPageViewModel } from '@/app/pokemon/presenter';
import { buildPokemonDetailPageViewModel } from '@/app/pokemon/view-models/pokemonDetailViewModel';

describe('loadPokemonDetailPageViewModel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads base stats via usecase and maps to view model', async () => {
    const dto = [
      {
        id: 1,
        name: 'Alpha',
        isLegendary: false,
        primaryType: 'fire',
        secondaryType: null,
        stats: { hp: 10, attack: 20, defense: 30, spAtk: 40, spDef: 50, speed: 60 },
      },
    ];

    const viewModel = { pokemons: [], typeOptions: [], statOptions: [], countLabel: '1' };

    const execute = vi.fn().mockResolvedValue(dto);
    (getPokemonBaseStatsUseCase as vi.Mock).mockReturnValue({ execute });
    (buildPokemonDetailPageViewModel as vi.Mock).mockReturnValue(viewModel);

    const result = await loadPokemonDetailPageViewModel();

    expect(getPokemonBaseStatsUseCase).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith();
    expect(buildPokemonDetailPageViewModel).toHaveBeenCalledWith(dto);
    expect(result).toBe(viewModel);
  });
});
