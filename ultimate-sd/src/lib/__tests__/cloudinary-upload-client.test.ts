import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSignature = vi.fn();
vi.mock('@/app/actions/blog', () => ({
  getCloudinaryUploadSignature: () => mockGetSignature(),
}));

import { uploadImageToCloudinary } from '../cloudinary-upload-client';

describe('uploadImageToCloudinary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSignature.mockResolvedValue({
      timestamp: 123,
      signature: 'sig',
      apiKey: 'key',
      cloudName: 'demo',
      folder: 'blog',
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ public_id: 'blog/abc123', format: 'png' }),
    }) as unknown as typeof fetch;
  });

  it('signs, uploads, and returns an f_auto,q_auto delivery URL', async () => {
    const file = new File(['data'], 'diagram.png', { type: 'image/png' });
    const result = await uploadImageToCloudinary(file);

    expect(result).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/blog/abc123.png',
      publicId: 'blog/abc123',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws when the upload request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const file = new File(['data'], 'diagram.png', { type: 'image/png' });
    await expect(uploadImageToCloudinary(file)).rejects.toThrow('Image upload failed');
  });
});
