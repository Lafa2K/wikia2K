/**
 * Ponto único de relato de erros do lado do cliente (React error boundary).
 * Hoje só loga no console; quando o site for publicado de verdade, é aqui que
 * entra o Sentry (ou similar) — troca o console.error por Sentry.captureException.
 */
export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[erro não tratado]", message, {
    route: window.location.pathname,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
