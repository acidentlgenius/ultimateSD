/**
 * Per-problem content completeness report against docs/CONTENT_STANDARD.md.
 * Usage: npx tsx scripts/content-coverage.ts [--summary]
 */
import { PROBLEMS } from '../src/lib/problems';
import { getStepsForProblem } from '../src/lib/problem-steps';
import { getSolution } from '../src/lib/solutions';
import { guides } from '../src/content/guides';

const summaryOnly = process.argv.includes('--summary');

interface Row {
  slug: string;
  ctx: number;
  ctxOk: boolean;
  fr: number;
  frOk: boolean;
  nfr: number;
  nfrOk: boolean;
  steps: boolean;
  solution: boolean;
  guide: boolean;
}

const guideSlugs = new Set(Object.keys(guides));

const rows: Row[] = PROBLEMS.map((p) => {
  const ctx = p.context?.length ?? 0;
  const fr = p.functionalRequirements?.length ?? 0;
  const nfr = p.nonFunctionalRequirements?.length ?? 0;
  return {
    slug: p.slug,
    ctx,
    ctxOk: ctx >= 300,
    fr,
    frOk: fr >= 3 && p.functionalRequirements.every((r) => r.length >= 15),
    nfr,
    nfrOk: nfr >= 3 && p.nonFunctionalRequirements.every((r) => r.length >= 15),
    steps: !!getStepsForProblem(p.slug),
    solution: !!getSolution(p.slug),
    guide: guideSlugs.has(p.slug),
  };
});

const pct = (n: number) => `${Math.round((n / rows.length) * 100)}%`;
const count = (f: (r: Row) => boolean) => rows.filter(f).length;

console.log(`\nContent coverage — ${rows.length} problems`);
console.log('─'.repeat(64));
console.log(`context ≥ 300 chars      ${count(r => r.ctxOk).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.ctxOk))})`);
console.log(`≥3 full FRs              ${count(r => r.frOk).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.frOk))})`);
console.log(`≥3 quantified NFRs       ${count(r => r.nfrOk).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.nfrOk))})`);
console.log(`bespoke interview steps  ${count(r => r.steps).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.steps))})`);
console.log(`expert solution          ${count(r => r.solution).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.solution))})`);
console.log(`guide                    ${count(r => r.guide).toString().padStart(3)} / ${rows.length}  (${pct(count(r => r.guide))})`);

if (!summaryOnly) {
  console.log('\nslug'.padEnd(45) + 'ctx   fr  nfr  steps sol guide');
  console.log('─'.repeat(75));
  for (const r of rows) {
    const flag = (b: boolean) => (b ? ' ✓ ' : ' · ');
    console.log(
      r.slug.padEnd(44) +
      `${r.ctx}`.padStart(4) + (r.ctxOk ? '✓' : '·') +
      `${r.fr}`.padStart(4) + (r.frOk ? '✓' : '·') +
      `${r.nfr}`.padStart(4) + (r.nfrOk ? '✓' : '·') +
      flag(r.steps).padStart(6) + flag(r.solution) + flag(r.guide)
    );
  }
}

const complete = count(r => r.ctxOk && r.frOk && r.nfrOk);
console.log(`\nFully standard-compliant (ctx+FR+NFR): ${complete}/${rows.length} (${pct(complete)})\n`);
