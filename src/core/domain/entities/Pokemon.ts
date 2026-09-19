import { BaseStats } from '../valueObjects/BaseStats';
import { createPokemonFormId } from '../valueObjects/PokemonFormId';

export class Pokemon {
  public readonly formId: string;

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly stats: BaseStats,
    public readonly isLegendary: boolean,
    public readonly primaryType: string,
    public readonly secondaryType: string | null,
    formId?: string,
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Pokemon id must be a positive integer');
    }
    if (!name.trim()) {
      throw new Error('Pokemon name must not be empty');
    }
    if (!primaryType.trim()) {
      throw new Error('Pokemon primary type must not be empty');
    }
    this.formId = formId ?? createPokemonFormId(name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.formId)) {
      throw new Error('Pokemon form identity must be a non-empty URL slug');
    }
  }

  get types(): readonly string[] {
    return this.secondaryType ? [this.primaryType, this.secondaryType] : [this.primaryType];
  }
}
