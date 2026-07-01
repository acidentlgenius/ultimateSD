import { describe, it, expect } from 'vitest';
import { buildDiagramDescription } from '../diagram-description';

describe('buildDiagramDescription', () => {
  it('returns null for empty elements', () => {
    expect(buildDiagramDescription([])).toBeNull();
  });

  it('resolves bound labels via containerId', () => {
    const elements = [
      { id: 'rect1', type: 'rectangle', isDeleted: false } as any,
      { id: 'txt1', type: 'text', text: 'API Gateway', containerId: 'rect1', isDeleted: false } as any,
      { id: 'arr1', type: 'arrow', isDeleted: false } as any,
    ];
    const desc = buildDiagramDescription(elements);
    expect(desc).toContain('rectangle "API Gateway"');
    expect(desc).not.toContain('arrow "');
  });

  it('includes standalone text elements', () => {
    const desc = buildDiagramDescription([
      { id: 't1', type: 'text', text: 'read path', isDeleted: false } as any,
    ]);
    expect(desc).toContain('read path');
  });
});
