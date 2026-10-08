import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import {
  encryptShopifyToken,
  registerShopifyWebhooks,
  shopifyApiVersion,
  shopifyClientId,
  shopifyClientSecret,
  normalizeShopDomain,
  verifyShopifyOAuthHmac,
} from "@/lib/shopify";

type TokenResponse = { access_token?: string; scope?: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const shopDomain = normalizeShopDomain(url.searchParams.get("shop") || "");
  if (!code || !state || !shopDomain || !verifyShopifyOAuthHmac(url.searchParams, shopifyClientSecret())) {
    return NextResponse.json({ message: "Incomplete or invalid Shopify authorization response." }, { status: 400 });
  }

  const oauthState = await prisma.shopifyOAuthState.findUnique({ where: { stateHash: hashToken(state) } });
  if (!oauthState || oauthState.expiresAt < new Date() || oauthState.shopDomain !== shopDomain) {
    return NextResponse.json({ message: "Shopify authorization expired or is invalid." }, { status: 400 });
  }

  const tokenResponse = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: shopifyClientId(), client_secret: shopifyClientSecret(), code }),
  });
  if (!tokenResponse.ok) return NextResponse.json({ message: "Shopify token exchange failed." }, { status: 502 });
  const token = await tokenResponse.json() as TokenResponse;
  if (!token.access_token) return NextResponse.json({ message: "Shopify did not return an access token." }, { status: 502 });

  try {
    await registerShopifyWebhooks(shopDomain, token.access_token);
    await prisma.shopifyIntegration.upsert({
      where: { merchantId: oauthState.merchantId },
      create: {
        merchantId: oauthState.merchantId,
        shopDomain,
        accessToken: encryptShopifyToken(token.access_token),
        scopes: token.scope || "",
      },
      update: {
        shopDomain,
        accessToken: encryptShopifyToken(token.access_token),
        scopes: token.scope || "",
        uninstalledAt: null,
        installedAt: new Date(),
      },
    });
    await prisma.shopifyOAuthState.delete({ where: { id: oauthState.id } });
    return NextResponse.redirect(new URL("/account/integrations?shopify=connected", request.url));
  } catch (error) {
    console.error("Shopify installation failed:", error);
    return NextResponse.json({ message: `Shopify installation failed for API ${shopifyApiVersion()}.` }, { status: 502 });
  }
}
