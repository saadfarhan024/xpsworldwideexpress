CREATE TABLE "PickupProfile" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "shipperName" TEXT NOT NULL,
    "shipperPhone" TEXT NOT NULL,
    "shipperEmail" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "shipperAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupProfile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PickupProfile_merchantId_createdAt_idx" ON "PickupProfile"("merchantId", "createdAt");

ALTER TABLE "PickupProfile" ADD CONSTRAINT "PickupProfile_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
