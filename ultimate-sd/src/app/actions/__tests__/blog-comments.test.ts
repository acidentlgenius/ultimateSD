import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockRevalidatePath = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    blogComment: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));

import { addComment, deleteComment } from '../blog-comments';

describe('addComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await addComment('post-1', 'Great post!');
    expect(result).toEqual({ error: 'Not authenticated' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a comment for a logged-in user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCreate.mockResolvedValue({
      id: 'comment-1',
      content: 'Great post!',
      authorId: 'user-1',
      createdAt: new Date('2026-07-28'),
      author: { name: 'Alex', image: null },
      blogPost: { slug: 'my-post' },
    });

    const result = await addComment('post-1', 'Great post!');
    expect(result).toEqual({
      success: true,
      comment: {
        id: 'comment-1',
        content: 'Great post!',
        authorId: 'user-1',
        authorName: 'Alex',
        authorImage: null,
        createdAt: new Date('2026-07-28'),
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/blog/my-post');
  });
});

describe('deleteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteComment('comment-1');
    expect(result).toEqual({ error: 'Not authenticated' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('allows the comment author to delete their own comment', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', blogPost: { slug: 'my-post' } });
    mockDelete.mockResolvedValue({});

    const result = await deleteComment('comment-1');
    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
  });

  it('allows an admin to delete a comment they do not own', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', blogPost: { slug: 'my-post' } });
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN' });
    mockDelete.mockResolvedValue({});

    const result = await deleteComment('comment-1');
    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
  });

  it('rejects a non-author, non-admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } });
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', blogPost: { slug: 'my-post' } });
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });

    const result = await deleteComment('comment-1');
    expect(result).toEqual({ error: 'Not authorized' });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
