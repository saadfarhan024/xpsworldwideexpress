import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, WalletCards } from "lucide-react";

const statusPills: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-blue-50", text: "text-blue-700", label: "Pending" },
  RECONCILED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Reconciled" },
  PAID: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Paid" },
  ON_HOLD: { bg: "bg-amber-50", text: "text-amber-800", label: "On Hold" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
};

export default async function MerchantRemittancesPage() {
  const user = await requireMerchant();

  const remittances = await prisma.remittance.findMany({
    where: { merchantId: user.merchantProfile!.id },
    include: { _count: { select: { shipments: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = remittances
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const pendingReconciliation = remittances
    .filter((r) => r.status === "PENDING" || r.status === "RECONCILED")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
        Finance & settlements
      </p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">
        COD Remittances
      </h1>
      <p className="mb-0 mt-2 text-[14px] text-[#686970]">
        Review cash-on-delivery settlements, payout references, and formal account statements.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-5 max-[650px]:grid-cols-1">
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
          <p className="m-0 text-[13px] text-[#77787e]">Total COD Paid Out</p>
          <p className="mb-0 mt-2 text-[32px] font-bold text-[#163e6a]">
            PKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </article>
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
          <p className="m-0 text-[13px] text-[#77787e]">In Settlement / Processing</p>
          <p className="mb-0 mt-2 text-[32px] font-bold text-[#ec8123]">
            PKR {pendingReconciliation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </article>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        {remittances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-collapse text-left text-[13px]">
              <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Reference</th>
                  <th className="px-5 py-4 font-semibold">Period</th>
                  <th className="px-5 py-4 font-semibold">Shipments</th>
                  <th className="px-5 py-4 font-semibold">Net Payout</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Bank Ref</th>
                  <th className="px-5 py-4 font-semibold text-right">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeef]">
                {remittances.map((r) => {
                  const style = statusPills[r.status] ?? {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    label: r.status,
                  };
                  return (
                    <tr key={r.id} className="text-[#45464b] transition hover:bg-[#fafbfc]">
                      <td className="px-5 py-4 font-mono font-bold text-[#163e6a]">
                        {r.reference}
                      </td>
                      <td className="px-5 py-4">
                        {new Date(r.periodStart).toLocaleDateString()} –{" "}
                        {new Date(r.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">{r._count.shipments} orders</td>
                      <td className="px-5 py-4 font-bold text-[#202126]">
                        PKR {Number(r.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-[#77787e]">
                        {r.payoutReference || "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/account/remittances/${r.reference}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedfe2] px-3 py-1.5 text-[12px] font-semibold text-[#163e6a] hover:bg-[#f3f4f6]"
                        >
                          <FileText className="size-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <WalletCards className="mx-auto size-10 text-[#a0a1a8]" />
            <h2 className="mt-4 text-[19px] font-semibold text-[#202126]">No remittances yet</h2>
            <p className="mx-auto mb-0 mt-1 max-w-100 text-[13px] text-[#6d6e74]">
              Once your delivered COD shipments are reconciled by XPS Finance, your remittance statements and payout references will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
