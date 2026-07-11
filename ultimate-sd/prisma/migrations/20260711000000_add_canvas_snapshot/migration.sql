-- V2 Canvas: add snapshot storage to ProblemProgress
-- Migration: 20260711000000_add_canvas_snapshot
-- Created: 2026-07-11

ALTER TABLE "ProblemProgress" ADD COLUMN "canvasSnapshot" JSONB;
ALTER TABLE "ProblemProgress" ADD COLUMN "canvasStage" INTEGER;
