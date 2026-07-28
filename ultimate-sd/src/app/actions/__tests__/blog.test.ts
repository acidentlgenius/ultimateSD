import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequireAdmin = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFindUnique = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/lib/require-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    blogPost: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));

import { createBlogPost, updateBlogPost, publishBlogPost, deleteBlogPost } from '../blog';

describe('createBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue('admin-1');
    mockFindUnique.mockResolvedValue(null); // slug is free
  });

  it('rejects when the caller is not an admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Not authorized'));
    await expect(createBlogPost('My Post')).rejects.toThrow('Not authorized');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a draft with a unique slug derived from the title', async () => {
    mockCreate.mockResolvedValue({ id: 'post-1', slug: 'my-post' });
    const result = await createBlogPost('My Post');
    expect(result).toEqual({ id: 'post-1', slug: 'my-post' });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'My Post',
        slug: 'my-post',
        status: 'DRAFT',
        authorId: 'admin-1',
        content: { type: 'doc', content: [] },
      }),
      select: { id: true, slug: true },
    });
  });

  it('appends a numeric suffix when the slug is already taken', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'existing' }).mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ id: 'post-2', slug: 'my-post-2' });
    await createBlogPost('My Post');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'my-post-2' }) })
    );
  });
});

describe('updateBlogPost', () => {
  const input = {
    title: 'Updated',
    excerpt: 'Excerpt',
    coverImage: null,
    content: { type: 'doc', content: [] },
    isPremium: false,
    seoTitle: 'SEO title',
    seoDescription: 'SEO description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue('admin-1');
    mockUpdate.mockResolvedValue({});
  });

  it('rejects when the caller is not an admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Not authorized'));
    await expect(updateBlogPost('post-1', input)).rejects.toThrow('Not authorized');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates the post and revalidates the admin edit path', async () => {
    const result = await updateBlogPost('post-1', input);
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1' },
        data: expect.objectContaining({ title: 'Updated', readingTime: 1 }),
      })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/blog');
  });
});

describe('publishBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue('admin-1');
    mockUpdate.mockResolvedValue({ slug: 'my-post' });
  });

  it('sets status to PUBLISHED and stamps publishedAt', async () => {
    const result = await publishBlogPost('post-1');
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1' },
        data: expect.objectContaining({ status: 'PUBLISHED' }),
      })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/blog');
  });
});

describe('deleteBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue('admin-1');
    mockDelete.mockResolvedValue({});
  });

  it('deletes the post and revalidates the admin list', async () => {
    const result = await deleteBlogPost('post-1');
    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/blog');
  });
});
