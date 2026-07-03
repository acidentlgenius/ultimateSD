import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('dev@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.co.in')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
  });

  it('rejects overly long addresses', () => {
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
    expect(isValidEmail('dev@example.com')).toBe(true);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com');
  });
});
