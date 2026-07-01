-- Drop legacy sessionState column from ProblemProgress
ALTER TABLE "ProblemProgress" DROP COLUMN IF EXISTS "sessionState";
