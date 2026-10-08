import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TrackingForm } from "@/components/site/tracking-form";

export const metadata: Metadata = {
  title: "Package Tracking | Go Delivery Express",
  description: "Track your Go Delivery Express shipment.",
};

export default function TrackingPage() {
  return (
    <main>
      <SiteHeader />
      <section
        className="relative grid min-h-80 place-items-center overflow-hidden bg-cover bg-center px-5 pb-6 pt-30 text-center text-white max-[760px]:min-h-56 max-[760px]:pt-22"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(10,11,14,0.8),rgba(10,11,14,0.72)),url(https://xpsworldwideexpress.pk/img/Shiping-Truck.jpg)",
        }}
      >
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Go Delivery Express</p>
          <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-medium leading-tight">Package Tracking</h1>
        </div>
      </section>
      <TrackingForm />
      <SiteFooter />
    </main>
  );
}
