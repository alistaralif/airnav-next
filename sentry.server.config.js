// Initialises Sentry on the Node.js server. Loaded via instrumentation.js at
// server startup. Captures unhandled errors in API routes and server components.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
});