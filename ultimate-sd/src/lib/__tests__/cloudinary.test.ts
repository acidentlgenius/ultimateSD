import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { buildCloudinaryUploadSignature } from '../cloudinary';

describe('buildCloudinaryUploadSignature', () => {
  const originalSecret = process.env.CLOUDINARY_API_SECRET;

  beforeEach(() => {
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.CLOUDINARY_API_SECRET = originalSecret;
  });

  it('produces the sha1 hash of sorted params + secret', () => {
    const params = { timestamp: 123, folder: 'blog' };
    const expected = createHash('sha1').update('folder=blog&timestamp=123test-secret').digest('hex');
    expect(buildCloudinaryUploadSignature(params)).toBe(expected);
  });

  it('throws when CLOUDINARY_API_SECRET is not set', () => {
    delete process.env.CLOUDINARY_API_SECRET;
    expect(() => buildCloudinaryUploadSignature({ timestamp: 1 })).toThrow(
      'CLOUDINARY_API_SECRET is not set'
    );
  });
});
