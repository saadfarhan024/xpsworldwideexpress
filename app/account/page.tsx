import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, Clock3, RotateCcw, TrendingUp, WalletCards } from "lucide-react";
import { requireMerchant } from "@/lib/auth/session";
import { getMerchantDashboardStats } from "@/lib/merchant-dashboard";

function percentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function deliveryTime(value: number | null) {
  if (value == null) return "—";
  if (value < 1) return `${Math.max(1, Math.round(value * 24))}h`;
  return `${value.toFixed(1)}d`;
}

function currency(value: number) {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

export default async function AccountPage() {
  const user = await requireMerchant();
  const firstName = user.merchantProfile?.contactName?.split(" ")[0] ?? "there";
  const merchantId = user.merchantProfile!.id;
  const stats = await getMerchantDashboardStats(merchantId);
  const cards = [
    { label: "Delivered rate", value: percentage(stats.deliveredRate), detail: "All-time delivery success", icon: TrendingUp },
    { label: "Return rate", value: percentage(stats.returnRate), detail: "All-time returned shipments", icon: RotateCcw },
    { label: "Avg delivery time", value: deliveryTime(stats.averageDeliveryDays), detail: "From booking to delivery", icon: Clock3 },
    { label: "Active shipments", value: String(stats.activeShipments), detail: "Currently in progress", icon: Activity },
    { label: "Pending COD", value: currency(stats.pendingCod), detail: "Outstanding collection", icon: WalletCards },
    { label: "Shipments this month", value: String(stats.shipmentsThisMonth), detail: "Created this calendar month", icon: CalendarDays },
  ];

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Merchant dashboard</p>
      <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold text-[#202126]">Welcome back, {firstName}</h1>
      <p className="mb-9 mt-3 max-w-160 text-[15px] leading-7 text-[#686970]">Monitor delivery performance, shipment activity, and outstanding COD from one place.</p>
      <div className="grid grid-cols-3 gap-5 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]" key={label}>
            <Icon className="mb-5 size-6 text-[#ec8123]" aria-hidden="true" />
            <p className="m-0 text-[13px] font-medium text-[#6d6e74]">{label}</p>
            <p className="mb-1 mt-1 !text-[46px] font-bold leading-none text-[#163e6a]">{value}</p>
            <p className="m-0 text-[12px] text-[#85868c]">{detail}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e5e6e9] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ec8123]">Shipment overview</p>
            <h2 className="mb-0 mt-1 text-[20px] font-semibold text-[#25262a]">Total orders: {stats.totalOrders}</h2>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-lg bg-[#163e6a] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#ec8123]" href="/account/orders">View Orders <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {stats.statuses.map((status) => (
            <div className="relative flex min-h-25 items-center justify-between gap-4 overflow-hidden rounded-xl border border-[#e1e5ea] bg-white p-4 shadow-[0_6px_18px_rgba(24,25,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#163e6a]/30 hover:shadow-[0_10px_24px_rgba(24,25,30,0.1)]" key={status.key}>
              <span className="absolute inset-x-0 top-0 h-1 bg-[#ec8123]" aria-hidden="true" />
              <span className="min-w-0 pr-2 text-[20px] font-bold leading-5.5 text-[#34363d]">{status.label}</span>
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#163e6a] text-[24px] font-black leading-none text-white shadow-sm">{status.count}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-[#e5e6e9] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-[20px] font-semibold text-[#25262a]">Recent shipments</h2>
          <Link className="text-[13px] font-semibold text-[#163e6a] hover:underline" href="/account/shipments">View all shipments</Link>
        </div>
        {stats.recentShipments.length ? (
          <div className="mt-4 divide-y divide-[#eeeeef]">
            {stats.recentShipments.map((shipment) => (
              <Link className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px] hover:text-[#163e6a]" href={`/account/shipments/${shipment.trackingCode}`} key={shipment.trackingCode}>
                <span><strong className="font-mono font-semibold">{shipment.trackingCode}</strong><span className="ml-3 text-[#85868c]">{shipment.destinationCity}</span></span>
                <span className="text-[#686970]">{shipment.status.toLowerCase().replaceAll("_", " ")}</span>
              </Link>
            ))}
          </div>
        ) : <p className="mb-0 mt-3 text-[14px] text-[#6d6e74]">You have not created any shipments yet.</p>}
      </section>
    </section>
  );
}
