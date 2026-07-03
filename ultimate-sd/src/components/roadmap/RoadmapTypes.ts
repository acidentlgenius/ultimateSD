import React from 'react';

export type RoadmapStatus = 'locked' | 'unlocked' | 'in-progress' | 'completed';
export type RoadmapTrack = 'se' | 'sse' | 'mlops' | 'agentic-ai' | 'fresher';

export interface Resource {
    title: string;
    type: 'article' | 'video' | 'challenge' | 'widget';
    url?: string;
    duration?: string; // e.g., "15 min"
}

export interface RoadmapStep {
    id: string;
    title: string;
    description: string;
    problemId?: string; // Link to specific problem (e.g., '1', '84')
    problemSlug?: string; // Slug for the practice page URL
    track?: RoadmapTrack[]; // Specific tracks this step belongs to (if mixed)
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    status: RoadmapStatus;
    icon?: React.ComponentType<{ className?: string }>;
    resources?: Resource[];
}

export interface RoadmapPhase {
    id: string;
    title: string;
    description: string;
    steps: RoadmapStep[];
}

export interface TrackInfo {
    id: RoadmapTrack;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}
