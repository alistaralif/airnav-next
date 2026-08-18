import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  silent: true,         // suppresses Sentry build output
  hideSourceMaps: true, // keeps source maps out of the client bundle (uploaded to Sentry instead)
  webpack: {
    treeshake: {
      removeDebugLogging: true, // strips Sentry's internal debug statements from the bundle
    },
  },
});
