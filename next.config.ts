import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright and @sparticuz/chromium must NOT be bundled by Next.js —
  // they rely on __dirname / file-system binary detection that breaks
  // inside a webpack bundle. Marking them external keeps them as
  // runtime require() calls from node_modules.
  serverExternalPackages: ['playwright', 'playwright-core', '@sparticuz/chromium'],
};

export default nextConfig;
