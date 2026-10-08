"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Filter, XCircle } from "lucide-react";

type StaffMember = {
  id: string;
  email: string;
  role: string;
};

type MerchantSummary = {
  id: string;
  companyName: string;
};

type AdminPickup = {
  id: string;
  status: string;
  pickupAddress: string;
  contactPerson: string | null;
  contactPhone: string | null;
  timeWindow: string | null;
  requestedFor: string | null;
  note: string | null;
  createdAt: string;
  merchant: {
    id: string;
    companyName: string;
    contactName: string;
    phone: string;
    city: string;
    user: { email: string };
  };
  assignedTo: { id: string; email: string } | null;
  shipments: {
    shipment: {
      id: string;
      trackingCode: string;
      recipientName: string;
      destinationCity: string;
      pieces: number;
      status: string;
    };
  }[];
};

const inputClass =
  "h-10 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  REQUESTED: { bg: "bg-blue-50", text: "text-blue-700", label: "Requested" },
  SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Scheduled" },
  ASSIGNED: { bg: "bg-amber-50", text: "text-amber-800", label: "Assigned" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
  FAILED: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
};

function PickupRow({
  pickup,
  staffMembers,
  refresh,
}: {
  pickup: AdminPickup;
  staffMembers: StaffMember[];
  refresh: () => Promise<void>;
}) {
  const [assignedToId, setAssignedToId] = useState(pickup.assignedTo?.id ?? "");
  const [status, setStatus] = useState(pickup.status);
  const [note, setNote] = useState(pickup.note ?? "");
  const [requestedFor, setRequestedFor] = useState(
    pickup.requestedFor ? pickup.requestedFor.slice(0, 10) : ""
  );
  const [timeWindow, setTimeWindow] = useState(pickup.timeWindow ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updatePickup = async (overrideStatus?: string) => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pickups/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: overrideStatus ?? status,
          assignedToId: assignedToId || null,
          requestedFor: requestedFor || null,
          timeWindow: timeWindow || null,
          note: note || null,
        }),
      });

      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Update failed.");

      setMessage(data.message ?? "Updated.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const currentPill = statusPills[pickup.status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: pickup.status,
  };

  return (
    <article className="rounded-xl border border-[#e5e6e9] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eeeeef] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] font-bold text-[#163e6a]">
              #{pickup.id.slice(-6).toUpperCase()}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentPill.bg} ${currentPill.text}`}>
              {currentPill.label}
            </span>
          </div>
          <p className="mb-0 mt-1 text-[14px] font-semibold text-[#202126]">
            {pickup.merchant.companyName} · <span className="font-normal text-[#686970]">{pickup.merchant.city}</span>
          </p>
          <p className="mb-0 mt-0.5 text-[12px] text-[#85868c]">
            Contact: {pickup.contactPerson || pickup.merchant.contactName} ({pickup.contactPhone || pickup.merchant.phone}) · {pickup.merchant.user.email}
          </p>
        </div>
        <div className="text-right text-[12px] text-[#85868c]">
          <span>Requested: {new Date(pickup.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[13px] max-[650px]:grid-cols-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#85868c]">Collection address:</span>
          <p className="mb-0 mt-1 text-[#34353a]">{pickup.pickupAddress}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#85868c]">Parcels / Shipments:</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pickup.shipments.length > 0 ? (
              pickup.shipments.map(({ shipment }) => (
                <span
                  key={shipment.id}
                  className="rounded-md border border-[#e1e2e5] bg-[#f9fafb] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#163e6a]"
                >
                  {shipment.trackingCode} ({shipment.status})
                </span>
              ))
            ) : (
              <span className="text-[12px] text-[#77787e]">Open pickup (no pre-linked shipments)</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[#f8f9fa] p-4">
        <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
          <label className="text-[11px] font-semibold text-[#686970]">
            Assign staff / driver
            <select
              className={`${inputClass} mt-1 w-full`}
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.email} ({s.role.toLowerCase()})
                </option>
              ))}
            </select>
          </label>

          <label className="text-[11px] font-semibold text-[#686970]">
            Schedule date
            <input
              type="date"
              className={`${inputClass} mt-1 w-full`}
              value={requestedFor}
              onChange={(e) => setRequestedFor(e.target.value)}
            />
          </label>

          <label className="text-[11px] font-semibold text-[#686970]">
            Time window
            <input
              className={`${inputClass} mt-1 w-full`}
              placeholder="e.g. 09:00 - 13:00"
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
            />
          </label>

          <label className="text-[11px] font-semibold text-[#686970]">
            Update status
            <select
              className={`${inputClass} mt-1 w-full`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <input
            className={`${inputClass} w-full`}
            placeholder="Operations note or reason (visible in audit & email)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => updatePickup()}
              className="inline-flex min-h-9 items-center rounded-md bg-[#16171a] px-3.5 text-[12px] font-semibold text-white hover:bg-[#34353a] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {pickup.status !== "COMPLETED" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => updatePickup("COMPLETED")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3.5 text-[12px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5" /> Mark Completed
              </button>
            )}
            {pickup.status !== "FAILED" && pickup.status !== "COMPLETED" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => updatePickup("FAILED")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="size-3.5" /> Mark Failed
              </button>
            )}
          </div>
          {message && <span className="text-[12px] text-[#686970]">{message}</span>}
        </div>
      </div>
    </article>
  );
}

export function AdminPickups() {
  const [pickups, setPickups] = useState<AdminPickup[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [merchantFilter, setMerchantFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    const url = new URL("/api/admin/pickups", window.location.origin);
    if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
    if (merchantFilter !== "ALL") url.searchParams.set("merchantId", merchantFilter);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as {
          pickups?: AdminPickup[];
          staffMembers?: StaffMember[];
          merchants?: MerchantSummary[];
          message?: string;
        };

        if (!response.ok) throw new Error(data.message ?? "Could not load pickup requests.");

        if (!ignore) {
          setPickups(data.pickups ?? []);
          setStaffMembers(data.staffMembers ?? []);
          setMerchants(data.merchants ?? []);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Could not load pickups.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, merchantFilter, reloadKey]);

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading dispatch queue…</p>;

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e5e6e9] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-4 text-[#163e6a]" />
          <span className="text-[13px] font-semibold text-[#202126]">Filters:</span>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className={inputClass}
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
          >
            <option value="ALL">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.companyName}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[12px] font-medium text-[#85868c]">
          Showing {pickups.length} pickup request(s)
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      {pickups.length > 0 ? (
        <div className="grid gap-4">
          {pickups.map((pickup) => (
            <PickupRow
              key={pickup.id}
              pickup={pickup}
              staffMembers={staffMembers}
              refresh={refresh}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d7d8dc] bg-white p-10 text-center text-[14px] text-[#686970]">
          No pickup requests match the selected filters.
        </div>
      )}
    </div>
  );
}
