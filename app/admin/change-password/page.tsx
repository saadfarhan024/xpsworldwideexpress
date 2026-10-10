import { ChangePasswordForm } from "@/components/site/change-password-form";
import { requireAdminPortal } from "@/lib/auth/session";

export default async function AdminChangePasswordPage() {
  await requireAdminPortal();
  return <section className="mx-auto min-h-125 max-w-230 px-5 py-12"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Account settings</p><h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Change password</h1><p className="mb-8 mt-3 max-w-150 text-[15px] leading-7 text-[#686970]">Protect your staff account with a new password.</p><ChangePasswordForm /></section>;
}
