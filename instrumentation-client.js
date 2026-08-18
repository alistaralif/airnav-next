// Initialises Sentry in the browser. Loaded automatically by Next.js when the
// client bundle boots. Captures unhandled JS errors, React component crashes,
// and session replays on error.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  replaysOnErrorSampleRate: 1.0, // records a replay for every error
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,   // replays show real page text
      maskAllInputs: false, // and real typed input (password fields still masked)
    }),
  ],
});

// Records navigation spans for App Router client-side transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
