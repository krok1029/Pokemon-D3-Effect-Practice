import { describe, it, expect } from 'vitest';
import { toBool, toBoolLike } from '@/domain/bool';

describe('toBool & toBoolLike', () => {
  const truthy = ['true', '1', '1.0', 'yes', 'y'];
  const falsy = ['false', '0', '0.0', 'no', 'n'];

  it('parses truthy values', () => {
    for (const v of truthy) {
      expect(toBool(v)).toBe(true);
      expect(toBoolLike(v)).toBe(true);
    }
  });

  it('parses falsy values', () => {
    for (const v of falsy) {
      expect(toBool(v)).toBe(false);
      expect(toBoolLike(v)).toBe(false);
    }
  });

  it('returns undefined for others', () => {
    expect(toBool('foo')).toBeUndefined();
    expect(toBoolLike('foo')).toBeUndefined();
    expect(toBool()).toBeUndefined();
    expect(toBoolLike()).toBeUndefined();
  });
});
