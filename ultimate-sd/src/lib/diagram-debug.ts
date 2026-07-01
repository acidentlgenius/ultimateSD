/** Dev-only console logging for diagram persistence troubleshooting */

const ENABLED = process.env.NODE_ENV === 'development';

export function diagramDebug(event: string, payload?: Record<string, unknown>): void {
  if (!ENABLED) return;
  console.info(`[diagram] ${event}`, payload ?? {});
}

export function countActiveElements(
  elements: readonly { isDeleted?: boolean }[] | undefined
): number {
  return elements?.filter((el) => !el.isDeleted).length ?? 0;
}
