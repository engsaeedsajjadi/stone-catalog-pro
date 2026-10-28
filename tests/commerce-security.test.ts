import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  user: {
    id: "customer-user",
    email: "review@example.test",
    name: "Review",
    role: "CUSTOMER",
  },
  db: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    session: { create: vi.fn() },
    stone: { findMany: vi.fn(), findUnique: vi.fn() },
    stonePrice: { findMany: vi.fn() },
    customer: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    order: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    payment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    webhook: { findMany: vi.fn() },
    job: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  fetch: vi.fn(),
  drawText: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: async () => ({ allowed: true }),
}));
vi.mock("@/lib/auth", () => ({
  STAFF_ROLES: ["ADMIN", "SALES_MANAGER", "OPERATOR"],
  requireAuth: async () => ({ user: mocks.user }),
  setAuthCookies: vi.fn(),
}));
vi.mock("@/lib/otp", () => ({ verifyOtp: async () => true }));
vi.mock("pdf-lib", () => ({
  rgb: () => ({}),
  PDFDocument: {
    create: async () => ({
      registerFontkit() {},
      embedFont: async () => ({}),
      addPage: () => ({ drawText: mocks.drawText, drawImage() {} }),
      embedPng: async () => ({}),
      save: async () => new Uint8Array([37, 80, 68, 70]),
    }),
  },
}));
import { POST as checkout } from "@/app/api/checkout/route";
import { POST as paymentRequest } from "@/app/api/payments/zarinpal/request/route";
import { GET as callback } from "@/app/api/payments/zarinpal/callback/route";
import { GET as google } from "@/app/api/auth/google/callback/route";
import { POST as otp } from "@/app/api/auth/otp/verify/route";
import { GET as pdf } from "@/app/api/products/[id]/pdf/route";
import { createZarinpalPayment, toGatewayRials } from "@/lib/payments";
import {
  issuePaymentReceipt,
  verifyPaymentReceipt,
} from "@/lib/payment-receipt";
import { dispatchWebhook } from "@/lib/webhooks";
import { deliverQueuedWebhook } from "@/lib/webhook-delivery";
import { middleware } from "../middleware";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.role = "CUSTOMER";
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubEnv(
    "JWT_SECRET",
    "review-test-only-secret-with-at-least-32-characters",
  );
  vi.stubEnv("ZARINPAL_MERCHANT_ID", "test-merchant");
  vi.stubEnv(
    "PAYMENT_CALLBACK_URL",
    "https://catalog.example/api/payments/zarinpal/callback",
  );
  mocks.db.webhook.findMany.mockResolvedValue([]);
  mocks.db.stone.findMany.mockResolvedValue([{ id: "s1", name: "Stone" }]);
  mocks.db.stonePrice.findMany.mockResolvedValue([
    {
      stoneId: "s1",
      type: "PER_SQM",
      currency: "IRR",
      amount: 1_000_000,
      minQuantity: null,
    },
  ]);
  mocks.db.customer.findFirst.mockResolvedValue(null);
  mocks.db.customer.create.mockResolvedValue({ id: "c1" });
  mocks.db.order.create.mockImplementation(async ({ data }) => ({
    id: "o1",
    ...data,
  }));
  mocks.db.$transaction.mockImplementation(async (ops) => Promise.all(ops));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function orderRequest(discount = 0, unit = "SQM") {
  return new NextRequest("https://catalog.example/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { name: "Review customer", phone: "09123456789" },
      items: [{ stoneId: "s1", quantity: 1, unit, discount }],
      currency: "IRR",
    }),
  });
}
describe("server-priced checkout", () => {
  it("refuses a customer-supplied discount before writing any order", async () => {
    expect((await checkout(orderRequest(100))).status).toBe(403);
    expect(mocks.db.order.create).not.toHaveBeenCalled();
  });
  it("does not substitute a square-metre price for a slab price", async () => {
    expect((await checkout(orderRequest(0, "SLAB"))).status).toBe(400);
    expect(mocks.db.order.create).not.toHaveBeenCalled();
  });
  it("rejects zero-total orders even for a sales manager", async () => {
    mocks.user.role = "SALES_MANAGER";
    expect((await checkout(orderRequest(100))).status).toBe(400);
    expect(mocks.db.order.create).not.toHaveBeenCalled();
  });
  it("creates a positive order from the exact server price and binds its owner", async () => {
    expect((await checkout(orderRequest())).status).toBe(201);
    expect(mocks.db.order.create.mock.calls[0][0].data).toMatchObject({
      totalAmount: 1_000_000,
      assigneeId: "customer-user",
    });
  });
  it("does not overwrite another customer contact profile", async () => {
    mocks.db.customer.findFirst.mockResolvedValue({ id: "existing-customer" });
    expect((await checkout(orderRequest())).status).toBe(201);
    expect(mocks.db.customer.update).not.toHaveBeenCalled();
  });
});
describe("payment units and callback", () => {
  it.each([
    ["IRR", 1_000_000, 1_000_000],
    ["IRT", 100_000, 1_000_000],
  ])("sends %s as explicit whole rials", async (currency, amount, expected) => {
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { code: 100, authority: "test-authority" } }),
      ),
    );
    const result = await createZarinpalPayment(
      "o1",
      Number(amount),
      "https://catalog.example/callback",
      "Order",
      String(currency),
    );
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({
      amount: expected,
      currency: "IRR",
    });
    expect(result.gatewayAmount).toBe(expected);
  });
  it("refuses unsupported currencies and invalid amounts", () => {
    expect(() => toGatewayRials(100, "USD")).toThrow();
    expect(() => toGatewayRials(0, "IRR")).toThrow();
    expect(() => toGatewayRials(1.5, "IRR")).toThrow();
  });
  it("rejects a request for another customer’s order", async () => {
    mocks.db.order.findUnique.mockResolvedValue({
      id: "o1",
      assigneeId: "other-user",
    });
    const response = await paymentRequest(
      new NextRequest("https://catalog.example/api/payments/zarinpal/request", {
        method: "POST",
        body: JSON.stringify({ orderId: "o1" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("lets the gateway return without an authentication cookie", async () => {
    expect(
      (
        await middleware(
          new NextRequest(
            "https://catalog.example/api/payments/zarinpal/callback?Authority=test&Status=OK",
          ),
        )
      ).status,
    ).toBe(200);
  });
  it("verifies the stored gateway amount, writes both records, and redirects to a signed receipt", async () => {
    mocks.db.payment.findFirst.mockResolvedValue({
      id: "p1",
      orderId: "o1",
      amount: 100_000,
      currency: "IRT",
      gatewayAmount: 1_000_000,
      status: "PENDING",
    });
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { code: 100, ref_id: 123456 } })),
    );
    const response = await callback(
      new NextRequest(
        "https://catalog.example/api/payments/zarinpal/callback?Authority=test&Status=OK",
      ),
    );
    expect(response.status).toBe(307);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).amount).toBe(
      1_000_000,
    );
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
    const redirect = new URL(response.headers.get("location")!);
    expect(redirect.pathname).toBe("/payment/success");
    expect(verifyPaymentReceipt(redirect.searchParams.get("receipt")!)).toBe(
      "p1",
    );
  });
  it("cannot downgrade an already-paid record when callback is repeated", async () => {
    mocks.db.payment.findFirst.mockResolvedValue({
      id: "p1",
      orderId: "o1",
      status: "PAID",
    });
    expect(
      (
        await callback(
          new NextRequest(
            "https://catalog.example/api/payments/zarinpal/callback?Authority=test&Status=NOK",
          ),
        )
      ).status,
    ).toBe(307);
    expect(mocks.db.payment.updateMany).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("rejects forged or expired receipt URLs", () => {
    const token = issuePaymentReceipt("p1");
    expect(verifyPaymentReceipt(`${token}x`)).toBeNull();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 16 * 60 * 1000);
    expect(verifyPaymentReceipt(token)).toBeNull();
    vi.restoreAllMocks();
  });
});
describe("least-privilege sign in and exports", () => {
  it("does not create an operator from an unknown Google account", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test");
    vi.stubEnv(
      "GOOGLE_REDIRECT_URI",
      "https://catalog.example/api/auth/google/callback",
    );
    mocks.db.user.findUnique.mockResolvedValue(null);
    mocks.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "fixture" })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ email: "new@example.test", email_verified: true }),
        ),
      );
    expect(
      (
        await google(
          new NextRequest(
            "https://catalog.example/api/auth/google/callback?code=test&state=fixture",
            { headers: { cookie: "google_oauth_state=fixture" } },
          ),
        )
      ).status,
    ).toBe(403);
    expect(mocks.db.user.create).not.toHaveBeenCalled();
    expect(mocks.db.session.create).not.toHaveBeenCalled();
  });
  it("creates only a customer role for explicitly enabled OTP registration", async () => {
    vi.stubEnv("OTP_AUTO_CREATE", "1");
    mocks.db.user.findFirst.mockResolvedValue(null);
    mocks.db.user.create.mockImplementation(async ({ data }) => ({
      id: "new",
      isActive: true,
      ...data,
    }));
    mocks.db.session.create.mockResolvedValue({ id: "session-new" });
    const response = await otp(
      new NextRequest("https://catalog.example/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          target: "09123456789",
          channel: "SMS",
          code: "123456",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.db.user.create.mock.calls[0][0].data.role).toBe("CUSTOMER");
  });
  it("omits confidential prices from the public PDF even if an upstream record contains them", async () => {
    mocks.db.stone.findUnique.mockResolvedValue({
      id: "s1",
      code: "S1",
      name: "Review stone",
      category: { name: "Stone" },
      prices: [{ type: "PARTNER", currency: "IRR", amount: 7654321 }],
      images: [],
    });
    expect(
      (
        await pdf(new Request("https://catalog.example/api/products/s1/pdf"), {
          params: Promise.resolve({ id: "s1" }),
        })
      ).status,
    ).toBe(200);
    expect(
      mocks.drawText.mock.calls.some(
        ([text]) => text === "PARTNER / IRR" || text === "7,654,321",
      ),
    ).toBe(false);
    expect(
      mocks.db.stone.findUnique.mock.calls[0][0].include.prices.where.type.in,
    ).not.toContain("PARTNER");
  });
});
describe("webhook wire signature", () => {
  it("signs and transmits exactly the same bytes including occurredAt", async () => {
    mocks.db.webhook.findMany.mockResolvedValue([
      { url: "https://receiver.example", events: "*", secret: "test-only" },
    ]);
    await dispatchWebhook("order.created", { id: "o1" });
    const queued = JSON.parse(
      mocks.db.job.create.mock.calls[0][0].data.payload,
    );
    mocks.fetch.mockResolvedValue(new Response("{}"));
    await deliverQueuedWebhook(queued);
    const body = mocks.fetch.mock.calls[0][1].body;
    expect(typeof body).toBe("string");
    expect(JSON.parse(body).occurredAt).toBeTruthy();
    expect(createHmac("sha256", "test-only").update(body).digest("hex")).toBe(
      queued.headers["x-stone-signature"],
    );
  });
});
