import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  session: { findFirst: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: mocks }));
import { getCurrentUser, getViewer } from "@/lib/auth";
import { issueAccessToken, verifyAccessToken, hashToken } from "@/lib/security";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as refresh } from "@/app/api/auth/refresh/route";
const user = {
  id: "u1",
  name: "Review user",
  email: "review@example.test",
  role: "ADMIN",
  isActive: true,
  phone: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("JWT_SECRET", "test-only-secret-must-be-at-least-32-characters");
});
describe("revocable server sessions", () => {
  it("binds access JWTs to a specific session and rejects tampering", () => {
    const token = issueAccessToken(user, "s1");
    expect(verifyAccessToken(token)?.sid).toBe("s1");
    expect(verifyAccessToken(`${token}tampered`)).toBeNull();
  });
  it("rejects a saved access token after logout revokes its session", async () => {
    const access = issueAccessToken(user, "s1");
    mocks.session.updateMany.mockResolvedValue({ count: 1 });
    const response = await logout(
      new NextRequest("https://catalog.example/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: `stone_access=${access}; stone_refresh=refresh-fixture`,
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.session.updateMany.mock.calls[0][0].where.OR).toContainEqual({
      id: "s1",
      userId: "u1",
    });
    expect(response.cookies.get("stone_access")?.value).toBe("");
    mocks.session.findFirst.mockResolvedValue(null);
    const req = new NextRequest("https://catalog.example/api/auth/me", {
      headers: { cookie: `stone_access=${access}` },
    });
    expect(await getCurrentUser(req)).toBeNull();
    expect(mocks.session.findFirst.mock.calls[0][0].where).toMatchObject({
      id: "s1",
      userId: "u1",
      revokedAt: null,
    });
  });
  it("uses current database roles for trade price access", async () => {
    mocks.session.findFirst.mockResolvedValue({
      user: { ...user, role: "CUSTOMER" },
    });
    const req = new NextRequest("https://catalog.example/api/products", {
      headers: { cookie: `stone_access=${issueAccessToken(user, "s1")}` },
    });
    expect(await getViewer(req)).toMatchObject({
      isAuthenticated: true,
      role: "CUSTOMER",
      canViewTradePrices: false,
    });
  });
  it("rotates the refresh token atomically without invalidating in-flight access", async () => {
    mocks.session.findUnique.mockResolvedValue({
      id: "s1",
      userId: "u1",
      user,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
    });
    mocks.session.updateMany.mockResolvedValue({ count: 1 });
    const response = await refresh(
      new NextRequest("https://catalog.example/api/auth/refresh", {
        method: "POST",
        headers: { cookie: "stone_refresh=fixture" },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.session.updateMany.mock.calls[0][0].where).toMatchObject({
      id: "s1",
      tokenHash: hashToken("fixture"),
      revokedAt: null,
    });
    expect(
      verifyAccessToken(response.cookies.get("stone_access")!.value)?.sid,
    ).toBe("s1");
    expect(response.cookies.get("stone_refresh")!.value).not.toBe("fixture");
  });
  it("rejects refresh token reuse when compare-and-swap loses", async () => {
    mocks.session.findUnique.mockResolvedValue({
      id: "s1",
      userId: "u1",
      user,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
    });
    mocks.session.updateMany.mockResolvedValue({ count: 0 });
    const response = await refresh(
      new NextRequest("https://catalog.example/api/auth/refresh", {
        method: "POST",
        headers: { cookie: "stone_refresh=used-fixture" },
      }),
    );
    expect(response.status).toBe(401);
    expect(response.cookies.get("stone_access")?.value).toBe("");
  });
});
