import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Always inline a literal so the window.__eruja test seam is statically
  // dead-code-eliminated in real prod builds (default '0'); the e2e build sets '1'.
  env: {
    NEXT_PUBLIC_E2E: process.env.NEXT_PUBLIC_E2E ?? '0',
  },
};

export default nextConfig;
