export type BaseStatKey = 'hp' | 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed';

type BaseStatsRecord = Record<BaseStatKey, number>;

function validateStat(key: BaseStatKey, value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 255) {
    throw new Error(`Base stat "${key}" must be an integer between 1 and 255`);
  }
}

export class BaseStats {
  private readonly values: BaseStatsRecord;

  private constructor(values: BaseStatsRecord) {
    this.values = values;
  }

  static create(values: BaseStatsRecord): BaseStats {
    for (const key of Object.keys(values) as BaseStatKey[]) {
      validateStat(key, values[key]);
    }
    return new BaseStats({ ...values });
  }

  static zero(): BaseStats {
    return new BaseStats({
      hp: 0,
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
    });
  }

  add(other: BaseStats): BaseStats {
    const result: BaseStatsRecord = {
      hp: this.values.hp + other.values.hp,
      attack: this.values.attack + other.values.attack,
      defense: this.values.defense + other.values.defense,
      spAtk: this.values.spAtk + other.values.spAtk,
      spDef: this.values.spDef + other.values.spDef,
      speed: this.values.speed + other.values.speed,
    };
    return new BaseStats(result);
  }

  div(divisor: number): BaseStats {
    if (divisor <= 0) {
      throw new Error('Divisor must be positive');
    }
    const result: BaseStatsRecord = {
      hp: this.values.hp / divisor,
      attack: this.values.attack / divisor,
      defense: this.values.defense / divisor,
      spAtk: this.values.spAtk / divisor,
      spDef: this.values.spDef / divisor,
      speed: this.values.speed / divisor,
    };
    return new BaseStats(result);
  }

  toObject(): BaseStatsRecord {
    return { ...this.values };
  }
}
