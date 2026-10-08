"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Package, XCircle } from "lucide-react";
import Link from "next/link";

type LinkedShipment = {
  id: string;
  trackingCode: string;
  recipientName: string;
  destinationCity: string;
  pieces: number;
  status: string;
};

export type MerchantPickup = {
  id: string;
  status: string;
  pickupAddress: string;
  contactPerson: string | null;
  contactPhone: string | null;
  timeWindow: string | null;
  requestedFor: string | null;
  note: string | null;
  createdAt: string;
  assignedTo: { email: string } | null;
  shipments: { shipment: LinkedShipment }[];
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  REQUESTED: { bg: "bg-blue-50", text: "text-blue-700", label: "Requested" },
  SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Scheduled" },
  ASSIGNED: { bg: "bg-amber-50", text: "text-amber-800", label: "Driver Assigned" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
  FAILED: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
};

export function MerchantPickupsList({ initialPickups }: { initialPickups: MerchantPickup[] }) {
  const [pickups, setPickups] = useState<MerchantPickup[]>(initialPickups);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleCancel = async (pickupId: string) => {
    if (!confirm("Are you sure you want to cancel this pickup request?")) return;

    setCancellingId(pickupId);
    setError("");

    try {
      const response = await fetch(`/api/account/pickups/${pickupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json() as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Could not cancel pickup request.");
      }

      setPickups((prev) =>
        prev.map((p) => (p.id === pickupId ? { ...p, status: "CANCELLED" } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setCancellingId(null);
    }
  };

  if (pickups.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-[#e5e6e9] bg-white p-12 text-center shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        <Package className="mx-auto size-10 text-[#a0a1a8]" />
        <h2 className="mt-4 text-[19px] font-semibold text-[#202126]">No pickup requests yet</h2>
        <p className="mx-auto mb-6 mt-1.5 max-w-100 text-[13px] text-[#686970]">
          When your packages are ready for dispatch, request a pickup to have our courier collect them.
        </p>
        <Link
          href="/account/pickups/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white hover:bg-[#ec8123]"
        >
          Request a pickup
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      {pickups.map((pickup) => {
        const style = statusStyles[pickup.status] ?? {
          bg: "bg-gray-100",
          text: "text-gray-700",
          label: pickup.status,
        };
        const canCancel = pickup.status === "REQUESTED" || pickup.status === "SCHEDULED";

        return (
          <article
            key={pickup.id}
            className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eeeeef] pb-4">
              <div>
                <span className="font-mono text-[12px] font-semibold text-[#85868c]">
                  PICKUP #{pickup.id.slice(-6).toUpperCase()}
                </span>
                <p className="mb-0 mt-1 text-[12px] text-[#85868c]">
                  Submitted on {new Date(pickup.createdAt).toLocaleDateString()} at{" "}
                  {new Date(pickup.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => handleCancel(pickup.id)}
                    disabled={cancellingId === pickup.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="size-3.5" />
                    {cancellingId === pickup.id ? "Cancelling…" : "Cancel request"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 max-[750px]:grid-cols-1">
              <div>
                <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#85868c]">
                  <MapPin className="size-3.5 text-[#163e6a]" /> Collection address
                </p>
                <p className="mb-0 mt-1 text-[13px] text-[#34353a]">{pickup.pickupAddress}</p>
                {pickup.contactPerson && (
                  <p className="mb-0 mt-0.5 text-[12px] text-[#686970]">
                    Contact: {pickup.contactPerson} ({pickup.contactPhone})
                  </p>
                )}
              </div>

              <div>
                <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#85868c]">
                  <Calendar className="size-3.5 text-[#163e6a]" /> Timing & window
                </p>
                <p className="mb-0 mt-1 text-[13px] text-[#34353a]">
                  {pickup.requestedFor
                    ? new Date(pickup.requestedFor).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not specified"}
                </p>
                {pickup.timeWindow && (
                  <p className="mb-0 mt-0.5 flex items-center gap-1 text-[12px] text-[#686970]">
                    <Clock className="size-3" /> {pickup.timeWindow}
                  </p>
                )}
              </div>

              <div>
                <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#85868c]">
                  <Package className="size-3.5 text-[#163e6a]" /> Assigned courier
                </p>
                <p className="mb-0 mt-1 text-[13px] text-[#34353a]">
                  {pickup.assignedTo ? pickup.assignedTo.email : "Pending dispatch assignment"}
                </p>
                {pickup.note && (
                  <p className="mb-0 mt-1 text-[12px] text-[#77787e]">Note: {pickup.note}</p>
                )}
              </div>
            </div>

            {pickup.shipments.length > 0 && (
              <div className="mt-5 rounded-xl border border-[#eeeeef] bg-[#fafbfc] p-3.5">
                <p className="m-0 text-[12px] font-semibold text-[#45464b]">
                  Included shipments ({pickup.shipments.length}):
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pickup.shipments.map(({ shipment }) => (
                    <Link
                      key={shipment.id}
                      href={`/account/shipments/${shipment.trackingCode}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#e1e2e5] bg-white px-2.5 py-1 text-[12px] text-[#163e6a] hover:border-[#163e6a] hover:underline"
                    >
                      <span className="font-mono font-semibold">{shipment.trackingCode}</span>
                      <span className="text-[#85868c]">({shipment.destinationCity})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
