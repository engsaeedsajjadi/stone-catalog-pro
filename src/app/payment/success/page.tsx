import Link from "next/link";
import { db } from "@/lib/db";
import { verifyPaymentReceipt } from "@/lib/payment-receipt";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "نتیجه پرداخت",
  robots: { index: false, follow: false },
};
export default async function PaymentResult({
  searchParams,
}: {
  searchParams: Promise<{ receipt?: string }>;
}) {
  const { receipt } = await searchParams;
  const id = verifyPaymentReceipt(receipt);
  const payment = id
    ? await db.payment.findUnique({
        where: { id },
        select: {
          status: true,
          gatewayTrackId: true,
          amount: true,
          currency: true,
          order: { select: { orderNumber: true } },
        },
      })
    : null;
  const paid = payment?.status === "PAID";
  return (
    <main className="container mx-auto max-w-xl px-4 py-20">
      <div className="rounded-2xl border bg-card p-8 text-center space-y-5">
        <h1 className="text-2xl font-bold">
          {paid ? "پرداخت شما تأیید شد" : "رسید معتبر در دسترس نیست"}
        </h1>
        {paid ? (
          <>
            <p>سفارش {payment.order.orderNumber}</p>
            <p>
              مبلغ: {payment.amount.toLocaleString("fa-IR")}{" "}
              {payment.currency === "IRR"
                ? "ریال"
                : payment.currency === "IRT"
                  ? "تومان"
                  : payment.currency}
            </p>
            <p>
              کد پیگیری: <bdi>{payment.gatewayTrackId || "—"}</bdi>
            </p>
          </>
        ) : (
          <p>
            اعتبار لینک رسید ۱۵ دقیقه است. برای پیگیری با پشتیبانی تماس بگیرید.
          </p>
        )}
        <Link
          className="inline-block rounded-lg bg-primary px-5 py-3 text-primary-foreground"
          href="/"
        >
          بازگشت به سایت
        </Link>
      </div>
    </main>
  );
}
