/**
 * Only allow internal app paths as post-auth redirect targets.
 * Anything absolute ("https://…", "//evil.com") or malformed is rejected
 * so verification links can't be weaponized as open redirects.
 */
export function safeCallbackPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}
