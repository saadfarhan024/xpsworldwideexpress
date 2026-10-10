import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/site/change-password-form";

export const metadata: Metadata = {
  title: "Change Password | Go Delivery Express",
  description: "Change your Go Delivery Express account password.",
};

export default function ChangePasswordPage() {
  return (
    <section className="mx-auto min-h-125 max-w-170 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Account settings</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Change password</h1>
      <p className="mb-8 mt-3 max-w-150 text-[15px] leading-7 text-[#686970]">
        Confirm your current password, then choose a new one. You will be signed out on all devices afterwards.
      </p>
      <ChangePasswordForm />
    </section>
  );
}
