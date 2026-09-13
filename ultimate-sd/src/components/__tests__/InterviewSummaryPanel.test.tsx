import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InterviewSummaryPanel from '../InterviewSummaryPanel';
import { fetchWithRetry } from '@/lib/fetchUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/fetchUtils', () => ({
  fetchWithRetry: vi.fn(),
  getUserFacingFetchError: vi.fn((e) => e.message),
}));

describe('InterviewSummaryPanel', () => {
  const mockProblem = { slug: 'test-slug', title: 'Test Problem' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles error properly when summary generation fails', async () => {
    (fetchWithRetry as any).mockRejectedValue(new Error('Generation failed'));

    const onSummaryFailed = vi.fn();
    render(
      <InterviewSummaryPanel
        problem={mockProblem}
        phaseSteps={{}}
        savedStepData={new Map()}
        status="generating-summary"
        onSummaryReady={() => {}}
        onSummaryFailed={onSummaryFailed}
        onRetry={() => {}}
        onExportPdf={async () => {}}
        isExporting={false}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(onSummaryFailed).toHaveBeenCalled();
    });
  });
});
