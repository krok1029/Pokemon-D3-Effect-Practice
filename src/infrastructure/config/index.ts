import 'reflect-metadata';
import path from 'node:path';
import type { PokemonRepository } from '@/domain/repositories/PokemonRepository';
import { PokemonRepositoryCsv } from '@/infrastructure/repo/PokemonRepositoryCsv';
import { container } from 'tsyringe';
import { TOKENS } from '@/di/tokens';

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
  const repo = new PokemonRepositoryCsv(resolveDataPath());
  repo.init().catch((e) => {
    console.error('Failed to initialize PokemonRepositoryCsv', e);
  });
  return repo;
}

let repository: PokemonRepository = createPokemonRepository();
// 確保 DI 容器中的綁定與目前的 Repository 實例保持一致
container.registerInstance(TOKENS.PokemonRepository, repository);

export function getPokemonRepository(): PokemonRepository {
  return repository;
}

export function setPokemonRepository(repo: PokemonRepository): void {
  repository = repo;
  container.registerInstance(TOKENS.PokemonRepository, repo);
}
