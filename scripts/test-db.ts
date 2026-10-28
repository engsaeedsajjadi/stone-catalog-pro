/** Exercises real Prisma queries in a disposable schema, never resets an existing database. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { hashPassword, issueAccessToken, hashToken } from "../src/lib/security";

async function main() {
  const base = process.env.DATABASE_URL;
  if (!base)
    throw new Error("DATABASE_URL is required for database regression tests.");
  const admin = new PrismaClient({ datasources: { db: { url: base } } });
  const schema = `regression_${randomUUID().replace(/-/g, "")}`;
  const url = new URL(base);
  url.searchParams.set("schema", schema);
  // The identifier is generated here, contains only [a-z0-9_], and is never user input.
  // migrate deploy creates the isolated schema before applying the migration chain.
  let testedDb: PrismaClient | undefined;
  try {
    process.env.DATABASE_URL = url.toString();
    process.env.REDIS_URL = "";
    process.env.JWT_SECRET =
      "isolated-regression-test-only-secret-32-characters";
    const migration = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { env: process.env, encoding: "utf8" },
    );
    assert.equal(migration.status, 0, migration.stderr || migration.stdout);
    const { db } = await import("../src/lib/db");
    testedDb = db;
    const { POST: login } = await import("../src/app/api/auth/login/route");
    const { POST: logout } = await import("../src/app/api/auth/logout/route");
    const { POST: refresh } = await import("../src/app/api/auth/refresh/route");
    const { GET: products } = await import("../src/app/api/products/route");
    const { GET: prices } = await import("../src/app/api/prices/route");
    const { PUT: inventory } = await import("../src/app/api/inventory/route");
    const {
      POST: inquiry,
      GET: inquiries,
      PATCH: updateInquiry,
    } = await import("../src/app/api/inquiries/route");
    const { POST: checkout } = await import("../src/app/api/checkout/route");
    const { getSiteConfig, saveSiteConfig, DEFAULT_SITE_CONFIG } = await import(
      "../src/lib/site-config"
    );
    const password = "Regression-test-only-123!";
    const staff = await db.user.create({
      data: {
        name: "Test manager",
        email: "manager@example.test",
        role: "ADMIN",
        password: await hashPassword(password),
      },
    });
    const customer = await db.user.create({
      data: {
        name: "Test customer",
        email: "customer@example.test",
        role: "CUSTOMER",
        password: await hashPassword(password),
      },
    });
    const category = await db.category.create({
      data: { name: "Test category", slug: "regression-category" },
    });
    const stone = await db.stone.create({
      data: {
        name: "Regression stone",
        code: "REG-1",
        categoryId: category.id,
        prices: {
          create: [
            { type: "PER_SQM", currency: "IRR", amount: 1_000_000 },
            { type: "PARTNER", currency: "IRR", amount: 500_000 },
          ],
        },
      },
    });
    const req = (path: string, body?: unknown, cookie?: string) =>
      new NextRequest(`http://localhost:3000${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const loginResponse = await login(
      req("/api/auth/login", { email: staff.email, password }),
    );
    assert.equal(loginResponse.status, 200);
    const access = loginResponse.cookies.get("stone_access")!.value;
    const refreshValue = loginResponse.cookies.get("stone_refresh")!.value;
    const staffCookie = `stone_access=${access}; stone_refresh=${refreshValue}`;
    const cs = await db.session.create({
      data: {
        userId: customer.id,
        tokenHash: hashToken("test-customer-refresh"),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const customerCookie = `stone_access=${issueAccessToken(customer, cs.id)}`;
    for (const cookie of [undefined, customerCookie]) {
      const data = await (
        await products(req("/api/products", undefined, cookie))
      ).json();
      assert.deepEqual(
        data.data[0].prices.map((p: { type: string }) => p.type),
        ["PER_SQM"],
      );
    }
    assert.equal(
      (await prices(req("/api/prices", undefined, customerCookie))).status,
      403,
    );
    assert.equal(
      (await prices(req("/api/prices", undefined, staffCookie))).status,
      200,
    );
    const badInventory = new NextRequest(
      "http://localhost:3000/api/inventory",
      {
        method: "PUT",
        headers: { cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          stoneId: stone.id,
          totalSqm: 100,
          availableSqm: 120,
        }),
      },
    );
    assert.equal((await inventory(badInventory)).status, 400);
    assert.equal(await db.inventory.count(), 0);
    const inquiryResponse = await inquiry(
      req("/api/inquiries", {
        stoneId: stone.id,
        customerName: "Regression customer",
        customerPhone: "۰۹۱۲۳۴۵۶۷۸۹",
      }),
    );
    assert.equal(inquiryResponse.status, 201);
    const receipt = (await inquiryResponse.json()).data.id;
    const stored = await db.inquiry.findUniqueOrThrow({
      where: { id: receipt },
    });
    assert.equal(stored.customerPhone, "09123456789");
    assert.equal(stored.status, "NEW");
    const queue = await (
      await inquiries(req("/api/inquiries", undefined, staffCookie))
    ).json();
    assert.ok(queue.data.some((item: { id: string }) => item.id === receipt));
    const changed = await updateInquiry(
      new NextRequest("http://localhost:3000/api/inquiries", {
        method: "PATCH",
        headers: { cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ id: receipt, status: "CONTACTED" }),
      }),
    );
    assert.equal(changed.status, 200);
    assert.equal(
      (await db.inquiry.findUniqueOrThrow({ where: { id: receipt } })).status,
      "CONTACTED",
    );
    const unpriced = await db.stone.create({
      data: {
        name: "Unpriced regression stone",
        code: "REG-2",
        categoryId: category.id,
        prices: { create: { type: "PER_SQM", currency: "IRR", amount: 1 } },
      },
    });
    const warehouse = await db.warehouse.create({
      data: { code: "MAIN", name: "Regression warehouse" },
    });
    await db.inventory.createMany({
      data: [
        {
          stoneId: stone.id,
          warehouseId: warehouse.id,
          totalSqm: 100,
          availableSqm: 80,
          reservedSqm: 20,
        },
        {
          stoneId: unpriced.id,
          warehouseId: warehouse.id,
          totalSqm: 100,
          availableSqm: 120,
        },
      ],
    });
    const available = await (
      await products(req("/api/products?instock=true"))
    ).json();
    assert.deepEqual(
      available.data.map((item: { id: string }) => item.id),
      [stone.id],
    );
    const sorted = await (
      await products(req("/api/products?sort=price-asc"))
    ).json();
    assert.equal(sorted.pagination.total, 2);
    assert.deepEqual(
      sorted.data.map((item: { id: string }) => item.id),
      [stone.id, unpriced.id],
    );
    const orderBody = {
      customer: { name: "Regression order", phone: "09123456789" },
      items: [{ stoneId: stone.id, quantity: 1, unit: "SLAB" }],
      currency: "IRR",
    };
    assert.equal(
      (await checkout(req("/api/checkout", orderBody, customerCookie))).status,
      400,
    );
    assert.equal(await db.order.count(), 0);
    const orderResponse = await checkout(
      req(
        "/api/checkout",
        {
          ...orderBody,
          items: [{ stoneId: stone.id, quantity: 2, unit: "SQM" }],
        },
        customerCookie,
      ),
    );
    assert.equal(orderResponse.status, 201);
    const order = await db.order.findFirstOrThrow();
    assert.equal(order.totalAmount, 2_000_000);
    assert.equal(order.assigneeId, customer.id);
    await saveSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      brand: { ...DEFAULT_SITE_CONFIG.brand, nameFa: "آزمون ذخیره تنظیمات" },
    });
    assert.equal((await getSiteConfig()).brand.nameFa, "آزمون ذخیره تنظیمات");
    // Expired/missing access cookies can recover using the refresh session.
    const renewed = await refresh(
      req("/api/auth/refresh", {}, `stone_refresh=${refreshValue}`),
    );
    assert.equal(renewed.status, 200);
    const currentAccess = renewed.cookies.get("stone_access")!.value;
    const currentRefresh = renewed.cookies.get("stone_refresh")!.value;
    assert.equal(
      (
        await logout(
          req(
            "/api/auth/logout",
            {},
            `stone_access=${currentAccess}; stone_refresh=${currentRefresh}`,
          ),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await prices(
          req("/api/prices", undefined, `stone_access=${currentAccess}`),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await refresh(
          req("/api/auth/refresh", {}, `stone_refresh=${currentRefresh}`),
        )
      ).status,
      401,
    );
    console.log(
      "Database regression passed: migrations, roles, prices, stock validation, inquiry persistence, checkout, site config, refresh and revocation.",
    );
  } finally {
    if (testedDb) await testedDb.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
    process.env.DATABASE_URL = base;
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
