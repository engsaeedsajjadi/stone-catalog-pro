export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  REFRESH_TTL_MS,
} from "@/lib/security";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("stone_refresh")?.value;
  const reject = () => {
    const response = NextResponse.json(
      { success: false, error: "نشست منقضی شده است؛ دوباره وارد شوید." },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  };
  if (!refresh) return reject();
  const tokenHash = hashToken(refresh);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.isActive
  )
    return reject();
  const nextRefresh = issueRefreshToken();
  // Compare-and-swap permits only one use of a refresh token. Keep the session ID
  // so in-flight requests remain valid while the browser rotates its cookies.
  const claimed = await db.session.updateMany({
    where: {
      id: session.id,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      tokenHash: hashToken(nextRefresh),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  if (!claimed.count) return reject();
  const { id, email, name, role, phone } = session.user;
  const response = NextResponse.json({
    success: true,
    data: { id, email, name, role, phone },
  });
  await setAuthCookies(
    response,
    issueAccessToken(session.user, session.id),
    nextRefresh,
  );
  return response;
}
