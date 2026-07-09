/**
 * One-off content merge: applies generated {context, FRs, NFRs} JSON onto
 * src/lib/problems.ts entries in place. Anchored per-slug so unrelated
 * fields are untouched. Usage:
 *   npx tsx scripts/apply-content.ts <content1.json> [content2.json ...]
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

type Entry = {
  context: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
};

const PROBLEMS_PATH = resolve(__dirname, '../src/lib/problems.ts');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: npx tsx scripts/apply-content.ts <content.json> [...]');
  process.exit(1);
}

const content: Record<string, Entry> = {};
for (const f of files) {
  Object.assign(content, JSON.parse(readFileSync(f, 'utf8')));
}

let source = readFileSync(PROBLEMS_PATH, 'utf8');
const esc = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const arr = (items: string[], indent: string) =>
  `[\n${items.map((i) => `${indent}  ${esc(i)},`).join('\n')}\n${indent}]`;

let applied = 0;
const missing: string[] = [];

for (const [slug, entry] of Object.entries(content)) {
  // Anchor on the slug line; fields follow in fixed order within the entry.
  const anchor = `slug: '${slug}',`;
  const idx = source.indexOf(anchor);
  if (idx === -1) {
    missing.push(slug);
    continue;
  }
  // Entry region: from anchor to the closing `},` of this object (next `  },`)
  const end = source.indexOf('\n  },', idx);
  const region = source.slice(idx, end);

  let updated = region
    .replace(/context: '(?:[^'\\]|\\.)*'/, `context: ${esc(entry.context)}`)
    .replace(/functionalRequirements: \[[^\]]*\]/, `functionalRequirements: ${arr(entry.functionalRequirements, '    ')}`)
    .replace(/nonFunctionalRequirements: \[[^\]]*\]/, `nonFunctionalRequirements: ${arr(entry.nonFunctionalRequirements, '    ')}`);

  if (updated === region) {
    missing.push(`${slug} (no fields replaced)`);
    continue;
  }
  source = source.slice(0, idx) + updated + source.slice(end);
  applied++;
}

writeFileSync(PROBLEMS_PATH, source);
console.log(`applied: ${applied}`);
if (missing.length) {
  console.error(`FAILED for: ${missing.join(', ')}`);
  process.exit(1);
}
