"use client";

import { useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { Download, FileUp, Printer, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { formatStatusLabel } from "@/lib/shipments";

export type MerchantShipmentRow = {
  id: string;
  trackingCode: string;
  recipientName: string;
  recipientPhone: string;
  destinationCity: string;
  pieces: number;
  status: string;
  codAmount: number | null;
  createdAt: string;
};

export function MerchantShipmentsTable({ initialShipments }: { initialShipments: MerchantShipmentRow[] }) {
  const [shipments] = useState<MerchantShipmentRow[]>(initialShipments);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ message?: string; error?: string } | null>(null);
  const pageSize = 15;

  const cities = useMemo(() => {
    return Array.from(new Set(initialShipments.map((s) => s.destinationCity))).sort();
  }, [initialShipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (cityFilter !== "ALL" && s.destinationCity !== cityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = s.trackingCode.toLowerCase().includes(q);
        const matchesRecipient = s.recipientName.toLowerCase().includes(q);
        const matchesPhone = s.recipientPhone.toLowerCase().includes(q);
        if (!matchesCode && !matchesRecipient && !matchesPhone) return false;
      }
      return true;
    });
  }, [shipments, statusFilter, cityFilter, searchQuery]);

  const paginatedShipments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, page]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));

  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImportStatus(null);
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch("/api/account/shipments/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as { message?: string; importedCount?: number; errors?: string[] };
      if (!res.ok) throw new Error(data.message ?? "Bulk import failed.");

      setImportStatus({
        message: `Imported ${data.importedCount ?? 0} shipments successfully. Refreshing list…`,
      });

      // Reload page to reflect fresh database shipments
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setImportStatus({ error: err instanceof Error ? err.message : "Import failed." });
    }
  };

  return (
    <div className="mt-8 grid gap-5">
      {/* Search, Filter, Export & Import Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5e6e9] bg-white p-4.5 shadow-[0_4px_16px_rgba(24,25,30,0.02)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-[#8a8b92]" />
            <input
              type="text"
              placeholder="Search tracking, recipient, phone…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-10 w-64 rounded-lg border border-[#dedfe2] bg-white pl-9 pr-3 text-[13px] text-[#25262a] outline-none focus:border-[#163e6a]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#dedfe2] bg-white px-3 text-[13px] text-[#25262a] outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="AT_HUB">At Hub</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELIVERY_ATTEMPTED">Delivery Attempted</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-[#dedfe2] bg-white px-3 text-[13px] text-[#25262a] outline-none"
            >
              <option value="ALL">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImporting((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#dedfe2] bg-white px-3.5 text-[12px] font-semibold text-[#45464b] hover:bg-[#f7f7f8]"
          >
            <FileUp className="size-4 text-[#163e6a]" /> Import CSV
          </button>
          <a
            href="/api/account/shipments/export"
            download
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#dedfe2] bg-white px-3.5 text-[12px] font-semibold text-[#45464b] hover:bg-[#f7f7f8]"
          >
            <Download className="size-4 text-[#163e6a]" /> Export CSV
          </a>
        </div>
      </div>

      {/* Bulk CSV Import Panel */}
      {isImporting && (
        <form
          onSubmit={handleImportSubmit}
          className="rounded-2xl border border-[#163e6a]/20 bg-[#f8fafc] p-6 shadow-xs"
        >
          <h3 className="m-0 text-[15px] font-semibold text-[#163e6a]">
            Bulk CSV Shipment Import
          </h3>
          <p className="mb-4 mt-1 text-[13px] text-[#64748b]">
            Upload a CSV with columns: Recipient Name, Recipient Phone, Delivery Address, Destination City, Pieces, COD Amount, Item Description.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="text-[13px] text-[#475569] file:mr-3 file:rounded-lg file:border-0 file:bg-[#163e6a] file:px-3.5 file:py-2 file:text-[12px] file:font-semibold file:text-white hover:file:bg-[#ec8123]"
            />
            <button
              type="submit"
              disabled={!importFile}
              className="rounded-lg bg-[#163e6a] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-50"
            >
              Upload and Create Shipments
            </button>
          </div>

          {importStatus?.message && (
            <p className="mb-0 mt-3 text-[13px] font-medium text-emerald-700">
              {importStatus.message}
            </p>
          )}
          {importStatus?.error && (
            <p className="mb-0 mt-3 text-[13px] font-medium text-red-600">
              {importStatus.error}
            </p>
          )}
        </form>
      )}

      {/* Main Shipments Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        {paginatedShipments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-collapse text-left text-[13px]">
              <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Tracking code</th>
                  <th className="px-5 py-4 font-semibold">Recipient</th>
                  <th className="px-5 py-4 font-semibold">Destination</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold">COD</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeef]">
                {paginatedShipments.map((s) => (
                  <tr key={s.id} className="text-[#45464b] transition hover:bg-[#fafbfc]">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/account/shipments/${s.trackingCode}`}
                        className="font-mono font-semibold text-[#163e6a] hover:underline"
                      >
                        {s.trackingCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#25262a]">{s.recipientName}</td>
                    <td className="px-5 py-3.5">{s.destinationCity}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-[#f0f4f8] px-2.5 py-1 text-[11px] font-semibold text-[#163e6a]">
                        {formatStatusLabel(s.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#77787e]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {s.codAmount ? `PKR ${s.codAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <a
                        href={`/account/shipments/${s.trackingCode}/label`}
                        target="_blank"
                        rel="noreferrer"
                        title="Print shipping label"
                        className="inline-flex items-center gap-1 rounded-md border border-[#dedfe2] px-2.5 py-1 text-[11px] font-semibold text-[#163e6a] hover:bg-[#f3f4f6]"
                      >
                        <Printer className="size-3" /> Label
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <h2 className="m-0 text-[19px] font-semibold text-[#25262a]">No shipments match criteria</h2>
            <p className="mb-0 mt-2 text-[14px] text-[#6d6e74]">
              Try adjusting your search terms or status filters.
            </p>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#eeeeef] bg-[#fafbfc] px-5 py-3.5 text-[12px] text-[#85868c]">
          <span>
            Showing {filteredShipments.length} shipment(s)
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[#25262a] hover:bg-[#eef0f4] disabled:opacity-30"
              >
                <ArrowLeft className="size-3.5" /> Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[#25262a] hover:bg-[#eef0f4] disabled:opacity-30"
              >
                Next <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
