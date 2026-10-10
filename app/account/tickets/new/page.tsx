import { requireMerchant } from "@/lib/auth/session";
import { NewTicketForm } from "@/components/site/new-ticket-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTicketPage() {
  await requireMerchant();

  return (
    <section className="mx-auto min-h-125 max-w-220 px-5 py-12">
      <Link
        href="/account/tickets"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]"
      >
        <ArrowLeft className="size-4" /> Back to suggestions / complaints
      </Link>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
        Feedback desk
      </p>
      <h1 className="m-0 text-[clamp(28px,4vw,38px)] font-semibold text-[#202126]">
        Submit a suggestion or complaint
      </h1>
      <p className="mb-0 mt-2 text-[14px] text-[#686970]">
        Reach out to our customer operations team regarding delivery issues, pickups, or account adjustments.
      </p>

      <NewTicketForm />
    </section>
  );
}
