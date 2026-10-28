export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken, verifyAccessToken } from "@/lib/security";
import { clearAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("stone_refresh")?.value;
  const access = req.cookies.get("stone_access")?.value;
  const claims = access ? verifyAccessToken(access) : null;
  const conditions: Array<
    { tokenHash: string } | { id: string; userId: string }
  > = [];
  if (refresh) conditions.push({ tokenHash: hashToken(refresh) });
  if (claims) conditions.push({ id: claims.sid, userId: claims.sub });
  if (conditions.length) {
    await db.session.updateMany({
      where: { OR: conditions, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
