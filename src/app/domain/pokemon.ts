import { TYPES, type TypeName, type Multiplier } from './types';

export function parseAbilities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const tokens = raw
    .split(/[;,]/g)
    .map(s => s.trim())
    .filter(Boolean);
  const seen = new Set<string>(); // lowercase for dedupe
  const out: string[] = [];
  for (const t of tokens) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

export function multiplyAgainst(
  a: Record<TypeName, Multiplier>,
  b?: Record<TypeName, Multiplier>
): Record<TypeName, Multiplier> {
  const legal: Multiplier[] = [0, 0.25, 0.5, 1, 2, 4];
  const out = {} as Record<TypeName, Multiplier>;
  for (const t of TYPES) {
    const val = (a[t] ?? 1) * (b ? (b[t] ?? 1) : 1);
    // 確保在合法集合（CSV 有時會出 0.75 之類髒值，直接拋錯或就近取合法值都可以）
    if (!legal.includes(val as Multiplier)) {
      throw new Error(`Invalid multiplier ${val} for type ${t}`);
    }
    out[t] = val as Multiplier;
  }
  return out;
}
