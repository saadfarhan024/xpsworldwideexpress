import type { ShipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CARRIER_STATUS_MAP,
  CARRIER_STATUS_DEFINITIONS,
  CARRIER_STATUS_LABELS,
  type CarrierStatusKey,
} from "@/lib/shipments";

const TERMINAL_STATUSES: ShipmentStatus[] = ["DELIVERED", "RETURNED", "CANCELLED"];
const FALLBACK_CARRIER_STATUS: Partial<Record<ShipmentStatus, CarrierStatusKey>> = {
  CREATED: "NEW_BOOKED",
  PICKUP_SCHEDULED: "PICKUP_IN_PROGRESS",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "PARCEL_IN_TRANSIT_TO_DESTINATION",
  AT_HUB: "PARCEL_RECEIVED_AT_OFFICE",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  DELIVERY_ATTEMPTED: "DELIVERY_UNSUCCESSFUL",
  ON_HOLD: "HOLD_FOR_SELF_COLLECTION",
  RETURNED: "RETURNED_TO_SHIPPER",
};

function monthStartInKarachi() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return new Date(Date.UTC(year, month - 1, 1, -5));
}

function decimalToNumber(value: unknown) {
  return value == null ? 0 : Number(value);
}

export async function getMerchantDashboardStats(merchantId: string) {
  const monthStart = monthStartInKarachi();
  const [summary, monthlyShipments, statusRows, deliveredEvents, recentShipments] = await Promise.all([
    prisma.shipment.aggregate({
      where: { merchantId },
      _count: { _all: true },
    }),
    prisma.shipment.count({ where: { merchantId, createdAt: { gte: monthStart } } }),
    prisma.shipment.findMany({
      where: { merchantId },
      select: { status: true, carrierStatus: true },
    }),
    prisma.trackingEvent.findMany({
      where: { status: "DELIVERED", shipment: { merchantId } },
      select: { shipmentId: true, occurredAt: true, shipment: { select: { createdAt: true } } },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.shipment.findMany({
      where: { merchantId },
      select: { trackingCode: true, status: true, destinationCity: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalOrders = summary._count._all;
  const delivered = statusRows.filter((row) => row.status === "DELIVERED").length;
  const returned = statusRows.filter((row) => row.status === "RETURNED").length;
  const active = statusRows.filter((row) => !TERMINAL_STATUSES.includes(row.status)).length;

  const codTotals = await prisma.shipment.aggregate({
    where: { merchantId, status: { notIn: ["RETURNED", "CANCELLED"] } },
    _sum: { codAmount: true, collectedAmount: true },
  });
  const pendingCod = Math.max(0, decimalToNumber(codTotals._sum.codAmount) - decimalToNumber(codTotals._sum.collectedAmount));

  const firstDeliveredAt = new Map<string, Date>();
  for (const event of deliveredEvents) {
    if (!firstDeliveredAt.has(event.shipmentId)) firstDeliveredAt.set(event.shipmentId, event.occurredAt);
  }
  const deliveryDurations = deliveredEvents
    .filter((event) => firstDeliveredAt.get(event.shipmentId)?.getTime() === event.occurredAt.getTime())
    .map((event) => event.occurredAt.getTime() - event.shipment.createdAt.getTime());
  const averageDeliveryDays = deliveryDurations.length
    ? deliveryDurations.reduce((total, duration) => total + duration, 0) / deliveryDurations.length / 86_400_000
    : null;

  const statusCounts = Object.fromEntries(CARRIER_STATUS_DEFINITIONS.map(([key]) => [key, 0])) as Record<CarrierStatusKey, number>;
  for (const row of statusRows) {
    const key = row.carrierStatus && row.carrierStatus in CARRIER_STATUS_LABELS && CARRIER_STATUS_MAP[row.carrierStatus] === row.status
      ? row.carrierStatus as CarrierStatusKey
      : FALLBACK_CARRIER_STATUS[row.status];
    if (key) statusCounts[key] += 1;
  }

  return {
    totalOrders,
    deliveredRate: totalOrders ? (delivered / totalOrders) * 100 : 0,
    returnRate: totalOrders ? (returned / totalOrders) * 100 : 0,
    averageDeliveryDays,
    activeShipments: active,
    pendingCod,
    shipmentsThisMonth: monthlyShipments,
    statuses: CARRIER_STATUS_DEFINITIONS.map(([key, label]) => ({ key, label, count: statusCounts[key] })),
    recentShipments,
  };
}
