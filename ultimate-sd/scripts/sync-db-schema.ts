/**
 * Sync the database schema with prisma/schema.prisma.
 * Run against production before expecting auth to work:
 *
 *   DATABASE_URL="postgres://..." npx tsx scripts/sync-db-schema.ts
 */
import { execSync } from 'node:child_process'

function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  console.log('Checking schema drift...')
  const diff = execSync(
    'npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script',
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim()

  if (!diff) {
    console.log('Database schema is already in sync.')
    return
  }

  console.log('Pending changes:\n')
  console.log(diff)
  console.log('\nApplying with prisma db push...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('Done. Schema is now in sync.')
}

main()
