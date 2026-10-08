import { createHmac, timingSafeEqual } from "node:crypto";
import { decryptField, encryptField } from "@/lib/auth/crypto";

const DEFAULT_API_VERSION = "2026-10";

export function shopifyApiVersion() {
  return process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION;
}

export function shopifyClientId() {
  const value = process.env.SHOPIFY_API_KEY?.trim();
  if (!value) throw new Error("SHOPIFY_API_KEY is not configured.");
  return value;
}

export function shopifyClientSecret() {
  const value = process.env.SHOPIFY_API_SECRET?.trim();
  if (!value) throw new Error("SHOPIFY_API_SECRET is not configured.");
  return value;
}

export function shopifyRedirectUri() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL is not configured.");
  return `${appUrl}/api/shopify/callback`;
}

export function shopifyWebhookUrl() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL is not configured.");
  return `${appUrl}/api/webhooks/shopify`;
}

export function normalizeShopDomain(value: string) {
  const candidate = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(candidate)) return null;
  return candidate;
}

export function requiredScopes() {
  return (process.env.SHOPIFY_SCOPES || "read_orders").split(",").map((scope) => scope.trim()).filter(Boolean);
}

export function verifyShopifyOAuthHmac(searchParams: URLSearchParams, secret: string) {
  const received = searchParams.get("hmac");
  if (!received) return false;
  const message = [...searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const expected = createHmac("sha256", secret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function decryptShopifyToken(value: string) {
  return decryptField(value);
}

export function encryptShopifyToken(value: string) {
  return encryptField(value);
}

type ShopifyGraphQlResponse = {
  data?: {
    webhookSubscriptionCreate?: {
      userErrors?: Array<{ field?: string[]; message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
};

export async function registerShopifyWebhooks(shopDomain: string, accessToken: string) {
  const endpoint = `https://${shopDomain}/admin/api/${shopifyApiVersion()}/graphql.json`;
  const topics = [
    "ORDERS_CREATE",
    "APP_UNINSTALLED",
  ];
  const mutation = `#graphql
    mutation RegisterWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        userErrors { field message }
      }
    }
  `;

  for (const topic of topics) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
      body: JSON.stringify({ query: mutation, variables: { topic, webhookSubscription: { uri: shopifyWebhookUrl() } } }),
    });
    if (!response.ok) throw new Error(`Shopify webhook registration failed for ${topic}.`);
    const result = await response.json() as ShopifyGraphQlResponse;
    const errors = [
      ...(result.errors || []).map((error) => error.message),
      ...(result.data?.webhookSubscriptionCreate?.userErrors || []).map((error) => error.message),
    ];
    if (errors.length && !errors.some((error) => /already exists|duplicate|already been taken/i.test(error))) {
      throw new Error(`Shopify webhook registration failed for ${topic}: ${errors.join("; ")}`);
    }
  }
}
