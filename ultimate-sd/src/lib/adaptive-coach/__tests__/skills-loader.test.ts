// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  listSkillMetadata,
  loadSkill,
  type CoachSkillName,
} from '@/lib/adaptive-coach/skills-loader';

const EXPECTED_SKILL_NAMES: CoachSkillName[] = [
  'plan-agenda',
  'evaluate-for-level',
  'teach-forward',
  'mock-probe',
  'session-debrief',
  'profile-reflect',
];

describe('skills-loader', () => {
  it('listSkillMetadata returns all six coach skills', () => {
    const metadata = listSkillMetadata();

    expect(metadata).toHaveLength(6);
    expect(metadata.map((skill) => skill.name)).toEqual(EXPECTED_SKILL_NAMES);
    for (const skill of metadata) {
      expect(skill.description.length).toBeGreaterThan(0);
    }
  });

  it('loadSkill returns parsed frontmatter and body for plan-agenda', () => {
    const skill = loadSkill('plan-agenda');

    expect(skill.name).toBe('plan-agenda');
    expect(skill.description.length).toBeGreaterThan(0);
    expect(skill.body.length).toBeGreaterThan(0);
  });
});
