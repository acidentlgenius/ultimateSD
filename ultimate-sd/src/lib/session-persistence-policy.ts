/**
 * Logged-in users restore from the database; localStorage drafts are guest-only.
 */
export function shouldUseLocalSessionDraft(isAuthenticated: boolean): boolean {
  return !isAuthenticated;
}
