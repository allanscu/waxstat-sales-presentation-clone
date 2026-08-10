import type { NextConfig } from 'next';
import pkg from './package.json';

// Build-time version string for the footer badge. The real thing also folds in
// the git SHA and build time; package.json alone is enough to show the shape.

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${pkg.version}`,
  },
  // Prospect logos and screenshots are arbitrary third-party URLs, so they are
  // rendered with plain <img> tags rather than next/image.
};

export default nextConfig;
