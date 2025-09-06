import { describe, it, expect } from 'vitest';
import { toBoolLike } from '@/shared/bool';
describe('toBoolLike', () => {
  const truthy = ['true', '1', '1.0', 'yes', 'y'];
  const falsy = ['false', '0', '0.0', 'no', 'n'];

  it('parses truthy values', () => {
    for (const v of truthy) {
      expect(toBoolLike(v)).toBe(true);
    }
  });

  it('parses falsy values', () => {
    for (const v of falsy) {
      expect(toBoolLike(v)).toBe(false);
    }
  });

  it('returns undefined for others', () => {
    expect(toBoolLike('foo')).toBeUndefined();
    expect(toBoolLike()).toBeUndefined();
  });
});
