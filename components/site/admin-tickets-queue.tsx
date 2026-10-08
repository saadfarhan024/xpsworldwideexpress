"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, Headphones } from "lucide-react";

type TicketSummary = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  merchant: {
    companyName: string;
    contactName: string;
    phone: string;
    user: { email: string };
  };
  assignedTo: { id: string; email: string } | null;
};

const inputClass =
  "h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", label: "Open" },
  IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", label: "In Progress" },
  WAITING_ON_CUSTOMER: { bg: "bg-amber-50", text: "text-amber-800", label: "Waiting on Customer" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
};

const priorityStyles: Record<string, string> = {
  LOW: "text-gray-500",
  NORMAL: "text-blue-600 font-medium",
  HIGH: "text-orange-600 font-semibold",
  URGENT: "text-red-600 font-bold",
};

export function AdminTicketsQueue() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const url = new URL("/api/admin/tickets", window.location.origin);
    if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
    if (priorityFilter !== "ALL") url.searchParams.set("priority", priorityFilter);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as { tickets?: TicketSummary[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? "Could not load support tickets.");
        if (!ignore) setTickets(data.tickets ?? []);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load support tickets.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, priorityFilter]);

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading support queue…</p>;

  return (
    <div className="mt-8 grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e5e6e9] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-4 text-[#163e6a]" />
          <span className="text-[13px] font-semibold text-[#202126]">Queue Filters:</span>

          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            className={inputClass}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <span className="text-[12px] text-[#85868c]">
          Showing {tickets.length} ticket(s)
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-xs">
        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 border-collapse text-left text-[13px]">
              <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Ticket</th>
                  <th className="px-5 py-4 font-semibold">Merchant</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Assigned To</th>
                  <th className="px-5 py-4 font-semibold">Updated</th>
                  <th className="px-5 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeef]">
                {tickets.map((t) => {
                  const pill = statusPills[t.status] ?? {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    label: t.status,
                  };
                  return (
                    <tr key={t.id} className="text-[#45464b] hover:bg-[#fafbfc]">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/tickets/${t.id}`}
                          className="font-semibold text-[#163e6a] hover:underline"
                        >
                          {t.subject}
                        </Link>
                        <span className="block font-mono text-[11px] text-[#85868c]">
                          #{t.id.slice(-6).toUpperCase()} · {t._count.messages} messages
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-[#202126]">
                          {t.merchant.companyName}
                        </span>
                        <span className="block text-[11px] text-[#77787e]">
                          {t.merchant.contactName} ({t.merchant.user.email})
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pill.bg} ${pill.text}`}>
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[12px] uppercase ${priorityStyles[t.priority] ?? ""}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px]">
                        {t.assignedTo ? t.assignedTo.email : <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-[#77787e]">
                        {new Date(t.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/tickets/${t.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedfe2] px-3 py-1.5 text-[12px] font-semibold text-[#163e6a] hover:bg-[#f3f4f6]"
                        >
                          Open & Reply
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#77787e]">
            <Headphones className="mx-auto size-9 text-[#a0a1a8]" />
            <p className="mt-3 text-[14px]">No support tickets match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
