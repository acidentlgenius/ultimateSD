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

### Database Connection Issues
If you see errors related to `prisma` or database connection:
*   Ensure `DATABASE_URL` is correct and allows connections from the internet (or Vercel's IP range).
*   If using Vercel Postgres or Neon, ensure you are using the pooled connection string if available.
*   The project uses `@prisma/adapter-pg` which supports connection pooling.

### Build Failures
*   Check the build logs.
*   Ensure `prisma generate` ran successfully (it is configured to run in `postinstall`).

## 5. Post-Deployment

*   After deployment, `prisma migrate deploy` is **NOT** automatically run. You may need to run migrations against your production database locally or via a Vercel Command (if configured).
*   **Recommended**: connect to your production database locally and run:
    ```bash
    npx prisma migrate deploy
    ```
    (Make sure `DATABASE_URL` in your local `.env` points to production temporarily, or pass it explicitly).
