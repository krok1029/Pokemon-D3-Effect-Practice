import 'reflect-metadata';
import path from 'node:path';
import { container } from 'tsyringe';

import { TOKENS } from '@/di/tokens';

import type { PokemonRepository } from '@/core/domain/pokemon/PokemonRepository';

import { PokemonRepositoryCsv } from '@/adapters/repo/PokemonRepositoryCsv';

const DATA_PATH_BY_ENV = {
  test: 'data/pokemon_fixture_30.csv',
  default: 'data/pokemonCsv.csv',
} as const;

function resolveDataPath(): string {
  const configuredPath = process.env.POKEMON_DATA_PATH;
  if (configuredPath) {
    return path.resolve(process.cwd(), configuredPath);
  }

  const key = process.env.NODE_ENV === 'test' ? 'test' : 'default';
  return path.resolve(process.cwd(), DATA_PATH_BY_ENV[key]);
}

function instantiateRepository(): PokemonRepository {
  const repository = new PokemonRepositoryCsv(resolveDataPath());
  repository.init().catch((error) => {
    console.error('Failed to initialize PokemonRepositoryCsv', error);
  });
  return repository;
}

export function createPokemonRepository(): PokemonRepository {
  return instantiateRepository();
}

let repository: PokemonRepository = instantiateRepository();
container.registerInstance(TOKENS.PokemonRepository, repository);

export function getPokemonRepository(): PokemonRepository {
  return repository;
}

export function setPokemonRepository(repo: PokemonRepository): void {
  repository = repo;
  container.registerInstance(TOKENS.PokemonRepository, repository);
}
