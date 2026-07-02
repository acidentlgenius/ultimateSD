import { getPracticeSteps, INTERVIEW_LITE_PHASE_STEPS } from '@/lib/interview-lite-steps';
import type { StepData, SystemDesignProblem } from '@/types';

export type InterviewVariant = 'lite' | 'full';

export const INTERVIEW_DURATION_SECONDS: Record<InterviewVariant, number> = {
  lite: 2700, // 45 min
  full: 3600, // 60 min
};

export interface InterviewConfig {
  variant: InterviewVariant;
  durationSeconds: number;
}

export function parseInterviewParam(
  value: string | string[] | undefined
): InterviewVariant | null {
  if (value === 'lite' || value === 'full') {
    return value;
  }
  return null;
}

export function getInterviewConfig(variant: InterviewVariant): InterviewConfig {
  return { variant, durationSeconds: INTERVIEW_DURATION_SECONDS[variant] };
}

/**
 * Interview step selection: lite always uses the compact Clarify → HLD →
 * Trade-offs set; full uses whatever normal practice would use for the problem.
 */
export function getInterviewSteps(
  slug: string,
  difficulty: SystemDesignProblem['difficulty'],
  variant: InterviewVariant
): Record<string, StepData[]> {
  if (variant === 'lite') {
    return INTERVIEW_LITE_PHASE_STEPS;
  }
  return getPracticeSteps(slug, difficulty).steps;
}

export type InterviewStatus = 'running' | 'generating-summary' | 'complete' | 'summary-error';

export type InterviewEvent =
  | 'TIME_EXPIRED'
  | 'FINISH_EARLY'
  | 'SUMMARY_READY'
  | 'SUMMARY_FAILED'
  | 'RETRY_SUMMARY';

/** Pure interview session state machine (timer expiry / early finish / debrief). */
export function interviewStatusReducer(
  status: InterviewStatus,
  event: InterviewEvent
): InterviewStatus {
  switch (status) {
    case 'running':
      if (event === 'TIME_EXPIRED' || event === 'FINISH_EARLY') {
        return 'generating-summary';
      }
      return status;
    case 'generating-summary':
      if (event === 'SUMMARY_READY') return 'complete';
      if (event === 'SUMMARY_FAILED') return 'summary-error';
      return status;
    case 'summary-error':
      if (event === 'RETRY_SUMMARY') return 'generating-summary';
      return status;
    case 'complete':
      return status;
  }
}

export interface InterviewAnswer {
  stepId: string;
  phase: string;
  title: string;
  answer: string;
  passed: boolean;
}

/** Shape of StepByStepChat's per-step saved data that we depend on. */
export interface InterviewStepDataLike {
  listItems: string[];
  textInput: string;
  schemaData: unknown[];
  completed: boolean;
}

export function buildInterviewAnswers(
  phaseSteps: Record<string, StepData[]>,
  savedStepData: Map<string, InterviewStepDataLike>
): InterviewAnswer[] {
  const answers: InterviewAnswer[] = [];
  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    steps.forEach((step, index) => {
      const stepId = `${phaseKey}-${index}`;
      const data = savedStepData.get(stepId);
      let answer = '';
      if (data) {
        if (step.inputType === 'list') {
          answer = data.listItems.join('\n');
        } else if (step.inputType === 'schema') {
          answer = data.schemaData.length > 0 ? JSON.stringify(data.schemaData) : '';
        } else {
          answer = data.textInput;
        }
      }
      answers.push({
        stepId,
        phase: step.phase,
        title: step.title,
        answer: answer.trim() || '(not attempted — ran out of time)',
        passed: data?.completed ?? false,
      });
    });
  }
  return answers;
}
