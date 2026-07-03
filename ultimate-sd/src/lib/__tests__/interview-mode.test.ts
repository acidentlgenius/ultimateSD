import { describe, expect, it } from 'vitest';
import {
  INTERVIEW_DURATION_SECONDS,
  buildInterviewAnswers,
  getInterviewConfig,
  getInterviewSteps,
  interviewStatusReducer,
  parseInterviewParam,
  type InterviewStatus,
} from '@/lib/interview-mode';
import { INTERVIEW_LITE_PHASE_STEPS } from '@/lib/interview-lite-steps';
import { PROBLEM_STEPS } from '@/lib/problem-steps';

describe('interview durations and param parsing', () => {
  it('maps lite to 45 minutes and full to 60 minutes', () => {
    expect(INTERVIEW_DURATION_SECONDS.lite).toBe(2700);
    expect(INTERVIEW_DURATION_SECONDS.full).toBe(3600);
    expect(getInterviewConfig('lite')).toEqual({ variant: 'lite', durationSeconds: 2700 });
    expect(getInterviewConfig('full')).toEqual({ variant: 'full', durationSeconds: 3600 });
  });

  it('parses only exact lite/full values', () => {
    expect(parseInterviewParam('lite')).toBe('lite');
    expect(parseInterviewParam('full')).toBe('full');
    expect(parseInterviewParam('LITE')).toBeNull();
    expect(parseInterviewParam(undefined)).toBeNull();
    expect(parseInterviewParam(['lite'])).toBeNull();
    expect(parseInterviewParam('hack')).toBeNull();
  });
});

describe('getInterviewSteps', () => {
  it('lite variant uses the lite phase set even when the problem has custom steps', () => {
    expect(getInterviewSteps('design-tinyurl', 'Easy', 'lite')).toBe(INTERVIEW_LITE_PHASE_STEPS);
  });

  it('full variant uses the normal practice step selection', () => {
    expect(getInterviewSteps('design-tinyurl', 'Easy', 'full')).toBe(
      PROBLEM_STEPS['design-tinyurl']
    );
  });
});

describe('interviewStatusReducer', () => {
  it('running ends on expiry or early finish', () => {
    expect(interviewStatusReducer('running', 'TIME_EXPIRED')).toBe('generating-summary');
    expect(interviewStatusReducer('running', 'FINISH_EARLY')).toBe('generating-summary');
  });

  it('summary outcome transitions', () => {
    expect(interviewStatusReducer('generating-summary', 'SUMMARY_READY')).toBe('complete');
    expect(interviewStatusReducer('generating-summary', 'SUMMARY_FAILED')).toBe('summary-error');
    expect(interviewStatusReducer('summary-error', 'RETRY_SUMMARY')).toBe('generating-summary');
  });

  it('ignores invalid transitions', () => {
    const cases: Array<[InterviewStatus, Parameters<typeof interviewStatusReducer>[1]]> = [
      ['running', 'SUMMARY_READY'],
      ['complete', 'TIME_EXPIRED'],
      ['generating-summary', 'FINISH_EARLY'],
    ];
    for (const [status, event] of cases) {
      expect(interviewStatusReducer(status, event)).toBe(status);
    }
  });
});

describe('buildInterviewAnswers', () => {
  it('flattens answered and unanswered steps in order', () => {
    const saved = new Map([
      [
        'requirements-0',
        { listItems: ['Shorten URL', 'Redirect'], textInput: '', schemaData: [], completed: true },
      ],
    ]);
    const answers = buildInterviewAnswers(INTERVIEW_LITE_PHASE_STEPS, saved);
    expect(answers).toHaveLength(5);
    expect(answers[0]).toEqual({
      stepId: 'requirements-0',
      phase: 'Requirements',
      title: 'Functional Requirements',
      answer: 'Shorten URL\nRedirect',
      passed: true,
    });
    expect(answers[1].answer).toBe('(not attempted — ran out of time)');
    expect(answers[1].passed).toBe(false);
  });
});
