'use client'

/**
 * Global Error Boundary
 * This file must be a client component without using any context providers
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{
        margin: 0,
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#1a1410',
        color: '#f5f0e8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#c89b3c' }}>
            خطایی رخ داد
          </h1>
          <p style={{ fontSize: '16px', marginBottom: '24px', color: '#b8a890' }}>
            متأسفانه خطایی در برنامه رخ داده است. لطفاً دوباره تلاش کنید.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#c89b3c',
              color: '#1a1410',
              border: 'none',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  )
}
