import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    if (!isDev) return []
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' wss: https:",
              "worker-src 'self' blob:",
              "font-src 'self' data:",
            ].join('; '),
          },
        ],
      },
    ]
  },
  // Disable streaming metadata for all user agents.
  // Next.js 16 intentionally renders MetadataWrapper differently between
  // server (style:display:contents) and client (hidden), but omits
  // suppressHydrationWarning on that internal div, causing hydration errors.
  // Setting this to /.+/ forces the non-streaming code path (no div wrapper)
  // on every request, which keeps server and client output identical.
  htmlLimitedBots: /.+/,
};

export default nextConfig;
