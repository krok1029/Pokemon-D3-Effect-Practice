import { getPokemonBaseStatsUseCase } from '@/server/useCases';

import {
  buildPokemonDetailPageViewModel,
  PokemonDetailPageViewModel,
} from './view-models/pokemonDetailViewModel';

export async function loadPokemonDetailPageViewModel(): Promise<PokemonDetailPageViewModel> {
  const useCase = getPokemonBaseStatsUseCase();
  const dto = await useCase.execute();
  return buildPokemonDetailPageViewModel(dto);
}
