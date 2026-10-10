import { notFound } from "next/navigation";
import { requireStaffPortal } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminTicketDetail } from "@/components/site/admin-ticket-detail";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

type Props = {
  params: Promise<{ ticketId: string }>;
};

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", label: "Open" },
  IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", label: "In Progress" },
  WAITING_ON_CUSTOMER: { bg: "bg-amber-50", text: "text-amber-800", label: "Waiting on Customer" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved" },
  CLOSED: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
};

export default async function AdminTicketDetailPage({ params }: Props) {
  const staff = await requireStaffPortal();
  const { ticketId } = await params;

  const [ticket, staffMembers] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        merchant: {
          include: { user: { select: { email: true } } },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPPORT", "OPERATIONS"] },
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" },
    }),
  ]);

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
    updatedAt: ticket.updatedAt.toISOString(),
    assignedToId: ticket.assignedToId,
    linkedShipmentCode,
    merchant: {
      id: ticket.merchant.id,
      companyName: ticket.merchant.companyName,
      contactName: ticket.merchant.contactName,
      phone: ticket.merchant.phone,
      user: { email: ticket.merchant.user.email },
    },
    messages: ticket.messages.map((m) => ({
      id: m.id,
      authorId: m.authorId,
      body: m.body,
      internal: m.internal,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return (
    <section className="mx-auto max-w-260 px-5 py-12">
      <Link
        href="/admin/tickets"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]"
      >
        <ArrowLeft className="size-4" /> Back to tickets queue
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
            <p className="mb-0 mt-1 text-[13px] text-[#686970]">
              Merchant: <strong className="text-[#202126]">{ticket.merchant.companyName}</strong> ·{" "}
              {ticket.merchant.contactName} ({ticket.merchant.user.email}) · Tel: {ticket.merchant.phone}
            </p>
          </div>

          {linkedShipmentCode && (
            <Link
              href="/admin/shipments"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedfe2] bg-[#f9fafb] px-3 py-1.5 text-[12px] font-semibold text-[#163e6a] hover:bg-white hover:underline"
            >
              <Package className="size-3.5" /> Shipment: {linkedShipmentCode}
            </Link>
          )}
        </div>
      </div>

      <AdminTicketDetail
        initialTicket={serializedTicket}
        staffMembers={staffMembers}
        currentUserId={staff.id}
      />
    </section>
  );
}
