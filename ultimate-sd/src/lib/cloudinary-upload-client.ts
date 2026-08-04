import { getCloudinaryUploadSignature } from '@/app/actions/blog';

export async function uploadImageToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const { timestamp, signature, apiKey, cloudName, folder } = await getCloudinaryUploadSignature();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Image upload failed');
  }

  const data = (await response.json()) as { public_id: string; format: string };
  return {
    url: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${data.public_id}.${data.format}`,
    publicId: data.public_id,
  };
}
