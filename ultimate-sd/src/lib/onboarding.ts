export type PracticeIntent = 'interview' | 'upskill' | 'learn';

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
