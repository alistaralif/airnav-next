import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  silent: true,         // suppresses Sentry build output
  hideSourceMaps: true, // keeps source maps out of the client bundle (uploaded to Sentry instead)
  disableLogger: true,  // tree-shakes Sentry's debug logger in production
});
