import { describe, it, expect, vi } from 'vitest';
import { exportInterviewDebriefPdf } from '@/lib/pdf-export-interview-debrief';

vi.mock('jspdf', () => {
  function MockJsPDF(this: {
    setFontSize: ReturnType<typeof vi.fn>;
    setTextColor: ReturnType<typeof vi.fn>;
    text: ReturnType<typeof vi.fn>;
    splitTextToSize: ReturnType<typeof vi.fn>;
    addPage: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  }) {
    this.setFontSize = vi.fn();
    this.setTextColor = vi.fn();
    this.text = vi.fn();
    this.splitTextToSize = vi.fn((t: string) => [t]);
    this.addPage = vi.fn();
    this.save = vi.fn();
  }
  return { default: MockJsPDF };
});

describe('exportInterviewDebriefPdf', () => {
  it('runs without throwing for a valid summary', () => {
    expect(() =>
      exportInterviewDebriefPdf(
        {
          overallScore: 8,
          verdict: 'Hire',
          strengths: ['Clear HLD'],
          improvements: ['More scale discussion'],
          phaseNotes: [{ phase: 'HLD', comment: 'Solid' }],
        },
        'Design TinyURL'
      )
    ).not.toThrow();
  });
});
