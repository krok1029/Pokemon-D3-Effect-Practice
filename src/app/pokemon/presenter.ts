import { cache } from 'react';

import { getPokemonBaseStatsUseCase } from '@/server/useCases';

import {
  buildPokemonDetailPageViewModel,
  buildPokemonDetailEntryViewModel,
  getPokemonStatMaximums,
  PokemonDetailPageViewModel,
} from './view-models/pokemonDetailViewModel';
import { buildPokemonListPage } from './view-models/pokemonListViewModel';

export async function loadPokemonListPage(params = new URLSearchParams()) {
  return buildPokemonListPage(await getPokemonBaseStatsUseCase().execute(), params);
}

export async function loadPokemonDetailPageViewModel(): Promise<PokemonDetailPageViewModel> {
  const useCase = getPokemonBaseStatsUseCase();
  const dto = await useCase.execute();
  return buildPokemonDetailPageViewModel(dto);
}

export const loadPokemonFormViewModel = cache(async (id: number, formId?: string) => {
  const useCase = getPokemonBaseStatsUseCase();
  const dto = await useCase.executeForForm({ id, formId });
  if (!dto) return null;
  // Keep the list's stat scale while only building matchups for the selected form.
  const entries = await useCase.execute();
  return buildPokemonDetailEntryViewModel(dto, getPokemonStatMaximums(entries));
});
