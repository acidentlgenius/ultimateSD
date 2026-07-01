import { describe, expect, it } from 'vitest';
import { shouldUseLocalSessionDraft } from '@/lib/session-persistence-policy';

describe('shouldUseLocalSessionDraft', () => {
  it('allows local drafts for guests', () => {
    expect(shouldUseLocalSessionDraft(false)).toBe(true);
  });

  it('skips local drafts for authenticated users', () => {
    expect(shouldUseLocalSessionDraft(true)).toBe(false);
  });
});
