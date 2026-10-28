import { describe, it, expect } from "vitest";
import {
  inventorySummary,
  selectDisplayPrice,
  priceLabel,
  specValue,
  dimensionsLabel,
} from "@/lib/product-presentation";
import {
  inventoryValuesSchema,
  priceValuesSchema,
} from "@/lib/catalog-validation";
import { normalizeSocialLink } from "@/lib/social-links";
import { normalizePhone } from "@/lib/phone";

describe("honest product information", () => {
  it("does not advertise zero stock or inconsistent stock as available", () => {
    expect(
      inventorySummary({
        status: "AVAILABLE",
        inventory: { totalSqm: 0, availableSqm: 0, reservedSqm: 0 },
      }).label,
    ).toBe("ناموجود");
    expect(
      inventorySummary({
        inventory: { totalSqm: 1500, availableSqm: 2000, reservedSqm: 0 },
      }).available,
    ).toBeNull();
    expect(inventorySummary({ inventory: null }).available).toBeNull();
    expect(
      inventorySummary({
        inventory: { totalSqm: 100, availableSqm: 90, reservedSqm: 10 },
      }).available,
    ).toBe(90);
  });
  it("shows placeholders for unknown specifications while keeping measured zero", () => {
    expect(specValue(null, "kg")).toBe("ثبت نشده");
    expect(specValue(0, "%")).toBe("0 %");
    expect(dimensionsLabel(null, null)).toBe("ثبت نشده");
    expect(dimensionsLabel(200, 300)).toBe("200 × 300 cm");
  });
  it("never invents currency conversion or presents sentinel prices as an offer", () => {
    const prices = [{ type: "PER_SQM", currency: "IRR", amount: 1_000_000 }];
    expect(selectDisplayPrice(prices, "IRT")?.amount).toBe(100_000);
    expect(selectDisplayPrice(prices, "USD")).toBeNull();
    expect(
      selectDisplayPrice([{ type: "PER_SQM", currency: "IRR", amount: 1 }]),
    ).toBeNull();
    expect(priceLabel(null)).toBe("نیاز به استعلام");
    expect(
      selectDisplayPrice(
        [...prices, { type: "PER_SQM", currency: "USD", amount: 25 }],
        "USD",
      )?.amount,
    ).toBe(25);
  });
  it("does not show future or expired prices", () => {
    expect(
      selectDisplayPrice([
        {
          type: "PER_SQM",
          currency: "IRR",
          amount: 10000,
          validUntil: "2000-01-01",
        },
      ]),
    ).toBeNull();
    expect(
      selectDisplayPrice([
        {
          type: "PER_SQM",
          currency: "IRR",
          amount: 10000,
          validFrom: "2100-01-01",
        },
      ]),
    ).toBeNull();
  });
});
describe("catalog validation", () => {
  it("rejects inventory exceeding the total and computes available stock after reservations", () => {
    expect(
      inventoryValuesSchema.safeParse({
        totalSqm: 100,
        availableSqm: 90,
        reservedSqm: 20,
      }).success,
    ).toBe(false);
    expect(
      inventoryValuesSchema.safeParse({ totalSqm: 100, reservedSqm: 110 })
        .success,
    ).toBe(false);
    expect(
      inventoryValuesSchema.parse({ totalSqm: 100, reservedSqm: 20 })
        .availableSqm,
    ).toBe(80);
  });
  it.each([0, -1, 1, NaN, Infinity])("rejects invalid price %s", (amount) => {
    expect(
      priceValuesSchema.safeParse({ type: "PER_SQM", currency: "IRR", amount })
        .success,
    ).toBe(false);
  });
  it("normalizes Persian phone numbers and social handles without accepting script URLs", () => {
    expect(normalizePhone("۰۹۱۲ ۳۴۵ ۶۷۸۹")).toBe("09123456789");
    expect(normalizePhone("+989123456789")).toBe("09123456789");
    expect(normalizeSocialLink("whatsapp", "09370097200")).toBe(
      "https://wa.me/989370097200",
    );
    expect(normalizeSocialLink("instagram", "azhand_sang")).toBe(
      "https://www.instagram.com/azhand_sang",
    );
    expect(normalizeSocialLink("telegram", "t.me/azhandsang")).toBe(
      "https://t.me/azhandsang",
    );
    expect(normalizeSocialLink("instagram", "javascript:alert(1)")).toBeNull();
  });
});
