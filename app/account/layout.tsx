import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SiteFooter } from "@/components/site/site-footer";
import { PortalSidebar } from "@/components/site/portal-sidebar";
import { requireMerchant } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireMerchant();
  const companyName = user.merchantProfile?.companyName ?? user.email;
  const items = [
    { href: "/account", label: "Dashboard", icon: "LayoutDashboard" as const },
    { href: "/account/shipments/new", label: "Create shipment", icon: "PackagePlus" as const },
    { href: "/account/shipments", label: "Shipments", icon: "Boxes" as const },
    { href: "/account/pickups", label: "Generate load sheet", icon: "ClipboardList" as const },
    { href: "/account/load-sheets", label: "Load sheet log", icon: "FileClock" as const },
    { href: "/account/remittances", label: "Remittances", icon: "ChartNoAxesCombined" as const },
    { href: "/account/tickets", label: "Support", icon: "MessageSquareText" as const },
    { href: "/account/integrations", label: "Integrations", icon: "Cable" as const },
    { href: "/account/profile", label: "Profile", icon: "CircleUserRound" as const },
  ];

  return <SidebarProvider><PortalSidebar items={items} companyName={companyName} /><SidebarInset className="dashboard-scale bg-[#f6f6f7]"><header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-[#dfe3e8] bg-[#163e6a] px-4 text-white shadow-sm"><SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" /><Link className="text-[13px] font-bold uppercase tracking-[0.12em]" href="/account">Merchant dashboard</Link></header>{children}<SiteFooter /></SidebarInset></SidebarProvider>;
}
