import { BaseStats } from '../valueObjects/BaseStats';

export class Pokemon {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly stats: BaseStats,
    public readonly isLegendary: boolean,
    public readonly primaryType: string,
    public readonly secondaryType: string | null,
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
  }

  get types(): readonly string[] {
    return this.secondaryType ? [this.primaryType, this.secondaryType] : [this.primaryType];
  }
}
