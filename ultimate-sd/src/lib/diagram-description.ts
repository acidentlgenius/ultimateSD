import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

const CONNECTOR_TYPES = new Set(['arrow', 'line']);

function getLabelForElement(
  el: ExcalidrawElement,
  textByContainerId: Map<string, string>
): string | undefined {
  const bound = textByContainerId.get(el.id);
  if (bound) return bound;
  if (el.type === 'text' && 'text' in el) {
    const t = (el as { text?: string }).text;
    if (t && !('containerId' in el && (el as { containerId?: string }).containerId)) return t;
  }
  return undefined;
}

export function buildDiagramDescription(
  elements: readonly ExcalidrawElement[]
): string | null {
  const active = elements.filter((el) => !el.isDeleted);
  if (active.length === 0) return null;

  const textByContainerId = new Map<string, string>();
  for (const el of active) {
    if (el.type === 'text' && 'containerId' in el && 'text' in el) {
      const containerId = (el as { containerId?: string }).containerId;
      const text = (el as { text?: string }).text;
      if (containerId && text?.trim()) textByContainerId.set(containerId, text.trim());
    }
  }

  const components = active.filter((el) => !CONNECTOR_TYPES.has(el.type));
  const labeled = components
    .map((el) => {
      const label = getLabelForElement(el, textByContainerId);
      return label ? `${el.type} "${label}"` : el.type;
    })
    .filter(Boolean);

  const standaloneText = active
    .filter((el) => el.type === 'text' && !('containerId' in el && (el as { containerId?: string }).containerId))
    .map((el) => (el as { text?: string }).text)
    .filter((t): t is string => !!t?.trim());

  const parts = [...labeled, ...standaloneText.map((t) => `note "${t}"`)];
  return `Diagram contains ${active.length} elements. Components: ${parts.join(', ')}.`;
}
