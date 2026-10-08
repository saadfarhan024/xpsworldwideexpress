import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { normalizeShopDomain, requiredScopes, shopifyClientId, shopifyRedirectUri } from "@/lib/shopify";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const input = new URL(request.url).searchParams.get("shop");
  const shopDomain = input ? normalizeShopDomain(input) : null;
  if (!shopDomain) return NextResponse.json({ message: "Enter a valid *.myshopify.com store domain." }, { status: 400 });

  const state = createToken();
  await prisma.shopifyOAuthState.deleteMany({ where: { merchantId: user.merchantProfile.id } });
  await prisma.shopifyOAuthState.create({
    data: {
      merchantId: user.merchantProfile.id,
      stateHash: hashToken(state),
      shopDomain,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const authorizeUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", shopifyClientId());
  authorizeUrl.searchParams.set("scope", requiredScopes().join(","));
  authorizeUrl.searchParams.set("redirect_uri", shopifyRedirectUri());
  authorizeUrl.searchParams.set("state", state);
  return NextResponse.redirect(authorizeUrl);
}
