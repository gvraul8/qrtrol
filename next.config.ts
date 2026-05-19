import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
