/**
 * Per-problem content completeness report against docs/CONTENT_STANDARD.md.
 * Usage: npx tsx scripts/content-coverage.ts [--summary] [--md]
 *   --md  regenerate the tracker at <repo root>/docs/PROBLEM_TRACKER.md
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { PROBLEMS } from '../src/lib/problems';
import { getStepsForProblem } from '../src/lib/problem-steps';
import { getSolution } from '../src/lib/solutions';
import { guides } from '../src/content/guides';
import { FREE_PROBLEM_SLUGS } from '../src/lib/plans';
import { START_HERE_TRACK } from '../src/lib/start-here';

const summaryOnly = process.argv.includes('--summary');
const writeMd = process.argv.includes('--md');

interface Row {
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  free: boolean;
  startHere: boolean;
  ctx: number;
  ctxOk: boolean;
  fr: number;
  frOk: boolean;
  nfr: number;
  nfrOk: boolean;
  steps: boolean;
  widget: boolean;
  solution: boolean;
  guide: boolean;
  missing: string[];
  done: boolean;
}

const guideSlugs = new Set(Object.keys(guides));
const freeSlugs = new Set<string>(FREE_PROBLEM_SLUGS);
const startHereSlugs = new Set<string>(START_HERE_TRACK);

const rows: Row[] = PROBLEMS.map((p) => {
  const ctx = p.context?.length ?? 0;
  const fr = p.functionalRequirements?.length ?? 0;
  const nfr = p.nonFunctionalRequirements?.length ?? 0;
  const problemSteps = getStepsForProblem(p.slug);
  const row = {
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    free: freeSlugs.has(p.slug),
    startHere: startHereSlugs.has(p.slug),
    ctx,
    ctxOk: ctx >= 300,
    fr,
    frOk: fr >= 3 && p.functionalRequirements.every((r) => r.length >= 15),
    nfr,
    nfrOk: nfr >= 3 && p.nonFunctionalRequirements.every((r) => r.length >= 15),
    steps: !!problemSteps,
    // "signature interactive moment": at least one step carries an interactive widget
    widget: !!problemSteps && Object.values(problemSteps).flat().some((s) => s.widgetId),
    solution: !!getSolution(p.slug),
    guide: guideSlugs.has(p.slug),
  };
  // Definition of done per docs/CONTENT_STANDARD.md "Companion content":
  // steps + solution required for free / Start Here / Core Services problems;
  // guide + an in-step interactive widget additionally required for the Start Here track.
  const topTier = row.free || row.startHere || p.category === 'Core Services';
  const missing: string[] = [];
  if (!row.ctxOk) missing.push('context');
  if (!row.frOk) missing.push('FRs');
  if (!row.nfrOk) missing.push('NFRs');
  if (topTier && !row.steps) missing.push('steps');
  if (topTier && !row.solution) missing.push('solution');
  if (row.startHere && !row.guide) missing.push('guide');
  if (row.startHere && !row.widget) missing.push('widget');
  return { ...row, missing, done: missing.length === 0 };
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

if (writeMd) {
  const order: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
  const sorted = [...rows].sort(
    (a, b) =>
      (order[a.difficulty] ?? 9) - (order[b.difficulty] ?? 9) ||
      Number(b.startHere) - Number(a.startHere) ||
      Number(b.free) - Number(a.free) ||
      a.slug.localeCompare(b.slug),
  );
  const y = (b: boolean) => (b ? '✓' : '·');
  const tier = (r: Row) =>
    [r.startHere ? 'start-here' : '', r.free ? 'free' : ''].filter(Boolean).join(', ') || '—';
  const lines = [
    '# Problem Improvement Tracker',
    '',
    '**GENERATED FILE — do not edit by hand.** Regenerate with:',
    '`npx tsx scripts/content-coverage.ts --md` (run from `ultimate-sd/`).',
    '',
    'Definition of done (per [CONTENT_STANDARD.md](./CONTENT_STANDARD.md)): every problem needs',
    'context ≥ 300 chars + ≥3 full FRs + ≥3 quantified NFRs; free / Start Here / Core Services',
    'problems additionally need bespoke steps + an expert solution; Start Here problems also need',
    'a guide and a signature interactive widget attached to a step.',
    'A problem is **improved** when its Missing column is empty. Work order: Easy → Medium → Hard,',
    'and within a difficulty: Start Here → free → Core Services → rest.',
    '',
    `**Status: ${count(r => r.done)}/${rows.length} done** · steps ${count(r => r.steps)}/${rows.length} · widgets ${count(r => r.widget)}/${rows.length} · solutions ${count(r => r.solution)}/${rows.length} · guides ${count(r => r.guide)}/${rows.length}`,
    '',
    '| # | Problem | Diff | Tier | Ctx | FR | NFR | Steps | Widget | Sol | Guide | Missing | Done |',
    '|---|---------|------|------|-----|----|-----|-------|--------|-----|-------|---------|------|',
    ...sorted.map(
      (r, i) =>
        `| ${i + 1} | \`${r.slug}\` | ${r.difficulty} | ${tier(r)} | ${y(r.ctxOk)} | ${y(r.frOk)} | ${y(r.nfrOk)} | ${y(r.steps)} | ${y(r.widget)} | ${y(r.solution)} | ${y(r.guide)} | ${r.missing.join(', ') || '—'} | ${r.done ? '✅' : '⬜'} |`,
    ),
    '',
  ];
  const outPath = join(__dirname, '..', '..', 'docs', 'PROBLEM_TRACKER.md');
  writeFileSync(outPath, lines.join('\n'));
  console.log(`Tracker written to ${outPath}\n`);
}
