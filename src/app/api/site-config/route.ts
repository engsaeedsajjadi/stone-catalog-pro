export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getSiteConfig,
  saveSiteConfig,
  type SiteConfig,
} from "@/lib/site-config";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const config = await getSiteConfig();

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("GET /api/site-config error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load site configuration",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = (await req.json()) as SiteConfig;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "پیکربندی نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    await saveSiteConfig(body);

    return NextResponse.json({
      success: true,
      data: body,
    });
  } catch (error) {
    console.error("PUT /api/site-config error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save site configuration",
      },
      {
        status: 400,
      }
    );
  }
}