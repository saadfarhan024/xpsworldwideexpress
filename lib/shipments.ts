import { randomBytes } from "node:crypto";
import type { ShipmentStatus } from "@prisma/client";

/**
 * Generates an ergonomic 14-character tracking code (e.g. GDE-9F2B8D1C4E)
 * Optimally sized for standard 1D Code 128 thermal barcodes and optical laser scanners.
 */
export function generateTrackingCode(): string {
  return `GDE-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ["PICKUP_SCHEDULED", "PICKED_UP", "CANCELLED"],
  PICKUP_SCHEDULED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "AT_HUB", "ON_HOLD", "CANCELLED"],
  IN_TRANSIT: ["AT_HUB", "OUT_FOR_DELIVERY", "ON_HOLD"],
  AT_HUB: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "ON_HOLD", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_ATTEMPTED", "ON_HOLD"],
  DELIVERY_ATTEMPTED: ["OUT_FOR_DELIVERY", "AT_HUB", "RETURNED", "ON_HOLD"],
  ON_HOLD: ["IN_TRANSIT", "AT_HUB", "OUT_FOR_DELIVERY", "RETURNED", "CANCELLED"],
  DELIVERED: [], // Terminal
  RETURNED: [],  // Terminal
  CANCELLED: [], // Terminal
};

export const TERMINAL_STATUSES = new Set<ShipmentStatus>(["DELIVERED", "RETURNED", "CANCELLED"]);

export function isValidTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

export function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
