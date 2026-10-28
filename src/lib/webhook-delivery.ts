import { checkSafeOutboundUrl } from "@/lib/url-safety";
export type QueuedWebhook = {
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
};
/** Do not JSON.stringify an already serialized body: signatures cover its exact bytes. */
export async function deliverQueuedWebhook(payload: QueuedWebhook) {
  const safety = checkSafeOutboundUrl(payload.url);
  if (!safety.ok) throw new Error(`آدرس مقصد مجاز نیست: ${safety.reason}`);
  const response = await fetch(safety.url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(payload.headers || {}) },
    body:
      typeof payload.body === "string"
        ? payload.body
        : JSON.stringify(payload.body ?? {}),
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Job failed with status ${response.status}`);
}
