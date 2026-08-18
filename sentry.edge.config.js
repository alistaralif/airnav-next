// Initialises Sentry on the Next.js Edge runtime (used by middleware).
// The Edge runtime is a constrained environment — not full Node.js.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
});
