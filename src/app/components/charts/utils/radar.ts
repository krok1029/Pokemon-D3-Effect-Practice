import { ok, err, type Result } from '@/core/shared/result';

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };

export const validateRadarE = (
  labels: string[],
  values: number[],
): Result<Error, { n: number }> => {
  if (labels.length === 0) {
    return err(new Error('labels is empty'));
  }
  if (labels.length !== values.length) {
    return err(new Error('labels/values length mismatch'));
  }
  return ok({ n: labels.length } as const);
};

export function anglesFor(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push((Math.PI * 2 * i) / n - Math.PI / 2);
  }
  return out;
}

export function maxFrom(values: number[], maxValue?: number): number {
  if (typeof maxValue === 'number' && Number.isFinite(maxValue)) return maxValue;
  let m = 0;
  for (const v of values) if (v > m) m = v;
  return m > 0 ? m : 1;
}

export function pointsFor(values: number[], r: number, max: number): Point[] {
  const n = values.length;
  const angs = anglesFor(n);
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = angs[i];
    const rr = (values[i] / max) * r;
    points.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  return points;
}

export function ticksFor(max: number, levels: number): number[] {
  const count = Math.max(1, Math.min(4, levels));
  const step = max / count;
  const ticks: number[] = [];
  for (let i = 1; i <= count; i++) ticks.push(Math.round(step * i));
  return ticks;
}
