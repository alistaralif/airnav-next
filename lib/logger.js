// Server-side structured logger. Emits newline-delimited JSON to stdout/stderr,
// which Fly.io captures via `fly logs`. Info-level output is suppressed in
// production to reduce noise; errors are always written to stderr.

const isDev = process.env.NODE_ENV === 'development';

// Serialises a log entry to JSON and writes it to the appropriate stream.
function log(level, message, context = {}) {
  const entry = JSON.stringify({ level, message, ...context, ts: new Date().toISOString() });
  if (level === 'error') {
    console.error(entry);
  } else if (isDev) {
    console.log(entry);
  }
}

// Exposes error() and info() methods. Callers pass a message string and an
// optional context object whose fields are spread into the JSON entry.
export const logger = {
  error: (message, context) => log('error', message, context),
  info: (message, context) => log('info', message, context),
};
