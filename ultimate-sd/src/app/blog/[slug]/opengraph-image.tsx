import { ImageResponse } from 'next/og';
import { getBlogPostBySlug } from '@/lib/blog-posts';

export const alt = 'Ultimate SD blog post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const title = post?.title ?? 'Ultimate SD Blog';

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
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.9 }}>Ultimate SD · Blog</span>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 980,
          }}
        >
          {title}
        </div>
      </div>
    ),
    { ...size }
  );
}
