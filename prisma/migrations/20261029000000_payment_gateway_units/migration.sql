-- Nullable fields preserve the exact request units for existing pending payments.
ALTER TABLE "Payment" ADD COLUMN "gatewayAmount" DOUBLE PRECISION;
ALTER TABLE "Payment" ADD COLUMN "gatewayCurrency" TEXT;
