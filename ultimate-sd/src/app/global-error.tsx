'use client';

// Catches errors thrown by the root layout itself. Must render its own
// <html>/<body> because the layout is gone; keep dependencies minimal —
// anything imported here can itself be the thing that crashed.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0, background: '#0a0a0a', color: '#fafafa' }}>
                <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '28rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
                    <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
                        The app hit an unexpected error. Your progress is saved — reloading is safe.
                    </p>
                    {error.digest && (
                        <p style={{ opacity: 0.4, fontSize: '0.75rem', marginBottom: '1.5rem' }}>Error ID: {error.digest}</p>
                    )}
                    <button
                        onClick={reset}
                        style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: 'none', background: '#fafafa', color: '#0a0a0a', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Reload
                    </button>
                </div>
            </body>
        </html>
    );
}
