import { ImageResponse } from 'next/og';
import { getGuideBySlug } from '@/content/guides';

export const runtime = 'edge';

export const alt = 'System design interview guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  const title = guide?.metadata.title ?? 'System Design Interview Guide';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
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
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>Ultimate SD · Guides</span>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 980,
            marginBottom: 24,
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 30, lineHeight: 1.4, color: '#cbd5e1', maxWidth: 860, marginBottom: 40 }}>
          Step-by-step interview guide with interactive simulations
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Free guide', 'Interactive', 'AI practice'].map((tag) => (
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
