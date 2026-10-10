import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CommentsReport } from "@/components/site/comments-report";

export default async function CommentsReportPage() {
  const user = await requireMerchant();
  const tickets = await prisma.supportTicket.findMany({ where: { merchantId: user.merchantProfile!.id }, select: { id: true, shipmentId: true, subject: true, status: true, createdAt: true, messages: { where: { internal: false }, select: { body: true, authorId: true }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
  const shipmentIds = tickets.map((ticket) => ticket.shipmentId).filter((id): id is string => Boolean(id));
  const shipments = await prisma.shipment.findMany({ where: { merchantId: user.merchantProfile!.id, id: { in: shipmentIds } }, select: { id: true, trackingCode: true, orderDate: true, recipientName: true } });
  const shipmentMap = new Map(shipments.map((shipment) => [shipment.id, shipment]));
  const rows = tickets.map((ticket) => { const shipment = ticket.shipmentId ? shipmentMap.get(ticket.shipmentId) : undefined; const message = ticket.messages[0]; return { id: ticket.id, trackingCode: shipment?.trackingCode ?? "—", orderDate: (shipment?.orderDate ?? ticket.createdAt).toISOString(), customerName: shipment?.recipientName ?? "—", subject: ticket.subject, comment: message?.body ?? "—", commentBy: message?.authorId ? "Customer" : "Merchant", status: ticket.status }; });
  return <section className="mx-auto min-h-125 max-w-300 px-5 py-10"><CommentsReport rows={rows} /></section>;
}
