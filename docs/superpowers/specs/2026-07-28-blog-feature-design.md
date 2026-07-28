# Admin-authored Blog feature

## Problem

The platform has a Guides feature (`src/app/guides`, `src/content/guides/*.ts`) for free educational content, but it's fully static — each guide is a hand-written TypeScript file shipped via git/deploy. There is no way to publish new long-form content (concept explainers, system-design walkthroughs) without a code change and redeploy, no comment section anywhere in the app, and no categorized/searchable content hub in the style of hellointerview's free-resources section.

We want a new Blog feature where ADMIN users can write and publish posts directly from the app (no deploy required), readers can discuss posts via comments, content ranks in search engines, and a subset of posts can be marked premium for later gating.

## Goals

- Admin-only authoring UI for writing rich, Medium-like posts (headings, lists, images, view-only Excalidraw diagrams).
- Draft → Published workflow: drafts are admin-only and editable; published posts are public and commentable.
- Flat (non-threaded) comments, restricted to logged-in users; comment author or an admin can delete a comment.
- Basic search over published posts.
- Full SEO treatment (metadata, OG image, JSON-LD) so posts are indexable/rankable, matching the existing Guides pattern.
- A reserved `isPremium` flag on posts for future paywall enforcement — not enforced in this iteration.

## Non-goals (explicitly deferred)

- Categorization / tagging — revisit once there's enough post volume.
- Threaded comment replies — flat list only for v1.
- Premium enforcement / paywall UI — the field exists but every post remains fully viewable regardless of its value.
- Full-text search (Postgres `tsvector`) — a simple `contains`/ILIKE match on title + excerpt is sufficient for v1.
- Diagram PNG fallback / dual-format rendering — diagrams render as a live Excalidraw scene only.
- Image captions.

## Naming note

`src/lib/blog.ts` already exists and holds an unrelated content-block model (`ArticleMetadata`, `BlockType`) consumed only by Guides. It is untouched by this feature. All new code uses distinct names: `src/lib/blog-posts.ts`, `src/app/blog/*`, Prisma models `BlogPost`/`BlogComment`.

## Data model

Added to `prisma/schema.prisma`, following existing conventions (cuid ids, plain-string status fields rather than enums — matching `User.role` — and cascading deletes for user-owned rows):

```prisma
model BlogPost {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  excerpt        String?
  coverImage     String?
  content        Json                        // Tiptap JSON document
  status         String   @default("DRAFT")  // "DRAFT" | "PUBLISHED"
  isPremium      Boolean  @default(false)    // reserved; unenforced in this iteration
  readingTime    Int?
  seoTitle       String?
  seoDescription String?
  authorId       String
  author         User          @relation(fields: [authorId], references: [id])
  comments       BlogComment[]
  publishedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status, publishedAt])
}

model BlogComment {
  id         String   @id @default(cuid())
  content    String
  authorId   String
  author     User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  blogPostId String
  blogPost   BlogPost @relation(fields: [blogPostId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@index([blogPostId, createdAt])
}
```

`User` gains the inverse relations (`blogPosts BlogPost[]`, `blogComments BlogComment[]`).

## Editor & content rendering

- New dependency: Tiptap (`@tiptap/react` + starter-kit extensions). No rich text editor is currently installed in the repo.
- Standard nodes: headings, paragraphs, bullet/ordered lists, bold/italic, code block, blockquote, links.
- Two custom nodes:
  - **Image** — see Images section below.
  - **Excalidraw embed** — admin opens the existing editable canvas (`src/components/DiagramCanvas.tsx`) in a modal to create/edit a diagram. The resulting scene JSON (`ExcalidrawScene`, `src/types/diagram.ts`) is stored as the node's attributes. On render (both admin preview and public page), it always renders through a view-only component mirroring `src/components/profile/DiagramSnapshotViewer.tsx` (`viewModeEnabled: true`, `canvasActions` for load/save/export disabled) — readers can never edit it. No PNG fallback is generated; this is a client-only, `ssr:false` render like the existing canvas components, so there is a brief blank-then-render on first paint, and diagram content itself isn't visible to crawlers (text content around it is unaffected).
- Content is stored as Tiptap's native JSON in `BlogPost.content` and rendered back to React via Tiptap's read-only renderer on the public page — no markdown conversion step.

## Images

- Storage: **Cloudinary** (free tier — no existing upload infra exists in the repo today).
- Upload flow: admin drags an image into the editor or uses the toolbar button. The browser uploads directly to Cloudinary using a short-lived signed upload signature generated by a server action (keeps the API secret server-side without routing image bytes through our own server).
- Alt text is required at insert time (accessibility + SEO).
- Delivery URLs include Cloudinary's `f_auto,q_auto` transform for automatic format/compression.
- `BlogPost.coverImage` is a separate single-image field (its own upload control, not derived from the first inline image) used for the `/blog` listing cards and as the source for the generated OG image.

## Routes & pages

- `src/app/blog/page.tsx` — public index: search input (simple DB match against `title`/`excerpt`), list of `status = "PUBLISHED"` posts only, showing cover image, excerpt, reading time, publish date.
- `src/app/blog/[slug]/page.tsx` — public detail page: renders Tiptap content, comment section below. If the post is a draft, non-admins get `notFound()`; admins see it with an "editing preview" banner. Full `generateMetadata()` (canonical URL, OG/Twitter cards) plus `BlogPosting` JSON-LD, mirroring `src/app/guides/[slug]/page.tsx`.
- `src/app/blog/[slug]/opengraph-image.tsx` — dynamic OG image, mirroring the Guides pattern, sourced from `coverImage` when present.
- `src/app/admin/blog/page.tsx` — admin list (drafts + published), links to create/edit.
- `src/app/admin/blog/[id]/edit/page.tsx` — the Tiptap editor page (also used for creating a new post, with `id === "new"` or a dedicated create route — implementation detail for the plan phase).

## Actions & access control

- `src/app/actions/blog.ts` — `createBlogPost`, `updateBlogPost`, `publishBlogPost`, `deleteBlogPost`. All call the existing `requireAdmin()` helper (`src/app/actions/admin.ts`).
- `src/app/actions/blog-comments.ts`:
  - `addComment` — requires a logged-in session (`auth()`), no role restriction.
  - `deleteComment` — allowed if `session.user.id === comment.authorId`, or if the caller passes `requireAdmin()`.
- Reading blogs (list + detail) requires no authentication — needed for public SEO indexing, same as Guides.
- `isPremium` is toggleable by admins in the editor UI but is not read by any access-check code path in this iteration.

## Search

A server action or `src/app/api/blog/search/route.ts` endpoint that runs a Prisma query filtering `status = "PUBLISHED"` and `title`/`excerpt` `contains` (case-insensitive) the query string. No new indexes beyond the existing `@@index([status, publishedAt])` are required for this scale.

## Out of scope reminders for implementation

Do not build: categorization/tags, threaded replies, premium enforcement, full-text search, diagram PNG fallback, image captions. These were explicitly deferred above.

## Verification

- Prisma migration applies cleanly (`npx prisma migrate dev`).
- As a non-admin: cannot see `/admin/blog`, cannot call the create/update/delete/publish actions (should throw "Not authorized"), cannot see draft posts at `/blog/[slug]`.
- As an admin: can create a draft, edit it, insert an image and an Excalidraw diagram, publish it, and see it appear at `/blog` and be publicly viewable while logged out.
- As a logged-in non-admin: can comment on a published post, can delete their own comment, cannot delete another user's comment.
- As an admin: can delete any comment.
- `/blog/[slug]` for a published post has correct `<title>`, OG tags, and `BlogPosting` JSON-LD (spot-check via view-source).
- Search on `/blog` returns matching posts by title/excerpt substring.
