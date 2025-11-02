// Central design tokens for the UI revamp (used by scripts/components where helpful)
export const tokens = {
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    '2xl': '3rem', // 48px
  },
  radius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
  },
  type: {
    xs: '0.75rem',  // 12px
    sm: '0.875rem', // 14px
    md: '1rem',     // 16px
    lg: '1.25rem',  // 20px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
  },
  colors: {
    primary: 'var(--color-primary)',
    background: 'var(--color-background)',
    foreground: 'var(--color-foreground)',
    ring: 'var(--color-ring)',
    // Phase-specific colors
    phase: {
      requirements: '#3b82f6', // blue
      hld: '#10b981',         // emerald
      lld: '#f59e0b',         // amber
      tradeoffs: '#ef4444',   // red
      scalability: '#8b5cf6', // violet
      feedback: '#06b6d4',    // cyan
    },
    // Difficulty colors
    difficulty: {
      easy: '#10b981',    // green
      medium: '#f59e0b',  // yellow
      hard: '#ef4444',    // red
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

export default tokens;
