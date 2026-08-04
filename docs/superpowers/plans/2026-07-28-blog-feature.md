# Admin-authored Blog Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let ADMIN users author, publish, and manage rich blog posts (Medium-like formatting, images, view-only Excalidraw diagrams) that are publicly readable, SEO-indexable, searchable, and commentable by logged-in users.

**Architecture:** New `BlogPost`/`BlogComment` Prisma models, admin-only Next.js Server Actions for all writes, a Tiptap-based WYSIWYG editor (with two custom nodes: image and view-only Excalidraw embed) whose JSON output is stored in `BlogPost.content` and rendered back with the same extension set in read-only mode. Reading is fully public (no auth) for SEO; writing is gated by the existing `role === 'ADMIN'` pattern; commenting requires a session.

**Tech Stack:** Next.js 16 App Router, Prisma 7 / PostgreSQL, NextAuth v5, Tiptap 3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`), Cloudinary (signed direct browser upload, no SDK — signature computed with Node's `crypto`), existing `@excalidraw/excalidraw` package, shadcn/radix UI components, Vitest.

## Global Constraints

- Follow the spec at `docs/superpowers/specs/2026-07-28-blog-feature-design.md`.
- Prisma conventions: `id String @id @default(cuid())`, `createdAt`/`updatedAt` naming, plain-`String` status fields with a comment documenting allowed values (not Prisma enums) — matches `User.role`.
- Do not modify `src/lib/blog.ts` (unrelated Guides content-block model) or anything under `src/app/guides`.
- All new admin-only mutations must call the shared `requireAdmin()` guard — never inline a separate role check.
- Reading `/blog` and `/blog/[slug]` for published posts must work with **no** authentication (SEO requirement).
- `isPremium` is stored and admin-toggleable but **must not** be read by any access-check/gating code in this plan (explicitly deferred).
- No categorization/tags, no threaded comment replies, no full-text search, no diagram PNG fallback, no image captions — do not build these.
- Package manager is `pnpm` (see `packageManager` in `package.json`) — use `pnpm add` / `pnpm add -D`.

---

### Task 1: Extract shared `requireAdmin()` guard

**Files:**
- Create: `src/lib/require-admin.ts`
- Modify: `src/app/actions/admin.ts:1-35`
- Test: `src/lib/__tests__/require-admin.test.ts`

**Interfaces:**
- Produces: `export async function requireAdmin(): Promise<string>` — returns the admin's user id, throws `Error('Not authenticated')` or `Error('Not authorized')` otherwise. Every later task that needs admin-only mutations imports this from `@/lib/require-admin`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/require-admin.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}));

import { requireAdmin } from '../require-admin';

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws Not authenticated when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('Not authenticated');
  });

  it('throws Not authorized when the user is not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({ role: 'USER' });
    await expect(requireAdmin()).rejects.toThrow('Not authorized');
  });

  it('returns the user id when the user is an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique.mockResolvedValue({ role: 'ADMIN' });
    await expect(requireAdmin()).resolves.toBe('admin-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/require-admin.test.ts`
Expected: FAIL — `Cannot find module '../require-admin'`

- [ ] **Step 3: Create the shared guard**

```ts
// src/lib/require-admin.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  return session.user.id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/require-admin.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Update `admin.ts` to use the shared guard**

In `src/app/actions/admin.ts`, delete the local `requireAdmin` function (lines 19-35) and add the import:

```ts
import { requireAdmin } from '@/lib/require-admin';
```

- [ ] **Step 6: Run the existing admin action tests to confirm nothing broke**

Run: `pnpm test src/app/actions/__tests__/admin.test.ts`
Expected: PASS (5 tests, unchanged)

- [ ] **Step 7: Commit**

```bash
git add src/lib/require-admin.ts src/lib/__tests__/require-admin.test.ts src/app/actions/admin.ts
git commit -m "refactor: extract shared requireAdmin guard for reuse by blog actions"
```

---

### Task 2: Prisma schema — `BlogPost` and `BlogComment`

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `prisma migrate dev`

**Interfaces:**
- Produces: Prisma models `BlogPost` and `BlogComment`, and `PrismaClient.blogPost` / `PrismaClient.blogComment` delegates used by every later task.

- [ ] **Step 1: Add relations to `User`**

In `prisma/schema.prisma`, inside `model User { ... }`, add to the Relations block (after `interviewDebriefs InterviewDebrief[]` at line 81):

```prisma
  blogPosts               BlogPost[]
  blogComments            BlogComment[]
```

- [ ] **Step 2: Add the new models**

Append to the end of `prisma/schema.prisma`:

```prisma
model BlogPost {
  id             String    @id @default(cuid())
  slug           String    @unique
  title          String
  excerpt        String?
  coverImage     String?
  content        Json // Tiptap JSON document
  status         String    @default("DRAFT") // "DRAFT" | "PUBLISHED"
  isPremium      Boolean   @default(false) // reserved; unenforced for now
  readingTime    Int?
  seoTitle       String?
  seoDescription String?
  authorId       String
  publishedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  author   User          @relation(fields: [authorId], references: [id])
  comments BlogComment[]

  @@index([status, publishedAt])
}

model BlogComment {
  id         String   @id @default(cuid())
  content    String
  authorId   String
  blogPostId String
  createdAt  DateTime @default(now())

  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  blogPost BlogPost @relation(fields: [blogPostId], references: [id], onDelete: Cascade)

  @@index([blogPostId, createdAt])
}
```

- [ ] **Step 3: Generate and apply the migration**

Run: `npx prisma migrate dev --name add_blog_feature`
Expected: A new folder under `prisma/migrations/` is created and applied without errors; Prisma Client is regenerated.

- [ ] **Step 4: Verify the client compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add BlogPost and BlogComment Prisma models"
```

---

### Task 3: Blog domain lib — types, slugify, reading time, read queries

**Files:**
- Create: `src/lib/blog-posts.ts`
- Test: `src/lib/__tests__/blog-posts.test.ts`

**Interfaces:**
- Consumes: `prisma.blogPost` (Task 2).
- Produces (used by every later reading/writing task):
  - `export type BlogPostStatus = string` (documented as `"DRAFT" | "PUBLISHED"`)
  - `export type BlogPostSummary = { id, slug, title, excerpt, coverImage, status, isPremium, readingTime, publishedAt, updatedAt }`
  - `export type BlogPostDetail = BlogPostSummary & { content, seoTitle, seoDescription, authorId, authorName, createdAt }`
  - `export function slugify(title: string): string`
  - `export function estimateReadingTime(content: unknown): number`
  - `export async function getPublishedBlogPosts(searchQuery?: string): Promise<BlogPostSummary[]>`
  - `export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null>`
  - `export async function getBlogPostById(id: string): Promise<BlogPostDetail | null>`
  - `export async function getAllBlogPostsForAdmin(): Promise<BlogPostSummary[]>`

- [ ] **Step 1: Write the failing tests for the pure functions**

```ts
// src/lib/__tests__/blog-posts.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, estimateReadingTime } from '../blog-posts';

describe('slugify', () => {
  it('lowercases, strips punctuation, and hyphenates', () => {
    expect(slugify('Designing TinyURL: A Deep Dive!')).toBe('designing-tinyurl-a-deep-dive');
  });

  it('collapses repeated whitespace and hyphens', () => {
    expect(slugify('  Load   Balancing -- 101  ')).toBe('load-balancing-101');
  });
});

describe('estimateReadingTime', () => {
  it('returns 1 for empty content', () => {
    expect(estimateReadingTime(null)).toBe(1);
    expect(estimateReadingTime({ type: 'doc', content: [] })).toBe(1);
  });

  it('counts words across nested text nodes and divides by 200wpm', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ');
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: words }] },
      ],
    };
    expect(estimateReadingTime(doc)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/blog-posts.test.ts`
Expected: FAIL — `Cannot find module '../blog-posts'`

- [ ] **Step 3: Implement the lib**

```ts
// src/lib/blog-posts.ts
import { prisma } from '@/lib/prisma';

/** "DRAFT" | "PUBLISHED" */
export type BlogPostStatus = string;

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: BlogPostStatus;
  isPremium: boolean;
  readingTime: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type BlogPostDetail = BlogPostSummary & {
  content: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  authorName: string | null;
  createdAt: Date;
};

const summarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  status: true,
  isPremium: true,
  readingTime: true,
  publishedAt: true,
  updatedAt: true,
} as const;

const detailSelect = {
  ...summarySelect,
  content: true,
  seoTitle: true,
  seoDescription: true,
  authorId: true,
  createdAt: true,
  author: { select: { name: true } },
} as const;

type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  isPremium: boolean;
  readingTime: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

type DetailRow = SummaryRow & {
  content: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  createdAt: Date;
  author: { name: string | null } | null;
};

function toSummary(row: SummaryRow): BlogPostSummary {
  return { ...row, status: row.status as BlogPostStatus };
}

function toDetail(row: DetailRow): BlogPostDetail {
  const { author, ...rest } = row;
  return { ...toSummary(rest), ...rest, authorName: author?.name ?? null };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type TiptapNode = { text?: string; content?: TiptapNode[] };

function extractText(node: TiptapNode): string {
  const own = node.text ?? '';
  const children = node.content?.map(extractText).join(' ') ?? '';
  return `${own} ${children}`;
}

export function estimateReadingTime(content: unknown): number {
  if (!content || typeof content !== 'object') return 1;
  const text = extractText(content as TiptapNode);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 1;
  return Math.max(1, Math.round(wordCount / 200));
}

export async function getPublishedBlogPosts(searchQuery?: string): Promise<BlogPostSummary[]> {
  const trimmed = searchQuery?.trim();
  const rows = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      ...(trimmed
        ? {
            OR: [
              { title: { contains: trimmed, mode: 'insensitive' as const } },
              { excerpt: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: 'desc' },
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const row = await prisma.blogPost.findUnique({ where: { slug }, select: detailSelect });
  return row ? toDetail(row) : null;
}

export async function getBlogPostById(id: string): Promise<BlogPostDetail | null> {
  const row = await prisma.blogPost.findUnique({ where: { id }, select: detailSelect });
  return row ? toDetail(row) : null;
}

export async function getAllBlogPostsForAdmin(): Promise<BlogPostSummary[]> {
  const rows = await prisma.blogPost.findMany({
    orderBy: { updatedAt: 'desc' },
    select: summarySelect,
  });
  return rows.map(toSummary);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/blog-posts.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog-posts.ts src/lib/__tests__/blog-posts.test.ts
git commit -m "feat: add blog post domain types, slugify, reading time, and read queries"
```

---

### Task 4: Cloudinary signed-upload helper

**Files:**
- Create: `src/lib/cloudinary.ts`
- Test: `src/lib/__tests__/cloudinary.test.ts`

**Interfaces:**
- Produces: `export function buildCloudinaryUploadSignature(paramsToSign: Record<string, string | number>): string` — used by Task 6's `getCloudinaryUploadSignature` server action.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cloudinary.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/cloudinary.test.ts`
Expected: FAIL — `Cannot find module '../cloudinary'`

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/cloudinary.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/cloudinary.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cloudinary.ts src/lib/__tests__/cloudinary.test.ts
git commit -m "feat: add Cloudinary signed-upload signature helper"
```

---

### Task 5: Add Cloudinary env vars to env check script

**Files:**
- Modify: `scripts/check-env.ts:1-20`

**Interfaces:** None (script-only change).

- [ ] **Step 1: Add a Cloudinary env var group**

In `scripts/check-env.ts`, after the `emailEnvVars` array (line ~20), add:

```ts
const cloudinaryEnvVars = [
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
];
```

Then, inside `main()`, alongside the existing `missingEmail` check, add:

```ts
    const missingCloudinary = cloudinaryEnvVars.filter(key => !loadedEnv[key]);
```

and after the `missingEmail` warning block:

```ts
    if (missingCloudinary.length > 0) {
        console.warn('⚠️  Cloudinary env vars missing (blog image uploads disabled until set):');
        missingCloudinary.forEach(key => console.warn(`   - ${key}`));
    }
```

- [ ] **Step 2: Verify the script still runs**

Run: `npx tsx scripts/check-env.ts`
Expected: Runs without throwing (warnings about missing Cloudinary/payment/email vars are expected in a local dev environment without those keys set).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-env.ts
git commit -m "chore: warn on missing Cloudinary env vars in check-env script"
```

---

### Task 6: Blog post server actions (create/update/publish/delete/upload signature)

**Files:**
- Create: `src/app/actions/blog.ts`
- Test: `src/app/actions/__tests__/blog.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 1), `slugify` (Task 3), `buildCloudinaryUploadSignature` (Task 4).
- Produces:
  - `export type BlogPostUpdateInput = { title: string; excerpt: string; coverImage: string | null; content: unknown; isPremium: boolean; seoTitle: string; seoDescription: string }`
  - `export async function createBlogPost(title: string): Promise<{ id: string; slug: string }>`
  - `export async function updateBlogPost(id: string, input: BlogPostUpdateInput): Promise<{ success: true } | { error: string }>`
  - `export async function publishBlogPost(id: string): Promise<{ success: true } | { error: string }>`
  - `export async function deleteBlogPost(id: string): Promise<{ success: true } | { error: string }>`
  - `export async function getCloudinaryUploadSignature(): Promise<{ timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string }>`

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/actions/__tests__/blog.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/actions/__tests__/blog.test.ts`
Expected: FAIL — `Cannot find module '../blog'`

- [ ] **Step 3: Implement the actions**

```ts
// src/app/actions/blog.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/app/actions/__tests__/blog.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/blog.ts src/app/actions/__tests__/blog.test.ts
git commit -m "feat: add admin blog post server actions"
```

---

### Task 7: Blog comment queries and server actions

**Files:**
- Create: `src/lib/blog-comments.ts`
- Create: `src/app/actions/blog-comments.ts`
- Test: `src/app/actions/__tests__/blog-comments.test.ts`

**Interfaces:**
- Consumes: `prisma.blogComment` (Task 2), `auth` (`@/auth`), `requireAdmin` (Task 1).
- Produces:
  - `export type BlogCommentItem = { id: string; content: string; authorId: string; authorName: string | null; authorImage: string | null; createdAt: Date }`
  - `export async function getCommentsForPost(blogPostId: string): Promise<BlogCommentItem[]>`
  - `export async function addComment(blogPostId: string, content: string): Promise<{ success: true; comment: BlogCommentItem } | { error: string }>`
  - `export async function deleteComment(commentId: string): Promise<{ success: true } | { error: string }>`

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/actions/__tests__/blog-comments.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    blogComment: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: vi.fn(),
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
    expect(mockRevalidatePath).toHaveBeenCalled();
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

  it('rejects a non-author, non-admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } });
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', blogPost: { slug: 'my-post' } });

    const result = await deleteComment('comment-1');
    expect(result).toEqual({ error: 'Not authorized' });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/actions/__tests__/blog-comments.test.ts`
Expected: FAIL — `Cannot find module '../blog-comments'`

- [ ] **Step 3: Implement the query lib**

```ts
// src/lib/blog-comments.ts
import { prisma } from '@/lib/prisma';

export type BlogCommentItem = {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
};

export async function getCommentsForPost(blogPostId: string): Promise<BlogCommentItem[]> {
  const rows = await prisma.blogComment.findMany({
    where: { blogPostId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    authorImage: row.author?.image ?? null,
    createdAt: row.createdAt,
  }));
}
```

- [ ] **Step 4: Implement the mutation actions**

```ts
// src/app/actions/blog-comments.ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { BlogCommentItem } from '@/lib/blog-comments';

export async function addComment(
  blogPostId: string,
  content: string
): Promise<{ success: true; comment: BlogCommentItem } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: 'Comment cannot be empty' };
  }

  const created = await prisma.blogComment.create({
    data: { blogPostId, authorId: session.user.id, content: trimmed },
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
      blogPost: { select: { slug: true } },
    },
  });

  revalidatePath(`/blog/${created.blogPost.slug}`);

  return {
    success: true,
    comment: {
      id: created.id,
      content: created.content,
      authorId: created.authorId,
      authorName: created.author?.name ?? null,
      authorImage: created.author?.image ?? null,
      createdAt: created.createdAt,
    },
  };
}

export async function deleteComment(commentId: string): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const comment = await prisma.blogComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, blogPost: { select: { slug: true } } },
  });
  if (!comment) {
    return { error: 'Comment not found' };
  }

  let isAdmin = false;
  if (comment.authorId !== session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    isAdmin = user?.role === 'ADMIN';
  }

  if (comment.authorId !== session.user.id && !isAdmin) {
    return { error: 'Not authorized' };
  }

  await prisma.blogComment.delete({ where: { id: commentId } });
  revalidatePath(`/blog/${comment.blogPost.slug}`);
  return { success: true };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/app/actions/__tests__/blog-comments.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/blog-comments.ts src/app/actions/blog-comments.ts src/app/actions/__tests__/blog-comments.test.ts
git commit -m "feat: add blog comment queries and server actions"
```

---

### Task 8: Install Tiptap and build the shared extension set

**Files:**
- Modify: `package.json` (via `pnpm add`)
- Create: `src/components/blog-editor/blog-image-node.ts`
- Create: `src/components/blog-editor/extensions.ts`

**Interfaces:**
- Produces:
  - `export const BlogImage` (Tiptap node extension requiring `alt`)
  - `export const blogEditorExtensions: AnyExtension[]` — consumed by Task 11 (`BlogEditor`) and Task 12 (`BlogContentRenderer`). The Excalidraw node is added to this array in Task 9.

- [ ] **Step 1: Install dependencies**

Run: `pnpm add @tiptap/react @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link`
Expected: Installed into `dependencies` in `package.json` and `pnpm-lock.yaml` updated.

- [ ] **Step 2: Create the custom image node**

```ts
// src/components/blog-editor/blog-image-node.ts
import Image from '@tiptap/extension-image';

export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: '',
        renderHTML: (attributes: { alt?: string }) => ({ alt: attributes.alt || '' }),
      },
    };
  },
});
```

- [ ] **Step 3: Create the shared extension set**

```ts
// src/components/blog-editor/extensions.ts
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { BlogImage } from './blog-image-node';

export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({ openOnClick: false, autolink: true }),
  BlogImage,
];
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/blog-editor/blog-image-node.ts src/components/blog-editor/extensions.ts
git commit -m "feat: install Tiptap and add shared blog editor extensions"
```

---

### Task 9: Excalidraw embed Tiptap node (view-only rendering, editable creation modal)

**Files:**
- Create: `src/components/blog-editor/ExcalidrawEmbedModal.tsx`
- Create: `src/components/blog-editor/ExcalidrawEmbedNodeView.tsx`
- Create: `src/components/blog-editor/excalidraw-node.ts`
- Modify: `src/components/blog-editor/extensions.ts`

**Interfaces:**
- Consumes: `ExcalidrawScene` (`@/types/diagram`), `@excalidraw/excalidraw` (existing dependency), shadcn `Dialog`/`Button`.
- Produces: `export const ExcalidrawEmbed` (Tiptap node with attribute `scene: ExcalidrawScene | null`), added to `blogEditorExtensions`.

- [ ] **Step 1: Build the creation/edit modal**

```tsx
// src/components/blog-editor/ExcalidrawEmbedModal.tsx
'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ExcalidrawScene } from '@/types/diagram';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface ExcalidrawEmbedModalProps {
  open: boolean;
  initialScene: ExcalidrawScene | null;
  onOpenChange: (open: boolean) => void;
  onSave: (scene: ExcalidrawScene) => void;
}

export function ExcalidrawEmbedModal({
  open,
  initialScene,
  onOpenChange,
  onSave,
}: ExcalidrawEmbedModalProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const handleSave = () => {
    const api = apiRef.current;
    if (!api) return;
    onSave({
      type: 'excalidraw',
      version: 2,
      elements: api.getSceneElements(),
      appState: api.getAppState(),
      files: api.getFiles(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Diagram</DialogTitle>
        </DialogHeader>
        <div className="h-[500px] w-full overflow-hidden rounded-lg border">
          {open && (
            <Excalidraw
              excalidrawAPI={(api) => {
                apiRef.current = api;
              }}
              initialData={
                initialScene
                  ? {
                      elements: initialScene.elements,
                      appState: initialScene.appState,
                      files: initialScene.files,
                    }
                  : undefined
              }
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save diagram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Build the node view (editable placeholder + read-only render)**

```tsx
// src/components/blog-editor/ExcalidrawEmbedNodeView.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { PencilRuler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawEmbedModal } from './ExcalidrawEmbedModal';
import type { ExcalidrawScene } from '@/types/diagram';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

function ReadOnlyScene({ scene }: { scene: ExcalidrawScene }) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border">
      <Excalidraw
        initialData={{
          elements: scene.elements,
          appState: { ...scene.appState, viewModeEnabled: true },
          files: scene.files,
        }}
        viewModeEnabled
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
}

export function ExcalidrawEmbedNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scene = node.attrs.scene as ExcalidrawScene | null;

  if (!editor.isEditable) {
    return <NodeViewWrapper data-type="excalidraw-embed">{scene && <ReadOnlyScene scene={scene} />}</NodeViewWrapper>;
  }

  return (
    <NodeViewWrapper data-type="excalidraw-embed">
      <div className="my-4 rounded-xl border border-dashed p-4" contentEditable={false}>
        {scene ? (
          <div className="pointer-events-none h-[300px] w-full overflow-hidden rounded-lg border">
            <ReadOnlyScene scene={scene} />
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">No diagram yet.</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setIsModalOpen(true)}
        >
          <PencilRuler className="mr-2 h-4 w-4" />
          {scene ? 'Edit diagram' : 'Create diagram'}
        </Button>
      </div>
      <ExcalidrawEmbedModal
        open={isModalOpen}
        initialScene={scene}
        onOpenChange={setIsModalOpen}
        onSave={(newScene) => {
          updateAttributes({ scene: newScene });
          setIsModalOpen(false);
        }}
      />
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 3: Define the Tiptap node**

```ts
// src/components/blog-editor/excalidraw-node.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ExcalidrawEmbedNodeView } from './ExcalidrawEmbedNodeView';

export const ExcalidrawEmbed = Node.create({
  name: 'excalidrawEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      scene: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="excalidraw-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawEmbedNodeView);
  },
});
```

- [ ] **Step 4: Register the node in the shared extension set**

In `src/components/blog-editor/extensions.ts`, add the import and array entry:

```ts
import { ExcalidrawEmbed } from './excalidraw-node';
```

```ts
export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({ openOnClick: false, autolink: true }),
  BlogImage,
  ExcalidrawEmbed,
];
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/blog-editor/ExcalidrawEmbedModal.tsx src/components/blog-editor/ExcalidrawEmbedNodeView.tsx src/components/blog-editor/excalidraw-node.ts src/components/blog-editor/extensions.ts
git commit -m "feat: add view-only Excalidraw embed node for the blog editor"
```

---

### Task 10: Client-side Cloudinary upload helper

**Files:**
- Create: `src/lib/cloudinary-upload-client.ts`
- Test: `src/lib/__tests__/cloudinary-upload-client.test.ts`

**Interfaces:**
- Consumes: `getCloudinaryUploadSignature` (Task 6, `@/app/actions/blog`).
- Produces: `export async function uploadImageToCloudinary(file: File): Promise<{ url: string; publicId: string }>` — consumed by Task 11's image toolbar button.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/cloudinary-upload-client.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/cloudinary-upload-client.test.ts`
Expected: FAIL — `Cannot find module '../cloudinary-upload-client'`

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/cloudinary-upload-client.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/cloudinary-upload-client.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cloudinary-upload-client.ts src/lib/__tests__/cloudinary-upload-client.test.ts
git commit -m "feat: add client-side Cloudinary signed upload helper"
```

---

### Task 11: `BlogEditor` component (toolbar + Tiptap instance)

**Files:**
- Create: `src/components/blog-editor/BlogEditor.tsx`

**Interfaces:**
- Consumes: `blogEditorExtensions` (Task 9), `uploadImageToCloudinary` (Task 10).
- Produces: `export type BlogEditorHandle = { getJSON(): unknown }`, `export const BlogEditor = forwardRef<BlogEditorHandle, { initialContent: unknown }>(...)` — consumed by Task 13's `BlogPostForm`.

- [ ] **Step 1: Implement the editor with toolbar**

```tsx
// src/components/blog-editor/BlogEditor.tsx
'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  PencilRuler,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { blogEditorExtensions } from './extensions';
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload-client';

export type BlogEditorHandle = {
  getJSON: () => unknown;
};

interface BlogEditorProps {
  initialContent: unknown;
}

export const BlogEditor = forwardRef<BlogEditorHandle, BlogEditorProps>(function BlogEditor(
  { initialContent },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: blogEditorExtensions,
    content: initialContent ?? { type: 'doc', content: [] },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    getJSON: () => editor?.getJSON() ?? { type: 'doc', content: [] },
  }));

  if (!editor) return null;

  const insertImage = async (file: File) => {
    try {
      const alt = window.prompt('Describe this image for accessibility (alt text):', '') ?? '';
      const { url } = await uploadImageToCloudinary(file);
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch {
      toast.error('Image upload failed. Please try again.');
    }
  };

  return (
    <div className="rounded-lg border">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await insertImage(file);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().insertContent({ type: 'excalidrawEmbed', attrs: { scene: null } }).run()}
        >
          <PencilRuler className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="prose prose-zinc max-w-none px-4 py-3 dark:prose-invert" />
    </div>
  );
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog-editor/BlogEditor.tsx
git commit -m "feat: add BlogEditor Tiptap component with formatting, image, and diagram toolbar"
```

---

### Task 12: `BlogContentRenderer` (read-only render)

**Files:**
- Create: `src/components/blog/BlogContentRenderer.tsx`

**Interfaces:**
- Consumes: `blogEditorExtensions` (Task 9).
- Produces: `export function BlogContentRenderer({ content }: { content: unknown })` — consumed by Task 15 (`/blog/[slug]` page).

- [ ] **Step 1: Implement the renderer**

```tsx
// src/components/blog/BlogContentRenderer.tsx
'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { blogEditorExtensions } from '@/components/blog-editor/extensions';

export function BlogContentRenderer({ content }: { content: unknown }) {
  const editor = useEditor({
    extensions: blogEditorExtensions,
    content: content ?? { type: 'doc', content: [] },
    editable: false,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} className="prose prose-zinc max-w-none dark:prose-invert" />;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogContentRenderer.tsx
git commit -m "feat: add read-only blog content renderer"
```

---

### Task 13: Admin blog list page

**Files:**
- Create: `src/app/admin/blog/page.tsx`
- Create: `src/app/admin/blog/BlogAdminList.tsx`

**Interfaces:**
- Consumes: `getAllBlogPostsForAdmin` (Task 3), `deleteBlogPost` (Task 6).
- Produces: page at `/admin/blog`, linked from Task 19 (nothing later depends on exports from this task).

- [ ] **Step 1: Implement the guarded server page**

```tsx
// src/app/admin/blog/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllBlogPostsForAdmin } from '@/lib/blog-posts';
import { Button } from '@/components/ui/button';
import { BlogAdminList } from './BlogAdminList';

export default async function AdminBlogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') redirect('/');

  const posts = await getAllBlogPostsForAdmin();

  return (
    <div className="container mx-auto px-4 py-10 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">New post</Link>
        </Button>
      </div>
      <BlogAdminList posts={posts} />
    </div>
  );
}
```

- [ ] **Step 2: Implement the list + delete client component**

```tsx
// src/app/admin/blog/BlogAdminList.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteBlogPost } from '@/app/actions/blog';
import type { BlogPostSummary } from '@/lib/blog-posts';

export function BlogAdminList({ posts }: { posts: BlogPostSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteBlogPost(id);
      router.refresh();
    });
  };

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No blog posts yet.</p>;
  }

  return (
    <div className="divide-y rounded-lg border">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'outline'}>{post.status}</Badge>
              {post.isPremium && <Badge variant="outline">Premium</Badge>}
            </div>
            <p className="truncate font-medium">{post.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending && pendingId === post.id}
              onClick={() => handleDelete(post.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/blog/page.tsx src/app/admin/blog/BlogAdminList.tsx
git commit -m "feat: add admin blog post list page"
```

---

### Task 14: Admin blog create + edit pages

**Files:**
- Create: `src/app/admin/blog/new/page.tsx`
- Create: `src/app/admin/blog/new/NewBlogPostForm.tsx`
- Create: `src/app/admin/blog/[id]/edit/page.tsx`
- Create: `src/app/admin/blog/[id]/edit/BlogPostForm.tsx`

**Interfaces:**
- Consumes: `createBlogPost`, `updateBlogPost`, `publishBlogPost` (Task 6), `getBlogPostById` (Task 3), `BlogEditor`/`BlogEditorHandle` (Task 11), `uploadImageToCloudinary` (Task 10).

- [ ] **Step 1: New-post page and form**

```tsx
// src/app/admin/blog/new/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NewBlogPostForm } from './NewBlogPostForm';

export default async function NewBlogPostPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') redirect('/');

  return (
    <div className="container mx-auto max-w-xl px-4 py-10 md:px-0">
      <h1 className="mb-6 text-3xl font-bold">New blog post</h1>
      <NewBlogPostForm />
    </div>
  );
}
```

```tsx
// src/app/admin/blog/new/NewBlogPostForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createBlogPost } from '@/app/actions/blog';

export function NewBlogPostForm() {
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        const { id } = await createBlogPost(title.trim());
        router.push(`/admin/blog/${id}/edit`);
      } catch {
        toast.error('Failed to create draft');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Button type="submit" disabled={isPending || !title.trim()}>
        {isPending ? 'Creating…' : 'Create draft'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Edit page**

```tsx
// src/app/admin/blog/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBlogPostById } from '@/lib/blog-posts';
import { BlogPostForm } from './BlogPostForm';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') redirect('/');

  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:px-0">
      <BlogPostForm post={post} />
    </div>
  );
}
```

- [ ] **Step 3: Edit form (title/excerpt/cover/SEO/premium + editor + save/publish)**

```tsx
// src/app/admin/blog/[id]/edit/BlogPostForm.tsx
'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BlogEditor, type BlogEditorHandle } from '@/components/blog-editor/BlogEditor';
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload-client';
import { updateBlogPost, publishBlogPost } from '@/app/actions/blog';
import type { BlogPostDetail } from '@/lib/blog-posts';

export function BlogPostForm({ post }: { post: BlogPostDetail }) {
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(post.coverImage);
  const [isPremium, setIsPremium] = useState(post.isPremium);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(post.seoDescription ?? '');
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  const buildInput = () => ({
    title,
    excerpt,
    coverImage,
    content: editorRef.current?.getJSON() ?? post.content,
    isPremium,
    seoTitle,
    seoDescription,
  });

  const handleSaveDraft = () => {
    startSaving(async () => {
      const result = await updateBlogPost(post.id, buildInput());
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Draft saved');
        router.refresh();
      }
    });
  };

  const handlePublish = () => {
    startPublishing(async () => {
      const saveResult = await updateBlogPost(post.id, buildInput());
      if ('error' in saveResult) {
        toast.error(saveResult.error);
        return;
      }
      const publishResult = await publishBlogPost(post.id);
      if ('error' in publishResult) {
        toast.error(publishResult.error);
        return;
      }
      toast.success('Published');
      router.refresh();
    });
  };

  const handleCoverUpload = async (file: File) => {
    try {
      const { url } = await uploadImageToCloudinary(file);
      setCoverImage(url);
    } catch {
      toast.error('Cover image upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'outline'}>{post.status}</Badge>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isSaving} onClick={handleSaveDraft}>
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button disabled={isPublishing} onClick={handlePublish}>
            {isPublishing ? 'Publishing…' : post.status === 'PUBLISHED' ? 'Save & update' : 'Publish'}
          </Button>
        </div>
      </div>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="text-xl font-semibold" />
      <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short excerpt for the listing card" />

      <div className="flex items-center gap-3">
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleCoverUpload(file);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
          {coverImage ? 'Replace cover image' : 'Upload cover image'}
        </Button>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="Cover preview" className="h-12 w-20 rounded object-cover" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isPremium} onCheckedChange={setIsPremium} id="is-premium" />
        <label htmlFor="is-premium" className="text-sm text-muted-foreground">
          Mark as premium (not yet enforced)
        </label>
      </div>

      <BlogEditor ref={editorRef} initialContent={post.content} />

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">SEO</p>
        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO title" />
        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO description" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/blog/new src/app/admin/blog/[id]
git commit -m "feat: add admin blog post create and edit pages"
```

---

### Task 15: Public blog index page with search

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/components/blog/BlogSearchInput.tsx`

**Interfaces:**
- Consumes: `getPublishedBlogPosts` (Task 3).

- [ ] **Step 1: Search input**

```tsx
// src/components/blog/BlogSearchInput.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function BlogSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`${pathname}?${params.toString()}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative max-w-md">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search blog posts..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
```

- [ ] **Step 2: Index page**

```tsx
// src/app/blog/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/blog-posts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { BlogSearchInput } from '@/components/blog/BlogSearchInput';

const PAGE_TITLE = 'Blog';
const PAGE_DESCRIPTION =
  'Concept explainers and system design interview walkthroughs, written by the Ultimate SD team.';

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const posts = await getPublishedBlogPosts(q);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:py-20">
      <header className="mb-10 max-w-2xl">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">Blog</h1>
        <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{PAGE_DESCRIPTION}</p>
        <BlogSearchInput />
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {post.isPremium && (
                <Badge className="mb-3 w-fit border-0 bg-primary/10 text-primary">Premium</Badge>
              )}
              <h2 className="mb-2 text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {post.readingTime ?? 1} min read
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/blog/page.tsx src/components/blog/BlogSearchInput.tsx
git commit -m "feat: add public blog index page with search"
```

---

### Task 16: Comment section UI

**Files:**
- Create: `src/components/blog/CommentSection.tsx`

**Interfaces:**
- Consumes: `getCommentsForPost` (Task 7), `addComment`/`deleteComment` (Task 7).
- Produces: `export async function CommentSection({ blogPostId }: { blogPostId: string })` (server component) — consumed by Task 17.

- [ ] **Step 1: Implement the section**

```tsx
// src/components/blog/CommentSection.tsx
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCommentsForPost } from '@/lib/blog-comments';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';

export async function CommentSection({ blogPostId }: { blogPostId: string }) {
  const [session, comments] = await Promise.all([auth(), getCommentsForPost(blogPostId)]);

  let isAdmin = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    isAdmin = user?.role === 'ADMIN';
  }

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Comments ({comments.length})</h2>
      {session?.user?.id ? (
        <CommentForm blogPostId={blogPostId} />
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{' '}
          to leave a comment.
        </p>
      )}
      <CommentList comments={comments} currentUserId={session?.user?.id ?? null} isAdmin={isAdmin} />
    </section>
  );
}
```

- [ ] **Step 2: Implement the comment form**

```tsx
// src/components/blog/CommentForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { addComment } from '@/app/actions/blog-comments';

export function CommentForm({ blogPostId }: { blogPostId: string }) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addComment(blogPostId, trimmed);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      setContent('');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
      />
      <Button type="submit" disabled={isPending || !content.trim()}>
        {isPending ? 'Posting…' : 'Post comment'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Implement the comment list**

```tsx
// src/components/blog/CommentList.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { deleteComment } from '@/app/actions/blog-comments';
import type { BlogCommentItem } from '@/lib/blog-comments';

interface CommentListProps {
  comments: BlogCommentItem[];
  currentUserId: string | null;
  isAdmin: boolean;
}

export function CommentList({ comments, currentUserId, isAdmin }: CommentListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    startTransition(async () => {
      await deleteComment(commentId);
      router.refresh();
    });
  };

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>;
  }

  return (
    <ul className="space-y-6">
      {comments.map((comment) => {
        const canDelete = isAdmin || comment.authorId === currentUserId;
        return (
          <li key={comment.id} className="border-b pb-6 last:border-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{comment.authorName ?? 'Anonymous'}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/CommentSection.tsx src/components/blog/CommentForm.tsx src/components/blog/CommentList.tsx
git commit -m "feat: add blog comment section UI"
```

---

### Task 17: Public blog detail page (SEO metadata, JSON-LD, draft gating)

**Files:**
- Create: `src/app/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getBlogPostBySlug` (Task 3), `BlogContentRenderer` (Task 12), `CommentSection` (Task 16).

- [ ] **Step 1: Implement the page**

```tsx
// src/app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Clock } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBlogPostBySlug } from '@/lib/blog-posts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { CommentSection } from '@/components/blog/CommentSection';

async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN';
}

async function loadVisiblePost(slug: string) {
  const post = await getBlogPostBySlug(slug);
  if (!post) return null;
  if (post.status !== 'PUBLISHED' && !(await isCurrentUserAdmin())) return null;
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadVisiblePost(slug);
  if (!post) return { title: 'Post Not Found' };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || '';
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadVisiblePost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Person', name: post.authorName ?? SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        All posts
      </Link>

      {post.status !== 'PUBLISHED' && (
        <div className="mb-8 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          This post is a draft. Only admins can see this preview.
        </div>
      )}

      <article>
        <header className="mb-10 border-b pb-8">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mb-4 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {post.readingTime ?? 1} min read
            {post.authorName && <span>· By {post.authorName}</span>}
          </div>
        </header>

        <BlogContentRenderer content={post.content} />
      </article>

      <CommentSection blogPostId={post.id} />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/blog/[slug]/page.tsx
git commit -m "feat: add public blog detail page with SEO metadata and comments"
```

---

### Task 18: Dynamic OG image for blog posts

**Files:**
- Create: `src/app/blog/[slug]/opengraph-image.tsx`

**Interfaces:** None consumed beyond `getBlogPostBySlug` (Task 3).

- [ ] **Step 1: Implement the OG image route**

Note: unlike the Guides OG image, this route reads from Postgres via Prisma, which requires the Node.js runtime — do **not** set `runtime = 'edge'`.

```tsx
// src/app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { getBlogPostBySlug } from '@/lib/blog-posts';

export const alt = 'Ultimate SD blog post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const title = post?.title ?? 'Ultimate SD Blog';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            SD
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>Ultimate SD · Blog</span>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 980,
          }}
        >
          {title}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/blog/[slug]/opengraph-image.tsx
git commit -m "feat: add dynamic OG image for blog posts"
```

---

### Task 19: Sitemap and navigation

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/lib/navigation.ts:26-42`

**Interfaces:** None (integration-only).

- [ ] **Step 1: Add published posts to the sitemap**

In `src/app/sitemap.ts`, add the import:

```ts
import { getPublishedBlogPosts } from '@/lib/blog-posts'
```

Change the function signature to async and add blog URLs:

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
```

Inside the function, after `const guideUrls = ...`, add:

```ts
    const blogPosts = await getPublishedBlogPosts()
    const blogUrls = blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))
```

And add a `/blog` index entry plus `...blogUrls` to the returned array, alongside the existing `/guides` entry:

```ts
        {
            url: `${SITE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...guideUrls,
        ...blogUrls,
        ...problemUrls,
```

- [ ] **Step 2: Add the Blog link to navigation**

In `src/lib/navigation.ts`, add the `Newspaper` icon import:

```ts
import { BookOpen, Home, Layers, Map, Newspaper, Palette, PencilRuler, Sparkles, Timer, type LucideIcon } from 'lucide-react';
```

Add a link inside the `Learn` group's `links` array (after `Guides`):

```ts
      { href: '/guides', label: 'Guides', icon: BookOpen },
      { href: '/blog', label: 'Blog', icon: Newspaper },
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/lib/navigation.ts
git commit -m "feat: include blog posts in sitemap and main navigation"
```

---

### Task 20: Full verification pass

**Files:** None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass, including the new `blog-posts`, `cloudinary`, `cloudinary-upload-client`, `blog` action, `blog-comments` action, and `require-admin` suites.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: No new errors introduced by blog files.

- [ ] **Step 4: Manual smoke test with the dev server**

Run: `pnpm dev`, then with a seeded `ADMIN` user (set `role = 'ADMIN'` on a test user row) and Cloudinary/Cloudinary-adjacent env vars set:
1. Visit `/admin/blog`, click "New post", create a draft, confirm redirect to the edit page.
2. In the editor: type a heading, a bulleted list, insert an image, insert an Excalidraw diagram (draw something, save), click "Save draft".
3. Visit `/blog/<slug>` while logged in as the admin — confirm the draft banner shows and content renders (including the read-only diagram).
4. Log out (or use an incognito window) and visit the same URL — confirm `404`.
5. Back in the admin editor, click "Publish". Revisit `/blog/<slug>` logged out — confirm it now renders publicly, with correct `<title>` and OG tags (view page source).
6. On `/blog`, confirm the post appears and that typing in the search box filters it by title/excerpt substring.
7. Log in as a non-admin user, post a comment, confirm it appears and can be deleted by its author. Confirm a different non-admin user cannot delete someone else's comment (no delete button shown), and that the admin can delete any comment.

Expected: All steps behave as described, with no console errors.

- [ ] **Step 5: Commit any fixes found during manual verification**

```bash
git add -A
git commit -m "fix: address issues found during blog feature verification"
```

(Skip this step if no fixes were needed.)
