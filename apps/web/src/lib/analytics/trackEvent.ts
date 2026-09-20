type TrackEventInput = {
  tool: string;
  event: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fires an anonymous usage event at the Scala API. Never carries file
 * bytes - only counts and small metadata (see docs/adr/0004-analytics-events.md).
 *
 * Deliberately fire-and-forget: analytics must never break the actual tool,
 * so failures are swallowed rather than surfaced to the user. Not unit
 * tested for the same reason `compressor.worker.ts` isn't - it's a thin,
 * side-effecting boundary (a real network call), verified manually/via E2E
 * instead of mocked.
 */
export function trackEvent({ tool, event, metadata = {} }: TrackEventInput): void {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

  fetch(`${apiBaseUrl}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, event, metadata }),
    // Keeps the request alive briefly even if the page is being unloaded
    // right after (e.g. a download_clicked event fired as the user
    // navigates away) - the modern replacement for navigator.sendBeacon.
    keepalive: true,
  }).catch(() => {
    // Swallow: analytics failures must never surface to the user.
  });
}
