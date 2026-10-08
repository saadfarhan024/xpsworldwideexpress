import type { Metadata } from "next";
import { AccountTokenForm } from "@/components/site/account-token-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Verify Email | XPS Worldwide Express",
  description: "Verify your email address to submit your XPS business account for review.",
};

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token: tokenParam } = await searchParams;
  const token = Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "";

  return (
    <main>
      <SiteHeader />
      <section className="relative grid min-h-65 place-items-center overflow-hidden bg-[linear-gradient(120deg,#302d2d,#080809_68%)] px-5 pb-6 pt-30 text-center text-white max-[760px]:min-h-52 max-[760px]:pt-22">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">XPS Worldwide Express</p>
          <h1 className="m-0 text-[clamp(36px,5vw,54px)] font-medium leading-tight">Verify your email</h1>
        </div>
      </section>
      <AccountTokenForm mode="verify-email" token={token} />
      <SiteFooter />
    </main>
  );
}
