-- Progress restructure: PracticeSession model, enums, ProblemProgress summary fields

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVIEW_NEEDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "finalScore" INTEGER,
    "diagramSnapshot" JSONB,
    "isTimerRunning" BOOLEAN NOT NULL DEFAULT true,
    "lastPausedAt" TIMESTAMP(3),
    "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- Add new ProblemProgress columns (keep legacy columns until backfill completes)
ALTER TABLE "ProblemProgress"
    ADD COLUMN "progressPercent" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "bestScore" INTEGER,
    ADD COLUMN "activeSessionId" TEXT;

-- Migrate legacy counters/scores
UPDATE "ProblemProgress"
SET
    "totalAttempts" = COALESCE("attempts", 0),
    "bestScore" = "lastScore"
WHERE "attempts" IS NOT NULL OR "lastScore" IS NOT NULL;

-- Convert status from text to ProgressStatus enum
ALTER TABLE "ProblemProgress" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProblemProgress" ALTER COLUMN "status" TYPE "ProgressStatus" USING (
    CASE "status"
        WHEN 'NOT_STARTED' THEN 'NOT_STARTED'::"ProgressStatus"
        WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::"ProgressStatus"
        WHEN 'REVIEW_NEEDED' THEN 'REVIEW_NEEDED'::"ProgressStatus"
        WHEN 'COMPLETED' THEN 'COMPLETED'::"ProgressStatus"
        ELSE 'NOT_STARTED'::"ProgressStatus"
    END
);
ALTER TABLE "ProblemProgress" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED'::"ProgressStatus";

-- Backfill PracticeSession from existing ProblemProgress rows with activity
INSERT INTO "PracticeSession" (
    "id",
    "userId",
    "problemId",
    "status",
    "attemptNumber",
    "startedAt",
    "completedAt",
    "finalScore",
    "isTimerRunning",
    "lastPausedAt",
    "totalPausedSeconds"
)
SELECT
    gen_random_uuid()::text,
    pp."userId",
    pp."problemId",
    CASE pp."status"
        WHEN 'COMPLETED'::"ProgressStatus" THEN 'COMPLETED'::"SessionStatus"
        WHEN 'IN_PROGRESS'::"ProgressStatus" THEN 'ACTIVE'::"SessionStatus"
        WHEN 'REVIEW_NEEDED'::"ProgressStatus" THEN 'ACTIVE'::"SessionStatus"
        ELSE 'ABANDONED'::"SessionStatus"
    END,
    GREATEST(COALESCE(pp."attempts", 1), 1),
    COALESCE(pp."startedAt", pp."createdAt", CURRENT_TIMESTAMP),
    CASE WHEN pp."status" = 'COMPLETED'::"ProgressStatus" THEN pp."lastAttemptAt" ELSE NULL END,
    pp."lastScore",
    COALESCE(pp."isTimerRunning", true),
    pp."lastPausedAt",
    COALESCE(pp."totalPausedSeconds", 0)
FROM "ProblemProgress" pp
WHERE pp."status" <> 'NOT_STARTED'::"ProgressStatus"
   OR COALESCE(pp."attempts", 0) > 0
   OR pp."sessionState" IS NOT NULL;

-- Link active sessions for in-progress problems
UPDATE "ProblemProgress" pp
SET "activeSessionId" = ps."id"
FROM "PracticeSession" ps
WHERE pp."userId" = ps."userId"
  AND pp."problemId" = ps."problemId"
  AND pp."status" IN ('IN_PROGRESS'::"ProgressStatus", 'REVIEW_NEEDED'::"ProgressStatus")
  AND ps."status" = 'ACTIVE'::"SessionStatus";

-- Add StepSubmission columns as nullable for backfill
ALTER TABLE "StepSubmission"
    ADD COLUMN "phase" TEXT,
    ADD COLUMN "sessionId" TEXT;

-- Derive phase from stepId prefix (e.g. "requirements-0" -> "requirements")
UPDATE "StepSubmission"
SET "phase" = split_part("stepId", '-', 1)
WHERE "phase" IS NULL;

-- Create placeholder sessions for submissions without a matching session
INSERT INTO "PracticeSession" (
    "id",
    "userId",
    "problemId",
    "status",
    "attemptNumber",
    "startedAt",
    "completedAt"
)
SELECT
    gen_random_uuid()::text,
    ss."userId",
    ss."problemId",
    'COMPLETED'::"SessionStatus",
    1,
    MIN(ss."createdAt"),
    MAX(ss."createdAt")
FROM "StepSubmission" ss
WHERE NOT EXISTS (
    SELECT 1
    FROM "PracticeSession" ps
    WHERE ps."userId" = ss."userId"
      AND ps."problemId" = ss."problemId"
)
GROUP BY ss."userId", ss."problemId";

-- Link submissions to the earliest matching session per user+problem
UPDATE "StepSubmission" ss
SET "sessionId" = ps."id"
FROM (
    SELECT DISTINCT ON ("userId", "problemId")
        "id",
        "userId",
        "problemId"
    FROM "PracticeSession"
    ORDER BY "userId", "problemId", "startedAt" ASC
) ps
WHERE ss."userId" = ps."userId"
  AND ss."problemId" = ps."problemId"
  AND ss."sessionId" IS NULL;

-- Default any remaining rows (empty table edge case)
UPDATE "StepSubmission"
SET "phase" = 'unknown'
WHERE "phase" IS NULL;

-- Enforce NOT NULL on StepSubmission new columns
ALTER TABLE "StepSubmission" ALTER COLUMN "phase" SET NOT NULL;
ALTER TABLE "StepSubmission" ALTER COLUMN "sessionId" SET NOT NULL;

-- Drop legacy ProblemProgress columns moved to PracticeSession
ALTER TABLE "ProblemProgress"
    DROP COLUMN "attempts",
    DROP COLUMN "isTimerRunning",
    DROP COLUMN "lastPausedAt",
    DROP COLUMN "totalPausedSeconds";

-- Fix updatedAt nullability
UPDATE "ProblemProgress" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "ProblemProgress" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PracticeSession_userId_problemId_idx" ON "PracticeSession"("userId", "problemId");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_status_idx" ON "PracticeSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemProgress_activeSessionId_key" ON "ProblemProgress"("activeSessionId");

-- CreateIndex
CREATE INDEX "StepSubmission_sessionId_idx" ON "StepSubmission"("sessionId");

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemProgress" ADD CONSTRAINT "ProblemProgress_activeSessionId_fkey" FOREIGN KEY ("activeSessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepSubmission" ADD CONSTRAINT "StepSubmission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
