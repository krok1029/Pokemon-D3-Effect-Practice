import path from 'node:path';
import { Effect } from 'effect';
import type { EffectPokemonRepository } from '@/application/repositories/EffectPokemonRepository';
import { PokemonRepositoryCsv } from '@/infrastructure/repositories/PokemonRepositoryCsv';

function resolveDataPath(): string {
  const envPath = process.env.POKEMON_DATA_PATH;
  if (envPath) return path.resolve(process.cwd(), envPath);
  return path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'test'
      ? 'data/pokemon_fixture_30.csv'
      : 'data/pokemonCsv.csv'
  );
}

export function createPokemonRepository(): EffectPokemonRepository {
  const repo = new PokemonRepositoryCsv(resolveDataPath());
  Effect.runPromise(repo.init()).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize PokemonRepositoryCsv', e);
  });
  return repo;
}

let repository: EffectPokemonRepository = createPokemonRepository();

export function getPokemonRepository(): EffectPokemonRepository {
  return repository;
}

export function setPokemonRepository(repo: EffectPokemonRepository): void {
  repository = repo;
}
