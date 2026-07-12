import type { Page } from '@playwright/test';

/**
 * E2E runs start with a fresh browser profile, so the first-run practice
 * tour (PracticeTour), the problem-intro overlay, and the step interaction
 * hint all auto-open and their full-screen/inline UI blocks or obscures
 * every click on the practice page. Call this in beforeEach of any spec
 * that drives /practice/* to pre-mark the first-run UX as seen — the tour,
 * the intro overlay, and the hint have their own dedicated assertions and
 * remain testable by NOT calling this helper.
 */
export async function suppressFirstRunUx(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('sd_practice_tour_done_v1', '1');
    localStorage.setItem('sd_first_step_hint_dismissed', '1');
    localStorage.setItem('sd_problem_intro_suppress_all', '1');
  });
}
