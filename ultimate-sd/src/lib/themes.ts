import { LucideIcon, Link2, Youtube, Twitter, Box, Video, Share2, Search, Database } from 'lucide-react';

export interface ProblemTheme {
    slug: string;
    gradient: string;
    accent: string;
    icon: any; // LucideIcon type is tricky to export directly sometimes, using any for simplicity in registry
    heroPattern?: string;
}

export const PROBLEM_THEMES: Record<string, ProblemTheme> = {
    'design-tinyurl': {
        slug: 'design-tinyurl',
        gradient: 'from-blue-500 to-cyan-400',
        accent: 'bg-blue-500',
        icon: Link2
    },
    'design-youtube': {
        slug: 'design-youtube',
        gradient: 'from-red-600 to-rose-400',
        accent: 'bg-red-600',
        icon: Youtube
    },
    'design-twitter': {
        slug: 'design-twitter',
        gradient: 'from-sky-500 to-blue-400',
        accent: 'bg-sky-500',
        icon: Twitter
    },
    'design-instagram': {
        slug: 'design-instagram',
        gradient: 'from-fuchsia-600 via-pink-600 to-orange-500',
        accent: 'bg-pink-600',
        icon: Video
    },
    // Default fallback
    'default': {
        slug: 'default',
        gradient: 'from-indigo-500 to-purple-500',
        accent: 'bg-indigo-500',
        icon: Box
    }
};

export const getThemeForProblem = (slug: string): ProblemTheme => {
    return PROBLEM_THEMES[slug] || PROBLEM_THEMES['default'];
};
