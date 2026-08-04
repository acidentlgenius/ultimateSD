export type PracticeIntent = 'interview' | 'upskill' | 'learn';

export type ExperienceLevel = 'fresher' | 'sde1' | 'sde2' | 'senior';

export const PRACTICE_INTENTS: { id: PracticeIntent; label: string; description: string }[] = [
  {
    id: 'interview',
    label: 'I have interviews coming up',
    description: 'Get interview-ready with timed practice and AI feedback.',
  },
  {
    id: 'upskill',
    label: "I'm leveling up as an engineer",
    description: 'Deepen your system design skills for your current role and the next one.',
  },
  {
    id: 'learn',
    label: "I'm learning system design from scratch",
    description: 'Start with fundamentals and a guided roadmap built for beginners.',
  },
];

export function isPracticeIntent(value: string): value is PracticeIntent {
  return PRACTICE_INTENTS.some((intent) => intent.id === value);
}

export const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; description: string }[] = [
  {
    id: 'fresher',
    label: 'Fresher / student',
    description: 'New to system design or early in your career.',
  },
  {
    id: 'sde1',
    label: 'SDE I (0–2 years)',
    description: 'Building fundamentals and interview readiness.',
  },
  {
    id: 'sde2',
    label: 'SDE II (2–5 years)',
    description: 'Solid engineer looking to sharpen design depth.',
  },
  {
    id: 'senior',
    label: 'Senior+ (5+ years)',
    description: 'Experienced engineer preparing for staff-level rounds.',
  },
];

export function isExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_LEVELS.some((level) => level.id === value);
}

// First-problem recommendation per intent. Every slug must be in
// FREE_PROBLEM_SLUGS so brand-new users are never recommended a locked problem.
export const RECOMMENDED_FIRST_PROBLEM: Record<PracticeIntent, string> = {
  interview: 'design-whatsapp',
  upskill: 'design-distributed-cache',
  learn: 'design-tinyurl',
};
