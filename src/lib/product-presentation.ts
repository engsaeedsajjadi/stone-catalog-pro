import { getInventory } from "@/lib/stone-serialize";
export type DisplayPrice = {
  type: string;
  currency: string;
  amount: number;
  isActive?: boolean;
  validFrom?: string | Date;
  validUntil?: string | Date | null;
  minQuantity?: number | null;
};
export function isUsablePrice(price: DisplayPrice, now = Date.now()) {
  // Existing catalogues use 0 or 1 as placeholders, never present those as an offer.
  return (
    Number.isFinite(price.amount) &&
    price.amount > 1 &&
    price.isActive !== false &&
    (!price.validFrom || new Date(price.validFrom).getTime() <= now) &&
    (!price.validUntil || new Date(price.validUntil).getTime() > now)
  );
}
export function selectDisplayPrice(
  prices: DisplayPrice[] = [],
  currency = "IRR",
  type = "PER_SQM",
) {
  const candidates = prices.filter((p) => p.type === type && isUsablePrice(p));
  const exact = candidates.find((p) => p.currency === currency);
  if (exact) return exact;
  if (currency === "IRT" || currency === "IRR") {
    const other = candidates.find(
      (p) => p.currency === (currency === "IRT" ? "IRR" : "IRT"),
    );
    if (other)
      return {
        ...other,
        amount: other.amount * (currency === "IRT" ? 0.1 : 10),
        currency,
      };
  }
  return null;
}
export function priceLabel(price: { amount: number; currency: string } | null) {
  if (!price) return "نیاز به استعلام";
  const units: Record<string, string> = {
    IRR: "ریال",
    IRT: "تومان",
    USD: "دلار",
    EUR: "یورو",
    AED: "درهم",
    RUB: "روبل",
  };
  return `${price.amount.toLocaleString("fa-IR", { maximumFractionDigits: 2 })} ${units[price.currency] || price.currency}`;
}
export function inventorySummary(stone: unknown) {
  const inventory = getInventory(stone);
  if (!inventory)
    return { available: null, label: "استعلام موجودی", tone: "neutral" };
  const { totalSqm, availableSqm, reservedSqm = 0 } = inventory;
  const valid =
    [totalSqm, availableSqm, reservedSqm].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v >= 0,
    ) && availableSqm + reservedSqm <= totalSqm + 0.0001;
  if (!valid)
    return { available: null, label: "استعلام موجودی", tone: "neutral" };
  if (availableSqm > 0)
    return {
      available: availableSqm as number,
      label: "موجود",
      tone: "available",
    };
  if (inventory.inProductionSqm > 0)
    return { available: 0, label: "در حال تولید", tone: "production" };
  return { available: 0, label: "ناموجود", tone: "neutral" };
}
export function specValue(value: unknown, unit = "") {
  if (
    value == null ||
    value === "" ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    return "ثبت نشده";
  return `${value}${unit ? ` ${unit}` : ""}`;
}
export function dimensionsLabel(width: unknown, length: unknown) {
  return width != null && length != null && width !== "" && length !== ""
    ? `${width} × ${length} cm`
    : "ثبت نشده";
}
