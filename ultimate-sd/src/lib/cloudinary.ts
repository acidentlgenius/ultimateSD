import { createHash } from 'crypto';

export function buildCloudinaryUploadSignature(paramsToSign: Record<string, string | number>): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET is not set');
  }
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');
  return createHash('sha1').update(`${sorted}${apiSecret}`).digest('hex');
}
