import { z } from "zod";
export const inventoryValuesSchema = z
  .object({
    slabCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
    blockCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
    totalSqm: z.coerce.number().min(0).max(100_000_000).default(0),
    availableSqm: z.coerce.number().min(0).max(100_000_000).optional(),
    reservedSqm: z.coerce.number().min(0).max(100_000_000).default(0),
    inProductionSqm: z.coerce.number().min(0).max(100_000_000).default(0),
    warehouseCode: z.string().trim().min(1).max(32).default("MAIN"),
    warehouseName: z.string().trim().max(100).default("انبار مرکزی"),
    location: z.string().trim().max(200).nullish(),
  })
  .superRefine((data, context) => {
    if (
      data.reservedSqm > data.totalSqm ||
      (data.availableSqm ?? data.totalSqm - data.reservedSqm) +
        data.reservedSqm >
        data.totalSqm + 0.0001
    )
      context.addIssue({
        code: "custom",
        path: ["availableSqm"],
        message:
          "جمع موجودی قابل فروش و رزروشده نمی‌تواند از موجودی کل بیشتر باشد.",
      });
  })
  .transform((data) => ({
    ...data,
    availableSqm: data.availableSqm ?? data.totalSqm - data.reservedSqm,
  }));
export const priceValuesSchema = z.object({
  amount: z.coerce
    .number()
    .finite()
    .gt(
      1,
      "قیمت معتبر باید بیشتر از یک باشد؛ برای استعلام، قیمت را خالی بگذارید.",
    )
    .max(Number.MAX_SAFE_INTEGER),
  type: z.enum([
    "PER_SQM",
    "PER_SLAB",
    "DOMESTIC",
    "WHOLESALE",
    "PARTNER",
    "PROJECT",
    "EXPORT",
  ]),
  currency: z.enum(["IRR", "IRT", "USD", "EUR", "AED", "RUB"]),
  minQuantity: z.coerce.number().positive().nullish(),
  discount: z.coerce.number().min(0).lt(100).default(0),
  notes: z.string().max(1000).nullish(),
});
