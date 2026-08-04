import { prisma } from '@/lib/prisma';
import type { MemoryNote } from '@/lib/adaptive-coach/types';

export async function writeMemoryNotes(
  userId: string,
  notes: Omit<MemoryNote, 'id' | 'createdAt'>[]
): Promise<void> {
  if (notes.length === 0) {
    return;
  }

  await prisma.coachMemoryNote.createMany({
    data: notes.map((note) => ({
      userId,
      text: note.text,
      tags: note.tags,
      problemSlug: note.problemSlug,
    })),
  });
}
