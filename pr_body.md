💥 The Bug
The Vercel deployment is failing with the error `ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json`.

🔍 Root Cause
The `package.json` file specified `@testing-library/dom` but this dependency was missing from the `pnpm-lock.yaml` file. Vercel runs `pnpm install --frozen-lockfile` by default on CI environments, which strictly enforces that the lockfile perfectly matches `package.json`. This mismatch caused the build to abort.

🛠️ The Fix
Ran `pnpm install` locally to update the `pnpm-lock.yaml` file, syncing the lockfile definitions with the updated `package.json` specifiers (specifically adding `@testing-library/dom` and deduplicating some minor `@babel` versions).

🛡️ Prevention
When updating `package.json` dependencies, ensure to always run `pnpm install` and commit the updated `pnpm-lock.yaml` file to avoid breaking CI/CD pipelines that rely on frozen lockfiles.
