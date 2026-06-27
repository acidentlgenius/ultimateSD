import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Ultimate SD — AI System Design Practice';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            SD
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>
            Ultimate SD
          </span>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Master Systems That Scale
        </div>

        <div
          style={{
            fontSize: 32,
            lineHeight: 1.4,
            color: '#cbd5e1',
            maxWidth: 820,
            marginBottom: 40,
          }}
        >
          Interactive simulations, 86+ problems, and AI-guided system design practice
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Flash Sales', 'Secret Vault', 'GraphQL', 'AI Feedback'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: 22,
                color: '#e2e8f0',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
