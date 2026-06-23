# Deploying Ultimate SD to Vercel

This guide outlines the steps to deploy the Ultimate SD application to Vercel.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repository**: Push this project to a GitHub repository.
3.  **PostgreSQL Database**: You need a hosted PostgreSQL database (e.g., Neon, Supabase, Vercel Postgres).

## 1. Prepare Your Database

Ensure you have a connection string for your production database. It essentially looks like this:

`postgres://user:password@host:port/database?sslmode=require`

## 2. Environment Variables

You must configure the following Environment Variables in your Vercel Project Settings (under **Settings** > **Environment Variables**):

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for your PostgreSQL database. | `postgres://...` |
| `AUTH_SECRET` | A random string used to hash tokens. Generate one using `openssl rand -base64 32`. | `long-random-string` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console. | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret from Google Cloud Console. | `GOCSPX-...` |
| `GOOGLE_API_KEY` | API Key for Google Gemini (AI features). | `AIza...` |
| `NEXTAUTH_URL` | The canonical URL of your deployment (e.g., `https://your-app.vercel.app`). Automatically set by Vercel for previews, but good to set for production. | `https://ultimate-sd.vercel.app` |

### Note on `AUTH_SECRET`
Since this project uses `next-auth` v5 (beta), use `AUTH_SECRET` instead of `NEXTAUTH_SECRET`.

## 3. Deploying via Vercel Dashboard

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  In the **"Configure Project"** screen:
    *   **Framework Preset**: Next.js (should be detected automatically).
    *   **Root Directory**: `./` (default).
    *   **Build Command**: `next build` (default).
    *   **Install Command**: `pnpm install` (should be detected automatically).
    *   **Environment Variables**: Expand this section and add the variables listed above.
5.  Click **"Deploy"**.

## 4. Troubleshooting

### Auth / Sign-in Failures (`AdapterError`, `error=Configuration`)

Google OAuth reaches `/api/auth/callback/google` then fails when the Prisma adapter reads or writes `User` / `Account` rows. Common causes:

1. **Schema drift** (most common): production DB missing columns added since initial deploy (e.g. `role`, subscription fields, BYOK columns). Run `npx prisma db push` against production — see [Post-Deployment](#5-post-deployment).
2. **`DATABASE_URL` wrong or unreachable** from Vercel (check SSL: use `?sslmode=require` for Neon/Supabase).
3. **Missing auth env vars**: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Set `AUTH_URL=https://ultimate-sd.vercel.app` for production.
4. **Google OAuth redirect URI** must include `https://ultimate-sd.vercel.app/api/auth/callback/google` in Google Cloud Console.

### Database Connection Issues
If you see errors related to `prisma` or database connection:
*   Ensure `DATABASE_URL` is correct and allows connections from the internet (or Vercel's IP range).
*   If using Vercel Postgres or Neon, ensure you are using the pooled connection string if available.
*   The project uses `@prisma/adapter-pg` which supports connection pooling.

### Build Failures
*   Check the build logs.
*   Ensure `prisma generate` ran successfully (it is configured to run in `postinstall`).

## 5. Post-Deployment

**Critical:** Schema changes are **not** applied automatically on deploy. The app uses `prisma db push` (there is no `prisma/migrations` history yet). If sign-in fails with `AdapterError` or `/api/auth/error?error=Configuration` after Google OAuth, the production database is almost certainly out of sync with `prisma/schema.prisma`.

Sync production from your machine (temporarily point at prod, or pass the URL inline):

```bash
DATABASE_URL="postgres://..." npx prisma db push
```

To preview what would change without applying:

```bash
DATABASE_URL="postgres://..." npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

After syncing, retry Google sign-in. To capture detailed Auth.js adapter logs on Vercel, set `AUTH_DEBUG=true` in project env vars (remove once resolved).

*Do not use `prisma migrate deploy` until migration files exist in `prisma/migrations`.*
