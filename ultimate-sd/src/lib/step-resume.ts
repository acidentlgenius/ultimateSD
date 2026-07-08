/**
 * Where to place the user when a practice session is restored.
 *
 * Resume AFTER the furthest completed step, not at the first incomplete one.
 * A user who skipped step 2 and completed 3–5 must land on 6 after a
 * refresh — not be dragged back to the skipped step. Skipped steps stay
 * reachable via the sidebar and become the resume target only once
 * everything beyond them is done.
 */
export function findResumePosition(
  phaseSteps: Record<string, unknown[]>,
  completedSteps: Set<string>
): { phase: string; stepIndex: number } {
  const ordered: { phase: string; stepIndex: number; key: string }[] = [];
  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    for (let i = 0; i < steps.length; i++) {
      ordered.push({ phase: phaseKey, stepIndex: i, key: `${phaseKey}-${i}` });
    }
  }
  if (ordered.length === 0) {
    return { phase: 'requirements', stepIndex: 0 };
  }

  let lastCompleted = -1;
  for (let i = 0; i < ordered.length; i++) {
    if (completedSteps.has(ordered[i].key)) lastCompleted = i;
  }

  for (let i = lastCompleted + 1; i < ordered.length; i++) {
    if (!completedSteps.has(ordered[i].key)) {
      return { phase: ordered[i].phase, stepIndex: ordered[i].stepIndex };
    }
  }
  // Everything after the furthest completed step is done — circle back to the
  // first remaining (skipped) step, or the last step if truly all complete.
  for (const step of ordered) {
    if (!completedSteps.has(step.key)) {
      return { phase: step.phase, stepIndex: step.stepIndex };
    }
  }
  const last = ordered[ordered.length - 1];
  return { phase: last.phase, stepIndex: last.stepIndex };
}
