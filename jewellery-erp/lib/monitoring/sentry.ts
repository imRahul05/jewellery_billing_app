/**
 * Production-grade lightweight error tracking and monitoring helper.
 * Simulates Sentry/Logtail hook reporting by logging structured details
 * to stderr in development/CI, and is ready to hook into a centralized platform.
 */

export interface ErrorReportMetadata {
  userId?: string | null;
  tenantId?: string | null;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function reportError(error: unknown, metadata?: ErrorReportMetadata): void {
  const isDev = process.env.NODE_ENV === "development";
  const isTest = process.env.NODE_ENV === "test";

  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : "UnknownError",
    timestamp: new Date().toISOString(),
    userId: metadata?.userId || "system",
    tenantId: metadata?.tenantId || "system",
    tags: metadata?.tags || {},
    extra: metadata?.extra || {},
  };

  if (isDev || isTest) {
    // Standard structured formatting for local development and vitest logs
    console.error(`[Monitoring Report] [${errorDetails.name}]:`, JSON.stringify(errorDetails, null, 2));
  } else {
    // In production, we send the structured payload to our centralized log collector
    // e.g. Sentry.captureException(error, { extra: errorDetails }) or console.error in structured JSON
    console.error(JSON.stringify({ severity: "ERROR", ...errorDetails }));
  }
}

/**
 * Capture performance metric durations (e.g. database execution, API latency).
 */
export function capturePerformanceMetric(
  metricName: string,
  durationMs: number,
  tags?: Record<string, string>
): void {
  if (process.env.NODE_ENV === "production") {
    console.log(
      JSON.stringify({
        severity: "INFO",
        message: `Performance metric: ${metricName}`,
        metricName,
        durationMs,
        tags: tags || {},
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    console.log(`[Performance Metric] ${metricName}: ${durationMs}ms`, tags || "");
  }
}
