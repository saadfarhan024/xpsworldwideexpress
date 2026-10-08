import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", label: "Open" },
  IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", label: "In Progress" },
  WAITING_ON_CUSTOMER: { bg: "bg-amber-50", text: "text-amber-800", label: "Awaiting Your Reply" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
};

const priorityPills: Record<string, { text: string }> = {
  LOW: { text: "text-gray-500" },
  NORMAL: { text: "text-blue-600" },
  HIGH: { text: "text-orange-600" },
  URGENT: { text: "text-red-600 font-bold" },
};

export default async function MerchantTicketsPage() {
  const user = await requireMerchant();

  const tickets = await prisma.supportTicket.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: { where: { internal: false } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
            Customer Support
          </p>
          <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">
            Support Tickets
          </h1>
        </div>
        <Link
          href="/account/tickets/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-4 text-[13px] font-semibold text-white hover:bg-[#ec8123]"
        >
          <Plus className="size-4" /> Open new ticket
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        {tickets.length > 0 ? (
          <div className="divide-y divide-[#eeeeef]">
            {tickets.map((t) => {
              const pill = statusPills[t.status] ?? {
                bg: "bg-gray-100",
                text: "text-gray-700",
                label: t.status,
              };
              const prio = priorityPills[t.priority] ?? { text: "text-gray-600" };

              return (
                <Link
                  key={t.id}
                  href={`/account/tickets/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-[#fafbfc]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[12px] font-bold text-[#85868c]">
                        #{t.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pill.bg} ${pill.text}`}>
                        {pill.label}
                      </span>
                      <span className={`text-[11px] uppercase tracking-wider ${prio.text}`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="mb-0 mt-1.5 text-[15px] font-semibold text-[#202126]">
                      {t.subject}
                    </p>
                    <p className="mb-0 mt-1 text-[12px] text-[#85868c]">
                      Opened {new Date(t.createdAt).toLocaleDateString()} · Updated{" "}
                      {new Date(t.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[13px] text-[#77787e]">
                    <MessageSquare className="size-4" />
                    <span>{t._count.messages} message(s)</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <MessageSquare className="mx-auto size-10 text-[#a0a1a8]" />
            <h2 className="mt-4 text-[19px] font-semibold text-[#202126]">No tickets opened yet</h2>
            <p className="mx-auto mb-6 mt-1 max-w-100 text-[13px] text-[#6d6e74]">
              Have a question or need assistance with deliveries? Our support desk is ready to help.
            </p>
            <Link
              href="/account/tickets/new"
              className="inline-flex min-h-11 items-center rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white hover:bg-[#ec8123]"
            >
              Open new ticket
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
