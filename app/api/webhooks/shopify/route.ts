import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { generateTrackingCode } from "@/lib/shipments";

function verifyShopifyHmac(body: string, hmac: string | null, secret: string): boolean {
  if (!hmac || !secret) return false;
  const hash = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(hmac);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_API_SECRET || "development-shopify-secret-key-123";
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  const rawBody = await request.text();

  if (process.env.NODE_ENV === "production" && !verifyShopifyHmac(rawBody, hmac, secret)) {
    return NextResponse.json({ message: "Invalid Shopify HMAC signature." }, { status: 401 });
  }

  // Handle GDPR compliance webhooks
  if (
    topic === "customers/data_request" ||
    topic === "customers/redact" ||
    topic === "shop/redact"
  ) {
    return NextResponse.json({ message: "GDPR compliance webhook acknowledged." }, { status: 200 });
  }

  if (topic === "app/uninstalled") {
    // Record uninstall event in audit log
    await prisma.auditLog.create({
      data: {
        action: "SHOPIFY_APP_UNINSTALLED",
        entityType: "ShopifyIntegration",
        entityId: shopDomain || "unknown",
        summary: `Shopify store ${shopDomain} uninstalled GDE integration.`,
      },
    });
    return NextResponse.json({ message: "Uninstall acknowledged." }, { status: 200 });
  }

  if (topic === "orders/create") {
    let order: {
      id?: number | string;
      name?: string;
      shipping_address?: {
        name?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        address1?: string;
        city?: string;
      };
      financial_status?: string;
      total_price?: string;
      note?: string;
      line_items?: Array<{ title?: string; quantity?: number }>;
    };

    try {
      order = JSON.parse(rawBody) as typeof order;
    } catch {
      return NextResponse.json({ message: "Invalid order JSON." }, { status: 400 });
    }

    const shipping = order.shipping_address;
    if (!shipping || !shipping.address1 || !shipping.city) {
      return NextResponse.json({ message: "Order has no complete shipping address, skipping." });
    }

    if (!shopDomain) {
      return NextResponse.json({ message: "Missing x-shopify-shop-domain header." }, { status: 400 });
    }

    // Match merchant whose website matches the shop domain
    const merchant = await prisma.merchantProfile.findFirst({
      where: {
        user: { status: "ACTIVE" },
        website: { contains: shopDomain, mode: "insensitive" },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { message: `No active merchant registered with store domain "${shopDomain}".` },
        { status: 404 }
      );
    }

    const recipientName =
      shipping.name ||
      `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim() ||
      "Shopify Customer";
    const recipientPhone = shipping.phone || "+92 000 0000000";
    const deliveryAddress = shipping.address1;
    const destinationCity = shipping.city;
    const isCod = order.financial_status === "pending" || order.financial_status === "authorized";
    const codAmount = isCod && order.total_price ? parseFloat(order.total_price) : null;
    const itemDescription = order.line_items
      ? order.line_items.map((i) => `${i.quantity}x ${i.title}`).join(", ")
      : order.name ?? null;

    const trackingCode = generateTrackingCode();

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          merchantId: merchant.id,
          trackingCode,
          recipientName,
          recipientPhone,
          deliveryAddress,
          destinationCity,
          itemDescription,
          pieces: order.line_items ? Math.max(1, order.line_items.length) : 1,
          codAmount,
          status: "CREATED",
          events: {
            create: {
              status: "CREATED",
              publicNote: `Order synced from Shopify (${order.name || order.id}).`,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "SHOPIFY_ORDER_SYNCED",
          entityType: "Shipment",
          entityId: created.id,
          summary: `Created shipment ${created.trackingCode} from Shopify order ${order.name || order.id}.`,
        },
      });

      return created;
    });

    return NextResponse.json({
      message: "Shopify order synced to GDE shipment.",
      trackingCode: shipment.trackingCode,
    });
  }

  return NextResponse.json({ message: `Topic ${topic} received.` });
}
