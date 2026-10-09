ALTER TABLE "Shipment"
  ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'Parcel',
  ADD COLUMN "serviceType" TEXT NOT NULL DEFAULT 'Overnight',
  ADD COLUMN "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "pickupCity" TEXT,
  ADD COLUMN "pickupProfile" TEXT,
  ADD COLUMN "pickupName" TEXT,
  ADD COLUMN "pickupPhone" TEXT,
  ADD COLUMN "pickupEmail" TEXT,
  ADD COLUMN "pickupAddress" TEXT,
  ADD COLUMN "pickupAddressLine2" TEXT,
  ADD COLUMN "recipientEmail" TEXT,
  ADD COLUMN "googleAddress" TEXT,
  ADD COLUMN "specialInstruction" TEXT,
  ADD COLUMN "referenceNumber" TEXT,
  ADD COLUMN "orderId" TEXT,
  ADD COLUMN "weightKg" DECIMAL(10,3),
  ADD COLUMN "allowToOpen" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryCharges" DECIMAL(12,2),
  ADD COLUMN "totalCharges" DECIMAL(12,2),
  ADD COLUMN "fuelSurchargePercent" DECIMAL(6,2),
  ADD COLUMN "salesTax" DECIMAL(12,2),
  ADD COLUMN "netAmount" DECIMAL(12,2);

UPDATE "Shipment" SET "orderDate" = "createdAt";
UPDATE "Shipment" AS s
SET
  "pickupCity" = m."city",
  "pickupName" = m."contactName",
  "pickupPhone" = m."phone",
  "pickupAddress" = m."pickupAddress"
FROM "MerchantProfile" AS m
WHERE s."merchantId" = m."id";

CREATE INDEX "Shipment_merchantId_orderDate_idx" ON "Shipment"("merchantId", "orderDate");
