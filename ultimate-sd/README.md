# SysDesignAI (Ultimate SD)

AI-powered system design interview practice — step-by-step guided sessions, 47 interactive simulations, Excalidraw diagrams, and AI evaluation.

**Production:** [ultimate-sd.vercel.app](https://ultimate-sd.vercel.app)

For agent/developer workflows, see [`AGENTS.md`](./AGENTS.md).

## Features

- **87 system design problems** with per-problem curricula
- **5-phase practice flow:** Requirements → HLD → LLD → Trade-offs → Scalability
- **47 embedded simulations** (rate limiter, flash sale, consistent hashing, RAG, etc.)
- **Excalidraw diagram canvas** + free `/draw` page
- **AI evaluation & Socratic help** (BYOK for 7 providers, or platform credits)
- **Progress tracking** via PostgreSQL + guest localStorage drafts
- **Role-based roadmaps** with progress-gated unlocks
- **Razorpay subscriptions** (India INR pricing)

## Prerequisites

- **Node.js 22+** (see `.nvmrc`)
- **pnpm 11+** (`corepack enable && corepack prepare pnpm@11.9.0 --activate`)
- **PostgreSQL** (local or hosted)

## Quick start

```bash
cd ultimate-sd
nvm use
pnpm install

# Minimal .env for build/dev
cat > .env <<'EOF'
DATABASE_URL="postgresql://user:pass@localhost:5432/sysdesignai?schema=public"
AUTH_SECRET="dev-secret-at-least-32-characters-long"
GOOGLE_API_KEY="optional-for-ai-routes"
EOF

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection (build fails without it) |
| `AUTH_SECRET` | Yes | NextAuth session signing |
| `GOOGLE_API_KEY` | Optional | Server-side AI when user has no BYOK |
| `GOOGLE_CLIENT_ID/SECRET` | Optional | Google OAuth |
| `RAZORPAY_*` | Optional | Payments (checkout disabled when missing) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Email verification flows |

See [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) for production setup.

## Quality gate

```bash
pnpm lint
pnpm test run
pnpm build
```

For end-to-end smoke and practice flows (requires local PostgreSQL):

```bash
npx prisma db push
pnpm exec playwright install chromium
pnpm test:e2e
```

CI runs lint, unit tests, build, and Playwright E2E on every push (`.github/workflows/ci.yml`).

## Tech stack

- Next.js 16 · React 19 · TypeScript 5.9
- Prisma 7 · PostgreSQL
- NextAuth v5 · Razorpay
- Tailwind CSS 4 · shadcn/ui
- Vitest 4 · ESLint 9

## Documentation

| Doc | Purpose |
|-----|---------|
| [`AGENTS.md`](./AGENTS.md) | Agent/developer operational guide |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | UI tokens and patterns |
| [`SESSION_PERSISTENCE.md`](./SESSION_PERSISTENCE.md) | Session save/restore behavior |
| [`HELP_ASSISTANT_DOCS.md`](./HELP_ASSISTANT_DOCS.md) | Help assistant rules |
| [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) | Deployment guide |

## License

MIT
