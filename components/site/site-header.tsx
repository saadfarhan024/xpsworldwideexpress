import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { SiteHeaderClient } from "@/components/site/site-header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardHref = user?.status === "ACTIVE"
    ? (isStaff(user.role) ? "/admin" : user.role === "MERCHANT" ? "/account" : undefined)
    : undefined;

  return <SiteHeaderClient dashboardHref={dashboardHref} />;
}
