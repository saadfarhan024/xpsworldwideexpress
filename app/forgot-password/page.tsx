import type { Metadata } from "next";
import { AccountAccessForm } from "@/components/site/account-access-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Forgot Password | XPS Worldwide Express",
  description: "Request help resetting your XPS Worldwide Express account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main>
      <SiteHeader />
      <section
        className="relative grid min-h-75 place-items-center overflow-hidden bg-cover bg-center px-5 pb-6 pt-30 text-center text-white max-[760px]:min-h-65"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(10,11,14,0.8),rgba(10,11,14,0.72)),url(https://xpsworldwideexpress.pk/img/Shiping-Truck.jpg)",
        }}
      >
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">XPS Worldwide Express</p>
          <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-medium leading-tight">Forgot Password</h1>
        </div>
      </section>
      <AccountAccessForm mode="forgot-password" />
      <SiteFooter />
    </main>
  );
}
