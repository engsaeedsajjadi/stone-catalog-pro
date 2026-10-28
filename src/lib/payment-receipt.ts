import { createHmac, timingSafeEqual } from "node:crypto";
function signature(body: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret)
    .update(`payment-receipt:${body}`)
    .digest("base64url");
}
export function issuePaymentReceipt(paymentId: string) {
  const body = Buffer.from(
    JSON.stringify({ id: paymentId, exp: Date.now() + 15 * 60 * 1000 }),
  ).toString("base64url");
  return `${body}.${signature(body)}`;
}
export function verifyPaymentReceipt(token?: string): string | null {
  if (!token || token.length > 2048) return null;
  try {
    const [body, sig, extra] = token.split(".");
    if (!body || !sig || extra) return null;
    const expected = Buffer.from(signature(body));
    const received = Buffer.from(sig);
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    )
      return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof data.id === "string" && data.exp > Date.now()
      ? data.id
      : null;
  } catch {
    return null;
  }
}
