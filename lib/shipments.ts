import { randomBytes } from "node:crypto";
import type { ShipmentStatus } from "@prisma/client";

export const CARRIER_STATUS_DEFINITIONS = [
  ["NEW_BOOKED", "New Booked"],
  ["PICKUP_IN_PROGRESS", "Pick up in progress"],
  ["PICKED_UP", "Picked up"],
  ["PARCEL_RECEIVED_AT_OFFICE", "Parcel Received at office"],
  ["PARCEL_IN_TRANSIT_TO_DESTINATION", "Parcel in Transit to Destination"],
  ["PARCEL_RECEIVED_AT_DESTINATION", "Parcel Received at Destination"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["LOST", "Lost"],
  ["CLAIM", "Claim"],
  ["DELIVERED", "Delivered"],
  ["SHIPPER_ADVICE", "Shipper Advice"],
  ["RE_ATTEMPT", "Re-attempt"],
  ["RETURN_CONFIRMATION", "Return Confirmation"],
  ["RETURN_RECEIVED_AT_ORIGIN", "Return Received At Origin"],
  ["RETURNED_TO_ORIGIN_CITY", "Returned to origin city"],
  ["DELIVERY_UNSUCCESSFUL", "Delivery Unsuccessful"],
  ["PARCEL_RETURN_TO_OFFICE", "Parcel Return to office"],
  ["RETURN_IN_PROCESS", "Return In Process"],
  ["RETURNED_TO_SHIPPER", "Returned to Shipper"],
  ["HOLD_FOR_SELF_COLLECTION", "Hold For Self Collection"],
  ["REFUSED_BY_CONSIGNEE", "Refused by Consignee"],
  ["CONSIGNEE_NOT_AVAILABLE", "Consignee Not Available"],
  ["INCOMPLETE_ADDRESS", "Incomplete Address"],
  ["NON_SERVICE_AREA", "Non service Area"],
  ["ALLOW_TO_OPEN_DEMAND", "Allow to Open demand"],
  ["REPLACEMENT_COLLECT", "Replacement Collect"],
  ["MISROUTED", "Misrouted"],
  ["RETURN_IN_TRANSIT", "Return - In Transit"],
  ["REPLACEMENT_IN_TRANSIT", "Replacement In Transit"],
  ["REPLACEMENT_DELIVERED", "Replacement Delivered"],
  ["RECEIVED_AT_WAREHOUSE", "Received At Warehouse"],
  ["REPLACEMENT_RETURNED", "Replacement Returned"],
  ["RETURNED_BY_3PL", "Returned by 3PL"],
] as const;

export type CarrierStatusKey = (typeof CARRIER_STATUS_DEFINITIONS)[number][0];

export const CARRIER_STATUS_LABELS: Record<CarrierStatusKey, string> = Object.fromEntries(CARRIER_STATUS_DEFINITIONS) as Record<CarrierStatusKey, string>;

export const CARRIER_STATUS_MAP: Record<string, ShipmentStatus> = {
  NEW_BOOKED: "CREATED",
  PICKUP_IN_PROGRESS: "PICKUP_SCHEDULED",
  PICKED_UP: "PICKED_UP",
  PARCEL_RECEIVED_AT_OFFICE: "AT_HUB",
  PARCEL_IN_TRANSIT_TO_DESTINATION: "IN_TRANSIT",
  PARCEL_RECEIVED_AT_DESTINATION: "AT_HUB",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  LOST: "ON_HOLD",
  CLAIM: "ON_HOLD",
  DELIVERED: "DELIVERED",
  SHIPPER_ADVICE: "ON_HOLD",
  RE_ATTEMPT: "DELIVERY_ATTEMPTED",
  RETURN_CONFIRMATION: "RETURNED",
  RETURN_RECEIVED_AT_ORIGIN: "RETURNED",
  RETURNED_TO_ORIGIN_CITY: "RETURNED",
  DELIVERY_UNSUCCESSFUL: "DELIVERY_ATTEMPTED",
  PARCEL_RETURN_TO_OFFICE: "RETURNED",
  RETURN_IN_PROCESS: "RETURNED",
  RETURNED_TO_SHIPPER: "RETURNED",
  HOLD_FOR_SELF_COLLECTION: "ON_HOLD",
  REFUSED_BY_CONSIGNEE: "DELIVERY_ATTEMPTED",
  CONSIGNEE_NOT_AVAILABLE: "DELIVERY_ATTEMPTED",
  INCOMPLETE_ADDRESS: "DELIVERY_ATTEMPTED",
  NON_SERVICE_AREA: "ON_HOLD",
  ALLOW_TO_OPEN_DEMAND: "ON_HOLD",
  REPLACEMENT_COLLECT: "CREATED",
  MISROUTED: "ON_HOLD",
  RETURN_IN_TRANSIT: "IN_TRANSIT",
  REPLACEMENT_IN_TRANSIT: "IN_TRANSIT",
  REPLACEMENT_DELIVERED: "DELIVERED",
  RECEIVED_AT_WAREHOUSE: "AT_HUB",
  REPLACEMENT_RETURNED: "RETURNED",
  RETURNED_BY_3PL: "RETURNED",
  MANIFEST_RECEIVED: "CREATED",
  ARRIVED_AT_SORT_FACILITY: "AT_HUB",
  DEPARTED_FACILITY: "IN_TRANSIT",
  DELIVERY_ATTEMPT_FAILED: "DELIVERY_ATTEMPTED",
  DELIVERY_EXCEPTION: "ON_HOLD",
  RETURN_TO_SENDER: "RETURNED",
  CANCELLED: "CANCELLED",
};

export function normalizeCarrierStatus(value: string): string | null {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  const aliases: Record<string, string> = {
    REPLACEMENT_COLECT: "REPLACEMENT_COLLECT",
    REPLACEMENT_DELEVERED: "REPLACEMENT_DELIVERED",
    MANIFEST_RECEIVED: "MANIFEST_RECEIVED",
    ARRIVED_AT_SORT_FACILITY: "ARRIVED_AT_SORT_FACILITY",
    DEPARTED_FACILITY: "DEPARTED_FACILITY",
    DELIVERY_ATTEMPT_FAILED: "DELIVERY_ATTEMPT_FAILED",
    DELIVERY_EXCEPTION: "DELIVERY_EXCEPTION",
    RETURN_TO_SENDER: "RETURN_TO_SENDER",
    CANCELLED: "CANCELLED",
  };
  const key = aliases[normalized] ?? normalized;
  return key in CARRIER_STATUS_MAP ? key : null;
}

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
