import type { Metadata } from "next";
import { MerchantProfileForm } from "@/components/site/merchant-profile-form";

export const metadata: Metadata = {
  title: "Edit Account | Go Delivery Express",
  description: "Update your Go Delivery business profile and company logo.",
};

export default function AccountProfilePage() {
  return (
    <section className="mx-auto min-h-125 max-w-230 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Account settings</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Edit Account</h1>
      <p className="mb-8 mt-3 max-w-150 text-[15px] leading-7 text-[#686970]">
        Keep your company, contact, and shipping details current. Bank details are managed by Go Delivery finance staff.
      </p>
      <MerchantProfileForm />
    </section>
  );
}
