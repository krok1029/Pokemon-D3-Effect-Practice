export function toBoolLike(
  raw?: string | number | boolean | null
): boolean | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  const s = String(raw).trim().toLowerCase();
  if (!s) return undefined;
  if (['1', 'true', 't', 'yes', 'y', 'on'].includes(s)) return true;
  if (['0', 'false', 'f', 'no', 'n', 'off'].includes(s)) return false;
  return undefined;
}

