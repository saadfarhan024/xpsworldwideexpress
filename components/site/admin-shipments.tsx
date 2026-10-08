"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Filter, Search, ShieldAlert, ArrowLeft, ArrowRight } from "lucide-react";
import { ALLOWED_TRANSITIONS, formatStatusLabel, TERMINAL_STATUSES } from "@/lib/shipments";
import type { ShipmentStatus } from "@prisma/client";

type Shipment = {
  id: string;
  trackingCode: string;
  status: ShipmentStatus;
  recipientName: string;
  recipientPhone: string;
  destinationCity: string;
  pieces: number;
  codAmount: number | string | null;
  collectedAmount: number | string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { id: string; companyName: string };
};

type MerchantSummary = {
  id: string;
  companyName: string;
};

const allStatuses: ShipmentStatus[] = [
  "CREATED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_ATTEMPTED",
  "ON_HOLD",
  "RETURNED",
  "CANCELLED",
];

const inputClass =
  "h-10 w-full rounded-md border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

function ShipmentRow({
  shipment,
  refresh,
}: {
  shipment: Shipment;
  refresh: () => Promise<void>;
}) {
  const allowed = ALLOWED_TRANSITIONS[shipment.status] ?? [];
  const isTerminal = TERMINAL_STATUSES.has(shipment.status);

  const [status, setStatus] = useState<ShipmentStatus>(
    allowed[0] ?? shipment.status
  );
  const [location, setLocation] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [collectedAmount, setCollectedAmount] = useState<string>(
    shipment.collectedAmount != null
      ? String(shipment.collectedAmount)
      : shipment.codAmount != null
      ? String(shipment.codAmount)
      : ""
  );
  const [forceOverride, setForceOverride] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/shipments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: shipment.trackingCode,
          status,
          location,
          publicNote,
          internalNote,
          collectedAmount: status === "DELIVERED" ? collectedAmount : undefined,
          forceOverride,
        }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not update shipment.");
      setMessage(result.message ?? "Updated.");
      setPublicNote("");
      setInternalNote("");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update shipment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-[#e5e6e9] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eeeeef] pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[14px] font-bold text-[#163e6a]">
              {shipment.trackingCode}
            </span>
            <span className="rounded-full bg-[#f0f4f8] px-2.5 py-0.5 text-[11px] font-semibold text-[#163e6a]">
              {formatStatusLabel(shipment.status)}
            </span>
            {isTerminal && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                Terminal
              </span>
            )}
          </div>
          <p className="mb-0 mt-1 text-[13px] text-[#45464b]">
            {shipment.merchant.companyName} · {shipment.recipientName} ({shipment.recipientPhone}) ·{" "}
            {shipment.destinationCity} · {shipment.pieces} parcel(s)
          </p>
          <p className="mb-0 mt-0.5 text-[11px] text-[#898a90]">
            Created {new Date(shipment.createdAt).toLocaleDateString()} · Updated{" "}
            {new Date(shipment.updatedAt).toLocaleString()}
            {shipment.codAmount ? ` · COD: PKR ${Number(shipment.codAmount).toFixed(2)}` : ""}
            {shipment.collectedAmount
              ? ` · Collected: PKR ${Number(shipment.collectedAmount).toFixed(2)}`
              : ""}
          </p>
        </div>
      </div>

      <form className="mt-4 grid grid-cols-2 gap-3 max-[650px]:grid-cols-1" onSubmit={submit}>
        <label className="text-[11px] font-semibold text-[#686970]">
          Target status {isTerminal && !forceOverride ? "(Terminal state)" : ""}
          <select
            className={`${inputClass} mt-1`}
            value={status}
            onChange={(event) => setStatus(event.target.value as ShipmentStatus)}
            disabled={isTerminal && !forceOverride}
          >
            {forceOverride ? (
              allStatuses.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))
            ) : allowed.length > 0 ? (
              allowed.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))
            ) : (
              <option value={shipment.status}>{formatStatusLabel(shipment.status)} (No transitions)</option>
            )}
          </select>
        </label>

        <label className="text-[11px] font-semibold text-[#686970]">
          Location <span className="font-normal">(public)</span>
          <input
            className={`${inputClass} mt-1`}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Lahore Central Sorting Hub"
            maxLength={120}
          />
        </label>

        <label className="text-[11px] font-semibold text-[#686970]">
          Customer update <span className="font-normal">(visible in tracking)</span>
          <input
            className={`${inputClass} mt-1`}
            value={publicNote}
            onChange={(event) => setPublicNote(event.target.value)}
            placeholder="e.g. Shipment received at sorting hub"
            maxLength={500}
            required
          />
        </label>

        <label className="text-[11px] font-semibold text-[#686970]">
          Internal staff note <span className="font-normal">(private)</span>
          <input
            className={`${inputClass} mt-1`}
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            placeholder="e.g. Box had minor corner crease; driver 14"
            maxLength={1000}
          />
        </label>

        {status === "DELIVERED" && shipment.codAmount != null && (
          <label className="text-[11px] font-semibold text-[#686970]">
            Collected COD amount (PKR)
            <input
              type="number"
              step="0.01"
              className={`${inputClass} mt-1`}
              value={collectedAmount}
              onChange={(event) => setCollectedAmount(event.target.value)}
              placeholder="Amount collected from recipient"
            />
          </label>
        )}

        {isTerminal && (
          <div className="col-span-2 flex items-center gap-2 text-[12px] text-amber-800">
            <ShieldAlert className="size-4" />
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={forceOverride}
                onChange={(e) => setForceOverride(e.target.checked)}
                className="size-4 rounded"
              />
              <span>Administrator override: Allow modifying terminal shipment state</span>
            </label>
          </div>
        )}

        <div className="col-span-2 flex flex-wrap items-center gap-3 max-[650px]:col-span-1">
          <button
            className="min-h-10 rounded-md bg-[#16171a] px-4 text-[12px] font-semibold text-white hover:bg-[#34353a] disabled:opacity-50"
            type="submit"
            disabled={saving || (isTerminal && !forceOverride)}
          >
            {saving ? "Saving…" : "Save status & tracking event"}
          </button>
          {message && <span className="text-[12px] text-[#686970]" role="status">{message}</span>}
        </div>
      </form>
    </article>
  );
}

export function AdminShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [merchantFilter, setMerchantFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    const url = new URL("/api/admin/shipments", window.location.origin);
    if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
    if (merchantFilter !== "ALL") url.searchParams.set("merchantId", merchantFilter);
    if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "25");

    fetch(url.toString(), { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as {
          shipments?: Shipment[];
          merchants?: MerchantSummary[];
          pagination?: { page: number; totalPages: number; totalCount: number };
          message?: string;
        };

        if (!response.ok) throw new Error(data.message ?? "Could not load shipments.");

        if (!ignore) {
          setShipments(data.shipments ?? []);
          setMerchants(data.merchants ?? []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalCount(data.pagination.totalCount);
          }
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Could not load shipments.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, merchantFilter, searchQuery, page, reloadKey]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    refresh();
  };

  if (loading && shipments.length === 0) {
    return <p className="mt-8 text-[14px] text-[#686970]">Loading shipment operations queue…</p>;
  }

  return (
    <div className="mt-8 grid gap-5">
      <div className="rounded-xl border border-[#e5e6e9] bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-[#163e6a]" />
            <select
              className="h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))}
            </select>

            <select
              className="h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none"
              value={merchantFilter}
              onChange={(e) => {
                setMerchantFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Merchants</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-[#85868c]" />
              <input
                type="text"
                placeholder="Search tracking or recipient…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9.5 w-64 rounded-lg border border-[#dedfe2] bg-white pl-8 pr-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]"
              />
            </div>
            <button
              type="submit"
              className="h-9.5 rounded-lg bg-[#163e6a] px-3.5 text-[12px] font-semibold text-white hover:bg-[#ec8123]"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f2] pt-2 text-[12px] text-[#85868c]">
          <span>Found {totalCount} shipment(s)</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 hover:bg-[#f5f5f7] disabled:opacity-30"
              >
                <ArrowLeft className="size-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded p-1 hover:bg-[#f5f5f7] disabled:opacity-30"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      {shipments.length ? (
        shipments.map((shipment) => (
          <ShipmentRow key={shipment.trackingCode} shipment={shipment} refresh={refresh} />
        ))
      ) : (
        <p className="rounded-xl border border-dashed border-[#d7d8dc] bg-white p-7 text-center text-[14px] text-[#686970]">
          No shipments match the selected filters.
        </p>
      )}
    </div>
  );
}
