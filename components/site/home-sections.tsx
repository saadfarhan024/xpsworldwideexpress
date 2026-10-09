import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plane,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WhyCarousel from "@/components/why-carousel";
import {
  buttonBase,
  buttonPrimary,
  eyebrow,
  pageWrap,
  orangeEyebrow,
  sectionTitle,
} from "@/components/site/styles";

const freightModes = [
  { name: "Warehousing Services", icon: Warehouse },
  { name: "Air Freight Services", icon: Plane },
  { name: "Ocean Freight Services", icon: Ship },
  { name: "Road Freight Services", icon: Truck },
];

const reasons = [
  "Customer satisfaction with each delivery.",
  "Delivery time selection option.",
  "Quick transfer of cash.",
  "Same day delivery option.",
  "Shipment tracking from pickup to arrival.",
  "Interactive customer support.",
];

export function FreightRibbon() {
  return (
    <section className="relative z-1 bg-[#163e6a] text-white" aria-label="Our freight services">
      <div className={`${pageWrap} grid grid-cols-4 max-[760px]:w-full max-[760px]:grid-cols-2`}>
        {freightModes.map(({ name, icon: Icon }, index) => (
          <a
            key={name}
            className={`group flex min-h-28 items-center gap-4.25 border-white/25 px-6.25 py-5 text-[17px] transition-colors hover:bg-[#ec8123]/20 max-[1100px]:gap-3 max-[1100px]:px-4 max-[1100px]:text-[14px] max-[760px]:min-h-22 max-[760px]:border-b max-[760px]:px-5 max-[420px]:gap-2.25 max-[420px]:px-3 max-[420px]:text-[12px] ${index === 0 ? "border-x" : "border-r"}`}
            href="#services"
          >
            <Icon className="size-8.75 shrink-0 stroke-[1.35] max-[760px]:size-7.25" />
            <span>{name}</span>
            <ArrowUpRight className="ml-auto size-3.75 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 max-[760px]:hidden" />
          </a>
        ))}
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section className={`${pageWrap} grid grid-cols-[1fr_.88fr] items-center gap-[clamp(52px,8vw,130px)] py-33 max-[1100px]:gap-12.5 max-[760px]:grid-cols-1 max-[760px]:gap-9.5 max-[760px]:py-19.5`} id="about">
      <div
        className="min-h-120 rounded-[100px_100px_300px_100px] bg-cover bg-center shadow-[0_0_22px_0_rgba(0,0,0,0.12)] max-[760px]:min-h-92.5 max-[420px]:min-h-75"
        role="img"
        aria-label="A courier handing a parcel to a customer"
        style={{ backgroundImage: "url(/2963.jpg)" }}
      />
      <div className="max-w-137.5">
        <p className={orangeEyebrow}>Go Delivery Express</p>
        <h2 className={sectionTitle}>We Have Smart Solutions For You</h2>
        <p className="my-6.25 mb-7.75 text-[16px] leading-[1.9] text-[#515257]">
          With Go Delivery Express, you’ve got a range of options for your important export and import heavy shipments. We make it quick and easy to find out exactly how to get your shipment ready, tracked and monitored.
        </p>
        <Button nativeButton={false} render={<a href="/about-us" />} className={buttonPrimary}>
          About Us <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

export function PromiseSection() {
  return (
    <section
      className="relative isolate grid min-h-102.5 place-items-center bg-cover bg-position-[center_53%] px-6 py-17.5 text-center text-white"
      style={{ backgroundImage: "linear-gradient(90deg,rgb(25 19 17 / 80%),rgb(14 16 21 / 67%)),url(/Shiping-Truck.jpg)" }}
    >
      <div className="max-w-192.5">
        <p className={eyebrow}>Reliable by design</p>
        <h2 className="mb-4 text-[clamp(32px,4vw,47px)] font-medium uppercase">What We Can Do For You?</h2>
        <p className="mx-auto mb-6.75 max-w-175 text-[16px] leading-[1.8] text-white/85">
          Our goal is to deliver your package in less time. We strive for outstanding performance, quality, and professional customer support. What we have to offer is ready when you are.
        </p>
        <Button nativeButton={false} render={<a href="#services" />} className={buttonPrimary}>
          More Services <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

export function WhySection() {
  return (
    <section className="bg-[#f2f3f5] py-26.25 max-[760px]:py-19" id="why-us">
      <div className={`${pageWrap} grid grid-cols-[.8fr_1.2fr] items-center gap-20 max-[1100px]:gap-10.5 max-[760px]:grid-cols-1 max-[760px]:gap-8.75`}>
        <div>
          <p className={orangeEyebrow}>The Go Delivery difference</p>
          <h2 className="m-0 max-w-110 text-[clamp(35px,4vw,49px)] font-normal leading-[1.12] text-[#111]">Why Go Delivery Express?</h2>
          <ul className="mt-8 grid list-none gap-4.5 p-0">
            {reasons.map((reason) => (
              <li className="flex items-center gap-3 text-[16px] text-[#606166]" key={reason}>
                <Check className="size-4.5 shrink-0 stroke-[2.5] text-[#163e6a]" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <WhyCarousel />
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="relative isolate mx-4 my-6 overflow-hidden rounded-[96px_16px_160px_16px] bg-[linear-gradient(115deg,#163e6a,#163e6a_62%,#163e6a)] py-25 text-white shadow-[0_22px_60px_rgba(50,0,0,0.18)] max-[760px]:mx-2 max-[760px]:my-4 max-[760px]:rounded-[48px_12px_88px_12px] max-[760px]:py-18" id="contact">
      <div className="pointer-events-none absolute -left-25 -top-48.75 size-75 rounded-full border border-white/10 shadow-[0_0_0_45px_rgb(255_255_255/4%),0_0_0_90px_rgb(255_255_255/3%)]" />
      <div className="pointer-events-none absolute -bottom-52.5 -right-25 size-100 rounded-full border border-white/10 shadow-[0_0_0_55px_rgb(255_255_255/4%)]" />
      <div className={`${pageWrap} relative z-1 grid grid-cols-[1fr_.9fr] items-center gap-18 max-[760px]:grid-cols-1 max-[760px]:gap-8.75`}>
        <div>
          <p className={eyebrow}>Your delivery, in good hands</p>
          <h2 className="m-0 max-w-152.5 text-[clamp(34px,4.5vw,58px)] font-normal leading-[1.1] uppercase max-[760px]:text-[38px]">Reach Your Destination 100% Sure And Safe</h2>
          <p className="my-5.25 mb-7.25 text-[16px] text-white/80">We will take care of your delivery and deliver it safe and on time.</p>
          <Button nativeButton={false} render={<a href="mailto:info@godeliveryexpress.pk" />} className={`${buttonBase} bg-white text-[#ec8123] hover:bg-[#f3f3f3]`}>
            Contact Us <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-80 rounded-[300px_100px_100px_100px] bg-cover bg-center shadow-[0_0_22px_0_rgba(0,0,0,0.12)] max-[760px]:min-h-70" role="img" aria-label="Courier delivering a package from a van" style={{ backgroundImage: "url(/4049549.jpg)" }} />
      </div>
    </section>
  );
}
