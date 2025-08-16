export function toBoolLike(raw?: string | number | boolean | null): boolean | undefined {
  if (raw == null) return undefined;
  const v = String(raw).trim().toLowerCase();
  if (['true', '1', '1.0', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', '0.0', 'no', 'n'].includes(v)) return false;
  return undefined;
}

export function toBool(raw?: string | number | boolean | null): boolean | undefined {
  return toBoolLike(raw);
}
