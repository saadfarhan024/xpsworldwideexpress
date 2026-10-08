CREATE TABLE "ShopifyIntegration" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopifyOAuthState" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopifyOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyIntegration_merchantId_key" ON "ShopifyIntegration"("merchantId");
CREATE UNIQUE INDEX "ShopifyIntegration_shopDomain_key" ON "ShopifyIntegration"("shopDomain");
CREATE UNIQUE INDEX "ShopifyOAuthState_stateHash_key" ON "ShopifyOAuthState"("stateHash");
CREATE INDEX "ShopifyIntegration_shopDomain_uninstalledAt_idx" ON "ShopifyIntegration"("shopDomain", "uninstalledAt");
CREATE INDEX "ShopifyOAuthState_merchantId_expiresAt_idx" ON "ShopifyOAuthState"("merchantId", "expiresAt");

ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyOAuthState" ADD CONSTRAINT "ShopifyOAuthState_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
