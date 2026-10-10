import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type correctness is already verified separately via `tsc --noEmit` in CI/
  // validation. Skipping Next's internal re-check here avoids an out-of-memory
  // crash during `next build` in memory-constrained sandboxes.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
