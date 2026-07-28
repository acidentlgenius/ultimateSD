'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { slugify, estimateReadingTime } from '@/lib/blog-posts';
import { buildCloudinaryUploadSignature } from '@/lib/cloudinary';

export type BlogPostUpdateInput = {
  title: string;
  excerpt: string;
  coverImage: string | null;
  content: unknown;
  isPremium: boolean;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY_DOC = { type: 'doc', content: [] };

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || 'post';
  let candidate = base;
  let suffix = 1;
  while (await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createBlogPost(title: string): Promise<{ id: string; slug: string }> {
  const authorId = await requireAdmin();
  const slug = await generateUniqueSlug(title);

  return prisma.blogPost.create({
    data: {
      title,
      slug,
      status: 'DRAFT',
      authorId,
      content: EMPTY_DOC,
    },
    select: { id: true, slug: true },
  });
}

export async function updateBlogPost(
  id: string,
  input: BlogPostUpdateInput
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();

  try {
    await prisma.blogPost.update({
      where: { id },
      data: {
        title: input.title,
        excerpt: input.excerpt,
        coverImage: input.coverImage,
        content: input.content as object,
        isPremium: input.isPremium,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        readingTime: estimateReadingTime(input.content),
      },
    });

    revalidatePath('/admin/blog');
    return { success: true };
  } catch (error) {
    console.error('Failed to update blog post:', error);
    return { error: 'Failed to update blog post' };
  }
}

export async function publishBlogPost(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      select: { slug: true },
    });

    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish blog post:', error);
    return { error: 'Failed to publish blog post' };
  }
}

export async function deleteBlogPost(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();

  try {
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath('/admin/blog');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    return { error: 'Failed to delete blog post' };
  }
}

export async function getCloudinaryUploadSignature() {
  await requireAdmin();

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'blog';
  const signature = buildCloudinaryUploadSignature({ timestamp, folder });

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
    folder,
  };
}
