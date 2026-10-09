ALTER TABLE "Shipment" ADD COLUMN "carrierStatus" TEXT;
ALTER TABLE "TrackingEvent" ADD COLUMN "carrierStatus" TEXT;

CREATE INDEX "Shipment_merchantId_carrierStatus_idx" ON "Shipment"("merchantId", "carrierStatus");
