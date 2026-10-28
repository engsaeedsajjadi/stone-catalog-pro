/** One refresh/retry for protected API requests; never retry a submitted mutation
 * unless the server explicitly returned 401 before performing the action. */
let refreshing: Promise<boolean> | null = null;
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    const renew = async () => {
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) =>
        r.json(),
      );
      if (me.success && me.data) return true;
      return (
        await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        })
      ).ok;
    };
    const operation = async (): Promise<boolean> => {
      if (typeof navigator !== "undefined" && navigator.locks)
        return Boolean(
          await navigator.locks.request("stone-session-refresh", renew),
        );
      return renew();
    };
    refreshing = operation()
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname
        : input.url;
  if (
    response.status !== 401 ||
    !url.startsWith("/api/") ||
    url.startsWith("/api/auth/")
  )
    return response;
  if (await refreshSession()) return fetch(input, init);
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("stone:session-expired"));
  return response;
}
