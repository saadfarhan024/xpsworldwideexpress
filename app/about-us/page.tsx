import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Clock3, PackageCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { pageWrap, redEyebrow, sectionTitle, buttonRed } from "@/components/site/styles";

export const metadata: Metadata = {
  title: "About Us | XPS Worldwide Express",
  description:
    "Meet XPS Worldwide Express and learn how our people and delivery network move shipments across Pakistan and around the world.",
};

const promises = [
  {
    title: "Qualified Staff",
    description: "Our trained team provides attentive service and practical shipping guidance.",
    icon: BadgeCheck,
  },
  {
    title: "Fast Delivery",
    description: "We keep your parcels moving with dependable, time-conscious delivery options.",
    icon: Clock3,
  },
  {
    title: "Fast Tracking",
    description: "Follow your parcel through the delivery process with shipment tracking.",
    icon: PackageCheck,
  },
  {
    title: "Fair Prices",
    description: "Flexible services help you find an option that fits your shipment and budget.",
    icon: Sparkles,
  },
];

const facts = [
  "Our trained support team is ready to help resolve client questions.",
  "Our delivery network connects hubs, couriers, cargo loaders, vans, trains, and air services.",
  "Shipment updates help you know where your delivery is along the way.",
];

export default function AboutUsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="relative isolate grid min-h-85 place-items-center overflow-hidden bg-[#171719] px-5 pb-10 pt-32 text-center text-white max-[760px]:min-h-78">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_2%,rgba(255,255,255,0.15),transparent_32%),radial-gradient(ellipse_at_92%_0%,rgba(255,255,255,0.13),transparent_34%),linear-gradient(120deg,#302d2d,#080809_68%)]" />
        <div className="pointer-events-none absolute -left-20 top-6 -z-10 size-64 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -right-16 top-0 -z-10 size-72 rounded-full bg-white/5 blur-2xl" />
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">XPS Worldwide Express</p>
        <h1 className="m-0 text-[clamp(42px,5vw,66px)] font-medium leading-tight">About Us</h1>
        <div className="pointer-events-none absolute -bottom-15 left-[-12%] z-0 h-28 w-[124%] rounded-[50%] bg-white" />
      </section>

      <section className={`${pageWrap} relative z-1 grid grid-cols-[1fr_.95fr] items-center gap-[clamp(48px,8vw,112px)] py-22 max-[760px]:grid-cols-1 max-[760px]:gap-9 max-[760px]:py-15`}>
        <div>
          <p className={redEyebrow}>Moving what matters</p>
          <h2 className={sectionTitle}>We are beyond delivery</h2>
          <p className="mb-4 mt-5 text-[15px] leading-[1.9] text-[#595a60]">
            XPS Worldwide Express brings people and businesses closer to the places they need to reach. Our team helps make shipping straightforward, with attentive support at every step.
          </p>
          <p className="m-0 text-[15px] leading-[1.9] text-[#595a60]">
            Our delivery network connects hubs, couriers, cargo loaders, vans, trains, and air services to move shipments across a wide range of destinations.
          </p>
        </div>
        <div
          className="min-h-72 rounded-[120px_120px_120px_120px] bg-cover bg-center shadow-[0_16px_40px_rgba(0,0,0,0.14)] max-[760px]:min-h-64 max-[420px]:rounded-[72px]"
          role="img"
          aria-label="Cargo ship and containers at an international port"
          style={{ backgroundImage: "url(https://xpsworldwideexpress.pk/img/theme_image_11.jpg)" }}
        />
      </section>

      <section className="bg-[#e8e8e8] py-17.5 max-[760px]:py-13" aria-label="Our commitments">
        <div className={`${pageWrap} grid grid-cols-[1.15fr_.85fr] items-center gap-8.5 max-[900px]:grid-cols-1 max-[900px]:gap-9`}>
          <div className="grid grid-cols-2 gap-4.5 max-[520px]:grid-cols-1">
            {promises.map(({ title, description, icon: Icon }, index) => (
              <article key={title} className={`min-h-35 rounded-[18px] bg-white px-7 py-6 shadow-[0_8px_24px_rgba(28,30,38,0.06)] ${index % 2 === 0 ? "rounded-bl-[48px]" : "rounded-br-[48px]"}`}>
                <Icon className="mb-3.5 size-6 text-[#ed171d]" aria-hidden="true" />
                <h3 className="mb-1.5 text-[17px] font-semibold text-[#202126]">{title}</h3>
                <p className="m-0 text-[13px] leading-[1.65] text-[#62636a]">{description}</p>
              </article>
            ))}
          </div>
          <div className="max-w-125">
            <p className={redEyebrow}>Your dream. Our mission.</p>
            <h2 className="m-0 text-[clamp(30px,3.3vw,43px)] font-medium leading-[1.15] text-[#454f66]">We believe in hard work and dedication</h2>
            <p className="mb-6 mt-3.5 text-[15px] leading-[1.8] text-[#62636a]">
              We work to give every customer a smooth, dependable delivery experience, backed by a team that cares about each shipment.
            </p>
            <Button nativeButton={false} render={<a href="/services" />} className={buttonRed}>
              Our services <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <section className={`${pageWrap} grid grid-cols-[.9fr_1.1fr] items-center gap-[clamp(56px,9vw,128px)] py-22 max-[760px]:grid-cols-1 max-[760px]:gap-9 max-[760px]:py-15`}>
        <div
          className="min-h-75 rounded-[70px_70px_140px_70px] bg-cover bg-center shadow-[0_14px_35px_rgba(0,0,0,0.12)] max-[760px]:order-2 max-[760px]:min-h-64"
          role="img"
          aria-label="Courier handing a parcel to customers"
          style={{ backgroundImage: "url(https://xpsworldwideexpress.pk/img/post-thumb2-e1599202970322.jpg)" }}
        />
        <div>
          <p className={redEyebrow}>People in motion</p>
          <h2 className={sectionTitle}>Some facts</h2>
          <ul className="mt-6 grid list-none gap-4.5 p-0">
            {facts.map((fact) => (
              <li className="flex items-start gap-3.5 text-[14px] leading-[1.8] text-[#5d5e64]" key={fact}>
                <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full border-2 border-[#ed171d]" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[linear-gradient(110deg,#ed171d_0%,#b60008_56%,#211b1d_100%)] text-white">
        <div className="pointer-events-none absolute -left-22 -top-45 size-82 rounded-full border border-white/15 shadow-[0_0_0_42px_rgb(255_255_255/5%),0_0_0_84px_rgb(255_255_255/4%)]" />
        <div className={`${pageWrap} relative grid min-h-75 grid-cols-[1fr_.9fr] items-center gap-12 py-8 max-[760px]:grid-cols-1 max-[760px]:gap-7 max-[760px]:py-12`}>
          <div className="relative z-1">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.17em] text-white/75">Your next delivery starts here</p>
            <h2 className="mb-3 max-w-145 text-[clamp(28px,3.4vw,42px)] font-medium leading-[1.2]">Do you want to deliver your parcels fast?</h2>
            <p className="mb-5 text-[14px] text-white/80">We can help you find the right way to send it.</p>
            <Button nativeButton={false} render={<a href="/services" />} className="h-auto min-h-12 gap-3 rounded-[4px] bg-white px-5.5 text-[14px] font-semibold text-[#c9000b] hover:bg-white/90">
              Explore our services <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <div
            className="relative z-1 min-h-67 rounded-[110px_110px_110px_110px] bg-cover bg-center shadow-[0_18px_38px_rgba(0,0,0,0.22)] max-[760px]:min-h-58 max-[420px]:rounded-[70px]"
            role="img"
            aria-label="Courier carrying a parcel for delivery"
            style={{ backgroundImage: "url(https://xpsworldwideexpress.pk/img/4049648-scaled.jpg)" }}
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
