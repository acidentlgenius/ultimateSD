import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type CoachSkillName =
  | 'plan-agenda'
  | 'evaluate-for-level'
  | 'teach-forward'
  | 'mock-probe'
  | 'session-debrief'
  | 'profile-reflect';

export type LoadedSkill = {
  name: CoachSkillName;
  description: string;
  body: string;
};

export const COACH_SKILL_NAMES: CoachSkillName[] = [
  'plan-agenda',
  'evaluate-for-level',
  'teach-forward',
  'mock-probe',
  'session-debrief',
  'profile-reflect',
];

function resolveSkillsDir(): string {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), 'skills'),
    join(process.cwd(), 'src/lib/adaptive-coach/skills'),
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, 'plan-agenda', 'SKILL.md'))) {
      return dir;
    }
  }

  throw new Error('Coach skills directory not found');
}

function parseSkillMarkdown(content: string): {
  name: string;
  description: string;
  body: string;
} {
  const match = content.trim().match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error('SKILL.md missing YAML frontmatter fences');
  }

  const [, frontmatter, body] = match;
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch?.[1] || !descriptionMatch?.[1]) {
    throw new Error('SKILL.md frontmatter must include name and description');
  }

  return {
    name: nameMatch[1].trim(),
    description: descriptionMatch[1].trim(),
    body: body.trim(),
  };
}

function readSkillFromDisk(skillsDir: string, name: CoachSkillName): LoadedSkill {
  const filePath = join(skillsDir, name, 'SKILL.md');
  const parsed = parseSkillMarkdown(readFileSync(filePath, 'utf-8'));

  if (parsed.name !== name) {
    throw new Error(`SKILL.md name mismatch: expected ${name}, got ${parsed.name}`);
  }

  return {
    name,
    description: parsed.description,
    body: parsed.body,
  };
}

const SKILLS_DIR = resolveSkillsDir();

export const SKILLS: Record<CoachSkillName, LoadedSkill> = Object.fromEntries(
  COACH_SKILL_NAMES.map((name) => [name, readSkillFromDisk(SKILLS_DIR, name)]),
) as Record<CoachSkillName, LoadedSkill>;

export function listSkillMetadata(): Pick<LoadedSkill, 'name' | 'description'>[] {
  return COACH_SKILL_NAMES.map((name) => ({
    name,
    description: SKILLS[name].description,
  }));
}

export function loadSkill(name: CoachSkillName): LoadedSkill {
  const skill = SKILLS[name];
  if (!skill) {
    throw new Error(`Unknown coach skill: ${name}`);
  }
  return skill;
}
