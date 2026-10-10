"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, Filter, Plus } from "lucide-react";
import Link from "next/link";

type UnreconciledMerchant = {
  merchantId: string;
  companyName: string;
  shipmentCount: number;
  totalAmount: number;
};

type RemittanceBatch = {
  id: string;
  reference: string;
  amount: number | string;
  status: string;
  payoutReference: string | null;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  createdAt: string;
  _count: { shipments: number };
  merchant: {
    id: string;
    companyName: string;
    contactName: string;
    user: { email: string };
    bankDetail: { bankName: string | null; accountTitle: string | null } | null;
  };
};

const inputClass =
  "h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-blue-50", text: "text-blue-700", label: "Pending" },
  RECONCILED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Reconciled" },
  PAID: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Paid" },
  ON_HOLD: { bg: "bg-amber-50", text: "text-amber-800", label: "On Hold" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
};

export function AdminRemittances() {
  const [activeTab, setActiveTab] = useState<"batches" | "unreconciled">("batches");
  const [batches, setBatches] = useState<RemittanceBatch[]>([]);
  const [unreconciledMerchants, setUnreconciledMerchants] = useState<UnreconciledMerchant[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payoutInputs, setPayoutInputs] = useState<Record<string, string>>({});

  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    const url = new URL("/api/admin/remittances", window.location.origin);
    if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as {
          batches?: RemittanceBatch[];
          unreconciledMerchants?: UnreconciledMerchant[];
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Could not load remittances.");

        if (!ignore) {
          setBatches(data.batches ?? []);
          setUnreconciledMerchants(data.unreconciledMerchants ?? []);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load remittances.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, reloadKey]);

  const createBatch = async (merchantId: string) => {
    setActionLoading(`create-${merchantId}`);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/remittances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Batch creation failed.");

      setMessage(data.message ?? "Batch created successfully.");
      await refresh();
      setActiveTab("batches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const updateBatch = async (batchId: string, newStatus: string) => {
    setActionLoading(`update-${batchId}`);
    setError("");
    setMessage("");

    try {
      const payoutRef = payoutInputs[batchId] || undefined;
      const res = await fetch(`/api/admin/remittances/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          payoutReference: payoutRef,
        }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Update failed.");

      setMessage(data.message ?? "Remittance updated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading Finance settlements…</p>;

  return (
    <div className="mt-8 grid gap-6">
      {/* Tabs Bar */}
      <div className="flex border-b border-[#e5e6e9]">
        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`border-b-2 px-5 py-3 text-[13px] font-semibold transition ${
            activeTab === "batches"
              ? "border-[#163e6a] text-[#163e6a]"
              : "border-transparent text-[#77787e] hover:text-[#25262a]"
          }`}
        >
          Settlement Batches ({batches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unreconciled")}
          className={`border-b-2 px-5 py-3 text-[13px] font-semibold transition ${
            activeTab === "unreconciled"
              ? "border-[#163e6a] text-[#163e6a]"
              : "border-transparent text-[#77787e] hover:text-[#25262a]"
          }`}
        >
          Unreconciled COD Queue ({unreconciledMerchants.length} merchants)
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-[13px] text-emerald-800" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Tab 1: Settlement Batches */}
      {activeTab === "batches" && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e5e6e9] bg-white p-3.5">
            <div className="flex items-center gap-3">
              <Filter className="size-4 text-[#163e6a]" />
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Batch Statuses</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="PAID">Paid</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-xs">
            {batches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-220 border-collapse text-left text-[13px]">
                  <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Batch Reference</th>
                      <th className="px-5 py-4 font-semibold">Merchant</th>
                      <th className="px-5 py-4 font-semibold">Orders</th>
                      <th className="px-5 py-4 font-semibold">Total Amount</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Payout Ref (Bank/UTR)</th>
                      <th className="px-5 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eeeeef]">
                    {batches.map((b) => {
                      const style = statusPills[b.status] ?? {
                        bg: "bg-gray-100",
                        text: "text-gray-700",
                        label: b.status,
                      };
                      const isPaid = b.status === "PAID";
                      const isCancelled = b.status === "CANCELLED";

                      return (
                        <tr key={b.id} className="text-[#45464b] hover:bg-[#fafbfc]">
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-[#163e6a]">{b.reference}</span>
                            <span className="block text-[11px] text-[#85868c]">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <strong className="text-[#202126]">{b.merchant.companyName}</strong>
                            <span className="block text-[11px] text-[#85868c]">
                              {b.merchant.bankDetail?.bankName || "No bank on file"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium">{b._count.shipments} orders</td>
                          <td className="px-5 py-3.5 font-bold text-[#202126]">
                            PKR {Number(b.amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
                              {style.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {isPaid ? (
                              <span className="font-mono font-medium text-[#202126]">
                                {b.payoutReference || "—"}
                              </span>
                            ) : (
                              <input
                                placeholder="e.g. UTR-982314"
                                className="h-8 w-36 rounded-md border border-[#dedfe2] px-2 text-[12px]"
                                defaultValue={b.payoutReference ?? ""}
                                onChange={(e) =>
                                  setPayoutInputs({ ...payoutInputs, [b.id]: e.target.value })
                                }
                                disabled={isCancelled}
                              />
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isPaid && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => updateBatch(b.id, "PAID")}
                                  disabled={actionLoading === `update-${b.id}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="size-3" /> Mark Paid
                                </button>
                              )}
                              {!isCancelled && b.status !== "ON_HOLD" && (
                                <button
                                  type="button"
                                  onClick={() => updateBatch(b.id, "ON_HOLD")}
                                  disabled={actionLoading === `update-${b.id}`}
                                  className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-50"
                                >
                                  Hold
                                </button>
                              )}
                              {!isPaid && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => updateBatch(b.id, "CANCELLED")}
                                  disabled={actionLoading === `update-${b.id}`}
                                  className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </button>
                              )}
                              <Link
                                href={`/admin/remittances/${b.reference}`}
                                className="inline-flex items-center gap-1 rounded-md border border-[#dedfe2] px-2 py-1 text-[11px] font-semibold text-[#163e6a] hover:bg-[#f3f4f6]"
                              >
                                <FileText className="size-3" /> Statement
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-[#77787e]">
                No remittance batches found matching the filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Unreconciled COD Queue */}
      {activeTab === "unreconciled" && (
        <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-xs">
          {unreconciledMerchants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-left text-[13px]">
                <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Merchant Company</th>
                    <th className="px-5 py-4 font-semibold">Delivered COD Shipments</th>
                    <th className="px-5 py-4 font-semibold">Collected Cash Amount</th>
                    <th className="px-5 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeef]">
                  {unreconciledMerchants.map((m) => (
                    <tr key={m.merchantId} className="text-[#45464b] hover:bg-[#fafbfc]">
                      <td className="px-5 py-4 font-bold text-[#202126]">{m.companyName}</td>
                      <td className="px-5 py-4 font-medium">{m.shipmentCount} delivered parcel(s)</td>
                      <td className="px-5 py-4 font-black text-[#163e6a]">
                        PKR {m.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => createBatch(m.merchantId)}
                          disabled={actionLoading === `create-${m.merchantId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#163e6a] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-50"
                        >
                          <Plus className="size-3.5" />
                          {actionLoading === `create-${m.merchantId}`
                            ? "Creating batch…"
                            : "Create Remittance Batch"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-[#77787e]">
              All delivered COD shipments are currently reconciled and accounted for.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
