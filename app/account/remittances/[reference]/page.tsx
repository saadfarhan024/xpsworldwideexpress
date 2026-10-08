import { notFound } from "next/navigation";
import { getCurrentUser, isFinanceOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";

type Props = {
  params: Promise<{ reference: string }>;
};

export default async function RemittanceStatementPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") notFound();

  const { reference } = await params;

  const where = isFinanceOrAdmin(user.role)
    ? { reference }
    : { reference, merchantId: user.merchantProfile?.id };

  const remittance = await prisma.remittance.findFirst({
    where,
    include: {
      merchant: true,
      shipments: {
        select: {
          id: true,
          trackingCode: true,
          recipientName: true,
          destinationCity: true,
          codAmount: true,
          collectedAmount: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "asc" },
      },
    },
  });

  if (!remittance) notFound();

  const isPaid = remittance.status === "PAID";

  return (
    <section className="mx-auto max-w-220 px-5 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={isFinanceOrAdmin(user.role) ? "/admin/remittances" : "/account/remittances"}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#686970] hover:text-[#163e6a]"
        >
          <ArrowLeft className="size-4" /> Back to remittances
        </Link>
        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 rounded-lg bg-[#163e6a] px-4 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#ec8123]"
        >
          <Printer className="size-3.5" /> Print Statement
        </button>
      </div>

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-8 shadow-[0_8px_24px_rgba(24,25,30,0.04)] print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#163e6a] pb-6">
          <div>
            <span className="text-[24px] font-black tracking-tight text-[#163e6a]">
              XPS <span className="text-[#ec8123]">WORLDWIDE</span>
            </span>
            <p className="m-0 text-[11px] font-bold tracking-widest uppercase text-[#45464b]">
              Express & Logistics Settlements
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-[#f0f4f8] px-3 py-1 font-mono text-[12px] font-bold text-[#163e6a]">
              {remittance.reference}
            </span>
            <p className="mb-0 mt-2 text-[12px] text-[#77787e]">
              Statement Date: {new Date(remittance.createdAt).toLocaleDateString()}
            </p>
            <p className="mb-0 mt-0.5 text-[12px] text-[#77787e]">
              Period: {new Date(remittance.periodStart).toLocaleDateString()} –{" "}
              {new Date(remittance.periodEnd).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Merchant & Settlement Summary */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-[13px] max-[600px]:grid-cols-1">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-[#85868c]">
              Account Beneficiary:
            </p>
            <p className="mb-0 mt-1 text-[16px] font-bold text-[#202126]">
              {remittance.merchant.companyName}
            </p>
            <p className="mb-0 mt-0.5 text-[#45464b]">{remittance.merchant.contactName}</p>
            <p className="mb-0 mt-0.5 text-[#45464b]">{remittance.merchant.pickupAddress}</p>
            <p className="mb-0 mt-0.5 text-[#77787e]">{remittance.merchant.city} · {remittance.merchant.phone}</p>
          </div>

          <div className="rounded-xl bg-[#f8fafc] p-4">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-[#85868c]">
              Payout Status & Reference:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-0.5 text-[12px] font-bold ${
                  isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {remittance.status}
              </span>
              {isPaid && <CheckCircle2 className="size-4 text-emerald-600" />}
            </div>
            {remittance.payoutReference && (
              <p className="mb-0 mt-2 text-[12px] text-[#45464b]">
                Bank Reference / UTR: <strong className="font-mono">{remittance.payoutReference}</strong>
              </p>
            )}
            {remittance.paidAt && (
              <p className="mb-0 mt-1 text-[12px] text-[#77787e]">
                Transferred on: {new Date(remittance.paidAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Included Shipments Breakdown Table */}
        <div className="mt-8">
          <p className="mb-3 text-[14px] font-bold text-[#202126]">
            Reconciled Deliveries ({remittance.shipments.length} parcels)
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#eeeeef]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#f8f9fa] text-[11px] uppercase tracking-wide text-[#77787e]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tracking Code</th>
                  <th className="px-4 py-3 font-semibold">Consignee</th>
                  <th className="px-4 py-3 font-semibold">Destination</th>
                  <th className="px-4 py-3 font-semibold">Delivered Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Collected Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeef]">
                {remittance.shipments.map((s) => (
                  <tr key={s.id} className="text-[#45464b]">
                    <td className="px-4 py-3 font-mono font-bold text-[#163e6a]">
                      {s.trackingCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#202126]">{s.recipientName}</td>
                    <td className="px-4 py-3">{s.destinationCity}</td>
                    <td className="px-4 py-3 text-[#77787e]">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#202126]">
                      PKR {Number(s.collectedAmount ?? s.codAmount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Summary Footer */}
        <div className="mt-6 flex justify-end">
          <div className="w-72 rounded-xl bg-[#163e6a] p-4.5 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Total Remitted Amount
            </span>
            <p className="mb-0 mt-1 text-[26px] font-black text-white">
              PKR {Number(remittance.amount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
