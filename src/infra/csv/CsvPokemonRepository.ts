import path from 'node:path';

import { Pokemon } from '@/core/domain/entities/Pokemon';
import { PokemonRepository } from '@/core/domain/repositories/PokemonRepository';
import { PokemonQuery } from '@/core/domain/specifications/PokemonQuery';

import { CsvPokemonMapper } from './CsvPokemonMapper';
import { readCsvFile } from './readCsv';

export class CsvPokemonRepository implements PokemonRepository {
  private cache: readonly Pokemon[] | null = null;

  constructor(private readonly filePath: string) {}

  async findBy(query: PokemonQuery): Promise<readonly Pokemon[]> {
    const pokemons = await this.loadAll();
    return pokemons.filter((pokemon) => (query.includeLegendaries ? true : !pokemon.isLegendary));
  }

  private async loadAll(): Promise<readonly Pokemon[]> {
    if (this.cache) {
      return this.cache;
    }

    const absolutePath = path.isAbsolute(this.filePath)
      ? this.filePath
      : path.join(process.cwd(), this.filePath);

    const rows = await readCsvFile(absolutePath);
    const pokemons = rows.map((row, index) => CsvPokemonMapper.toDomain(row, index));
    this.cache = pokemons;
    return pokemons;
  }
}
