-- Adaptive coach profile: user preferences, competency signals, coach memory, session state, submission outcomes
-- Defensive SQL for environments where schema may already be partially applied via db push.

-- User profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "targetRole" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interviewDate" TIMESTAMP(3);

-- Practice session adaptive state
ALTER TABLE "PracticeSession" ADD COLUMN IF NOT EXISTS "adaptiveState" JSONB;

-- Step submission gate metadata
ALTER TABLE "StepSubmission" ADD COLUMN IF NOT EXISTS "gateAction" TEXT;
ALTER TABLE "StepSubmission" ADD COLUMN IF NOT EXISTS "outcome" TEXT;

-- CompetencySignal table
CREATE TABLE IF NOT EXISTS "CompetencySignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coached" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencySignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetencySignal_userId_skillId_key" ON "CompetencySignal"("userId", "skillId");
CREATE INDEX IF NOT EXISTS "CompetencySignal_userId_idx" ON "CompetencySignal"("userId");

DO $$ BEGIN
    ALTER TABLE "CompetencySignal" ADD CONSTRAINT "CompetencySignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CoachMemoryNote table
CREATE TABLE IF NOT EXISTS "CoachMemoryNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "problemSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMemoryNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CoachMemoryNote_userId_createdAt_idx" ON "CoachMemoryNote"("userId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "CoachMemoryNote" ADD CONSTRAINT "CoachMemoryNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
