export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { db } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  stoneId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default("SQM"),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

const schema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(5),

    email: z
      .string()
      .email()
      .optional()
      .or(z.literal("")),

    country: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),

  items: z.array(itemSchema).min(1),

  currency: z.string().default("IRR"),

  paymentMethod: z.string().optional(),
});

export async function POST(
  req: NextRequest
) {
  try {
    const body = schema.parse(
      await req.json()
    );

    /* -----------------------------------------
     * بررسی محصولات
     * --------------------------------------- */

    const ids = [
      ...new Set(
        body.items.map(
          (item) => item.stoneId
        )
      ),
    ];

    const stones =
      await db.stone.findMany({
        where: {
          id: {
            in: ids,
          },
        },

        select: {
          id: true,
        },
      });

    if (stones.length !== ids.length) {
      throw new Error(
        "یکی از محصولات موجود نیست"
      );
    }

    /* -----------------------------------------
     * پیدا کردن / ایجاد مشتری
     *
     * phone unique نیست، بنابراین upsert
     * استفاده نمی‌کنیم.
     * --------------------------------------- */

    let customer =
      await db.customer.findFirst({
        where: {
          phone: body.customer.phone,
        },
      });

    if (customer) {
      customer =
        await db.customer.update({
          where: {
            id: customer.id,
          },

          data: {
            name: body.customer.name,

            email:
              body.customer.email ||
              undefined,

            country:
              body.customer.country,

            city:
              body.customer.city,

            address:
              body.customer.address,
          },
        });
    } else {
      customer =
        await db.customer.create({
          data: {
            name: body.customer.name,

            phone:
              body.customer.phone,

            email:
              body.customer.email ||
              undefined,

            country:
              body.customer.country,

            city:
              body.customer.city,

            address:
              body.customer.address,
          },
        });
    }

    /* -----------------------------------------
     * محاسبه مبلغ
     * --------------------------------------- */

    const subtotal =
      body.items.reduce(
        (sum, item) => {
          const gross =
            item.quantity *
            item.unitPrice;

          const discountAmount =
            gross *
            (item.discount / 100);

          return (
            sum +
            (gross -
              discountAmount)
          );
        },
        0
      );

    /* -----------------------------------------
     * ایجاد سفارش
     * --------------------------------------- */

    const order =
      await db.order.create({
        data: {
          orderNumber:
            `ORD-${Date.now()}`,

          customerId:
            customer.id,

          totalAmount:
            subtotal,

          currency:
            body.currency,

          paymentMethod:
            body.paymentMethod,

          items: {
            create:
              body.items.map(
                (item) => ({
                  stoneId:
                    item.stoneId,

                  quantity:
                    item.quantity,

                  unit:
                    item.unit,

                  unitPrice:
                    item.unitPrice,

                  discount:
                    item.discount,

                  notes:
                    item.notes,

                  total:
                    item.quantity *
                    item.unitPrice *
                    (1 -
                      item.discount /
                        100),

                  currency:
                    body.currency,
                })
              ),
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Checkout error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Checkout failed",
      },
      {
        status: 400,
      }
    );
  }
}