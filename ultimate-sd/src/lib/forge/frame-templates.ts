import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { SystemDesignProblem } from '@/types';
import type { ForgeJourneyStep, SeniorityLevel } from './types';

export type FrameTemplateContext = {
  problem: SystemDesignProblem;
  step: ForgeJourneyStep;
  seniority: SeniorityLevel;
  yOffset: number;
  frameHeight: number;
  color: string;
  isGhost: boolean;
  starters: string[];
};

const CONTENT_LEFT = 24;
const ROW_HEIGHT = 32;

function textSkeleton(
  items: { x: number; y: number; text: string; fontSize?: number; color?: string; opacity?: number }[]
) {
  return convertToExcalidrawElements(
    items.map((item) => ({
      type: 'text' as const,
      x: item.x,
      y: item.y,
      text: item.text,
      fontSize: item.fontSize ?? 14,
      strokeColor: item.color ?? '#64748b',
      opacity: item.opacity ?? 100,
    })),
    { regenerateIds: true }
  );
}

function starterTable(
  headers: [string, string],
  rows: string[],
  ctx: FrameTemplateContext,
  yBase: number
): ExcalidrawElement[] {
  const opacity = ctx.isGhost ? 30 : 100;
  const header = textSkeleton([
    { x: CONTENT_LEFT, y: yBase, text: headers[0], fontSize: 12, color: ctx.color, opacity },
    { x: CONTENT_LEFT + 80, y: yBase, text: headers[1], fontSize: 12, color: ctx.color, opacity },
  ]);

  const rowsEls = rows.flatMap((text, index) => {
    const y = yBase + 24 + index * ROW_HEIGHT;
    return textSkeleton([
      { x: CONTENT_LEFT, y, text: index === 0 ? 'P0' : 'P1', fontSize: 13, color: ctx.color, opacity },
      { x: CONTENT_LEFT + 80, y, text, fontSize: 15, color: '#1e293b', opacity },
    ]);
  });

  return [...header, ...rowsEls];
}

function spawnFunctionalTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  return starterTable(['Priority', 'Requirement'], ctx.starters, ctx, ctx.yOffset + 88);
}

function spawnNfrTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const rows = ctx.starters.length > 0
    ? ctx.starters
    : ['Scale — concurrent users / QPS', 'Latency — p99 target', 'Availability — uptime %'];
  return starterTable(['Category', 'Target'], rows, ctx, ctx.yOffset + 88);
}

function spawnDataModelTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const opacity = ctx.isGhost ? 30 : 100;
  const entities = ctx.starters.length > 0
    ? ctx.starters.slice(0, 3)
    : ['User', 'CoreEntity', 'Event'];

  const boxes = entities.flatMap((name, index) => {
    const x = CONTENT_LEFT + index * 200;
    const y = ctx.yOffset + 100;
    return convertToExcalidrawElements(
      [
        {
          type: 'rectangle' as const,
          x,
          y,
          width: 160,
          height: 100,
          strokeColor: ctx.color,
          backgroundColor: `${ctx.color}10`,
          fillStyle: 'solid' as const,
          roundness: { type: 3 as const },
          opacity,
        },
        {
          type: 'text' as const,
          x: x + 12,
          y: y + 12,
          text: name,
          fontSize: 16,
          strokeColor: ctx.color,
          opacity,
        },
        {
          type: 'text' as const,
          x: x + 12,
          y: y + 36,
          text: 'id\n...fields',
          fontSize: 12,
          strokeColor: '#64748b',
          opacity,
        },
      ],
      { regenerateIds: true }
    );
  });

  return boxes;
}

function spawnApiTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const opacity = ctx.isGhost ? 30 : 100;
  const endpoints = ctx.starters.length > 0
    ? ctx.starters.slice(0, 2)
    : ['POST /v1/resource — create', 'GET /v1/resource/{id} — read'];

  return endpoints.flatMap((endpoint, index) => {
    const y = ctx.yOffset + 90 + index * 90;
    return convertToExcalidrawElements(
      [
        {
          type: 'rectangle' as const,
          x: CONTENT_LEFT,
          y,
          width: 560,
          height: 72,
          strokeColor: ctx.color,
          backgroundColor: `${ctx.color}08`,
          fillStyle: 'solid' as const,
          roundness: { type: 3 as const },
          opacity,
        },
        {
          type: 'text' as const,
          x: CONTENT_LEFT + 12,
          y: y + 12,
          text: endpoint,
          fontSize: 14,
          strokeColor: '#1e293b',
          opacity,
        },
        {
          type: 'text' as const,
          x: CONTENT_LEFT + 12,
          y: y + 36,
          text: 'Auth: · · ·   Errors: 400, 401, 429',
          fontSize: 11,
          strokeColor: '#94a3b8',
          opacity,
        },
      ],
      { regenerateIds: true }
    );
  });
}

function spawnArchitectureTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const opacity = ctx.isGhost ? 25 : 80;
  return textSkeleton([
    {
      x: CONTENT_LEFT,
      y: ctx.yOffset + 90,
      text: 'Draw your architecture here — clients, LB, services, cache, DB, queues.',
      fontSize: 14,
      color: '#94a3b8',
      opacity,
    },
    {
      x: CONTENT_LEFT,
      y: ctx.yOffset + 120,
      text: 'Tip: use boxes + arrows. Label hot paths and failure domains.',
      fontSize: 12,
      color: '#94a3b8',
      opacity: opacity - 10,
    },
  ]);
}

function spawnTradeoffsTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const opacity = ctx.isGhost ? 30 : 100;
  return textSkeleton([
    { x: CONTENT_LEFT, y: ctx.yOffset + 90, text: 'Decision:', fontSize: 13, color: ctx.color, opacity },
    { x: CONTENT_LEFT, y: ctx.yOffset + 118, text: 'Chose: _______________', fontSize: 14, opacity },
    { x: CONTENT_LEFT, y: ctx.yOffset + 152, text: 'Over: _______________', fontSize: 14, opacity },
    { x: CONTENT_LEFT, y: ctx.yOffset + 186, text: 'Because: _______________', fontSize: 14, opacity },
  ]);
}

function normalizeSubStep(subStep: string): string {
  return subStep.toLowerCase().replace(/[\s_-]+/g, '-');
}

/** Interior frame content matched to the step type. */
export function spawnFrameTemplate(ctx: FrameTemplateContext): ExcalidrawElement[] {
  const kind = normalizeSubStep(ctx.step.subStep);

  if (kind.includes('functional') || kind === 'core' || kind === 'features') {
    return spawnFunctionalTemplate(ctx);
  }
  if (kind.includes('non-functional') || kind.includes('scale') || kind.includes('constraint')) {
    return spawnNfrTemplate(ctx);
  }
  if (kind.includes('data-model') || kind.includes('schema') || kind.includes('metadata')) {
    return spawnDataModelTemplate(ctx);
  }
  if (kind === 'api') {
    return spawnApiTemplate(ctx);
  }
  if (kind.includes('architecture') || kind.includes('hld') || kind.includes('diagram') || kind.includes('high-level')) {
    return spawnArchitectureTemplate(ctx);
  }
  if (kind.includes('decision') || kind.includes('bottleneck') || kind.includes('trade')) {
    return spawnTradeoffsTemplate(ctx);
  }

  return starterTable(['Note', 'Detail'], ctx.starters, ctx, ctx.yOffset + 88);
}

export function getFrameHeightForStep(subStep: string): number {
  const kind = normalizeSubStep(subStep);
  if (kind.includes('architecture') || kind.includes('hld') || kind.includes('diagram')) {
    return 520;
  }
  if (kind === 'api') {
    return 420;
  }
  return 380;
}
