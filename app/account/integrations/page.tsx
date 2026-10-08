import type { Metadata } from "next";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Integrations | Go Delivery Express",
  description: "Connect your store integrations to Go Delivery Express.",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ shopify?: string }>;
}) {
  const user = await requireMerchant();
  const integration = await prisma.shopifyIntegration.findUnique({ where: { merchantId: user.merchantProfile!.id } });
  const result = (await searchParams).shopify;

  return (
    <section className="mx-auto min-h-125 max-w-230 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Account settings</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Integrations</h1>
      <p className="mb-8 mt-3 max-w-150 text-[15px] leading-7 text-[#686970]">Connect your Shopify store so new orders can become Go Delivery shipments automatically.</p>

      {result === "connected" && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">Shopify connected successfully. New orders will sync through your registered webhooks.</p>}
      <section className="rounded-2xl border border-[#e5e6e9] bg-white p-[clamp(22px,4vw,36px)] shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ec8123]">Shopify</p>
            <h2 className="mb-2 mt-2 text-[22px] font-semibold text-[#25262a]">{integration?.uninstalledAt ? "Reconnect your store" : integration ? "Store connected" : "Connect your store"}</h2>
            <p className="m-0 max-w-130 text-[14px] leading-6 text-[#686970]">{integration?.uninstalledAt ? `The connection to ${integration.shopDomain} was removed. Reconnect to resume order syncing.` : integration ? `${integration.shopDomain} is connected and order webhooks are active.` : "Authorize Go Delivery Express in Shopify to register order and privacy webhooks."}</p>
          </div>
          <form action="/api/shopify/install" method="get" className="flex flex-wrap items-end gap-3">
            <label className="text-[12px] font-semibold text-[#45464b]">Shop domain
              <input name="shop" required pattern="[a-zA-Z0-9-]+\\.myshopify\\.com" placeholder="your-store.myshopify.com" defaultValue={integration?.shopDomain ?? ""} className="mt-1 h-11 w-62 rounded-lg border border-[#d8d9dd] px-3 text-[13px] outline-none focus:border-[#163e6a]" />
            </label>
            <button className="h-11 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white hover:bg-[#ec8123]" type="submit">{integration ? "Reconnect Shopify" : "Connect Shopify"}</button>
          </form>
        </div>
      </section>
    </section>
  );
}
