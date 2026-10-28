import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { apiFetch } from "@/lib/api-fetch";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", {});
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());
describe("authenticated API retry", () => {
  it("shares one refresh for concurrent 401 responses and retries each request once", async () => {
    let privateCalls = 0;
    fetchMock.mockImplementation(async (input: string) => {
      if (input === "/api/auth/me")
        return new Response(JSON.stringify({ success: true, data: null }));
      if (input === "/api/auth/refresh") return new Response("{}");
      return new Response("{}", { status: ++privateCalls <= 2 ? 401 : 200 });
    });
    const responses = await Promise.all([
      apiFetch("/api/prices"),
      apiFetch("/api/customers"),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh"),
    ).toHaveLength(1);
    expect(privateCalls).toBe(4);
  });
  it("does not refresh or replay forbidden mutations", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 403 }));
    expect(
      (await apiFetch("/api/prices", { method: "PUT", body: "{}" })).status,
    ).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not retry an invalid login", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    expect(
      (await apiFetch("/api/auth/login", { method: "POST", body: "{}" }))
        .status,
    ).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
