// Pluggable error reporter. Today: structured console.error.
// To enable Sentry: `npm i @sentry/nextjs`, run `npx @sentry/wizard@latest -i nextjs`,
// then replace this body with `Sentry.captureException(err, { extra: context });`.

export function reportError(err: unknown, context: Record<string, unknown> = {}) {
  const payload = {
    level: "error",
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(payload));
}
