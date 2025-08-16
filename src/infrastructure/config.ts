import path from 'node:path';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';
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

export function createPokemonRepository(): PokemonRepository {
  return new PokemonRepositoryCsv(resolveDataPath());
}

let repository: PokemonRepository = createPokemonRepository();

export function getPokemonRepository(): PokemonRepository {
  return repository;
}

export function setPokemonRepository(repo: PokemonRepository): void {
  repository = repo;
}
