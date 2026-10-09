import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PortalSidebar } from "@/components/site/portal-sidebar";
import { requireAdminPortal } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPortal();
  const items = [
    { href: "/admin", label: "Overview", icon: "BarChart3" as const, show: true },
    { href: "/admin/pickups", label: "Pickup queue", icon: "ClipboardList" as const, show: user.role === "ADMIN" || user.role === "OPERATIONS" },
    { href: "/admin/shipments", label: "Shipments", icon: "Boxes" as const, show: user.role === "ADMIN" || user.role === "OPERATIONS" },
    { href: "/admin/remittances", label: "COD remittances", icon: "Landmark" as const, show: user.role === "ADMIN" || user.role === "FINANCE" },
    { href: "/admin/merchants", label: "Merchants", icon: "Store" as const, show: true },
    { href: "/admin/tickets", label: "Support tickets", icon: "Ticket" as const, show: user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "OPERATIONS" },
    { href: "/admin/staff", label: "Staff accounts", icon: "Users" as const, show: user.role === "ADMIN" },
    { href: "/admin/audit", label: "Audit log", icon: "FileClock" as const, show: user.role === "ADMIN" },
    { href: "/admin/settings", label: "System settings", icon: "Settings" as const, show: user.role === "ADMIN" },
  ].filter((item) => item.show);

  return <SidebarProvider><PortalSidebar items={items} admin /><SidebarInset className="dashboard-scale bg-[#f6f6f7]"><header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-[#0f3155] bg-[#163e6a] px-4 text-white shadow-sm"><SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" /><Link className="text-[13px] font-bold uppercase tracking-[0.12em]" href="/admin">Admin dashboard</Link></header>{children}</SidebarInset></SidebarProvider>;
}
