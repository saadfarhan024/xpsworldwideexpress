import { notFound } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MerchantTicketThread } from "@/components/site/merchant-ticket-thread";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

type Props = {
  params: Promise<{ ticketId: string }>;
};

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", label: "Open" },
  IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", label: "In Progress" },
  WAITING_ON_CUSTOMER: { bg: "bg-amber-50", text: "text-amber-800", label: "Awaiting Your Reply" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
};

export default async function MerchantTicketDetailPage({ params }: Props) {
  const user = await requireMerchant();
  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      merchantId: user.merchantProfile!.id,
    },
    include: {
      messages: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  let linkedShipmentCode: string | null = null;
  if (ticket.shipmentId) {
    const s = await prisma.shipment.findUnique({
      where: { id: ticket.shipmentId },
      select: { trackingCode: true },
    });
    linkedShipmentCode = s?.trackingCode ?? null;
  }

  const pill = statusPills[ticket.status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: ticket.status,
  };

  const serializedTicket = {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    linkedShipmentCode,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      authorId: m.authorId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return (
    <section className="mx-auto max-w-230 px-5 py-12">
      <Link
        href="/account/tickets"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]"
      >
        <ArrowLeft className="size-4" /> Back to suggestions / complaints
      </Link>

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] font-bold text-[#85868c]">
                #{ticket.id.slice(-6).toUpperCase()}
              </span>
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${pill.bg} ${pill.text}`}>
                {pill.label}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Priority: {ticket.priority}
              </span>
            </div>
            <h1 className="mb-0 mt-2 text-[22px] font-bold text-[#202126]">{ticket.subject}</h1>
            <p className="mb-0 mt-1 text-[12px] text-[#85868c]">
              Opened {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>

          {linkedShipmentCode && (
            <Link
              href={`/account/shipments/${linkedShipmentCode}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedfe2] bg-[#f9fafb] px-3 py-1.5 text-[12px] font-semibold text-[#163e6a] hover:bg-white hover:underline"
            >
              <Package className="size-3.5" /> Shipment: {linkedShipmentCode}
            </Link>
          )}
        </div>
      </div>

      <MerchantTicketThread initialTicket={serializedTicket} currentUserId={user.id} />
    </section>
  );
}
