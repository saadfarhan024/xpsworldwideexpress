import type { Metadata } from "next";
import { Clock3, PackageCheck, ShieldCheck } from "lucide-react";
import { pageWrap, orangeEyebrow } from "@/components/site/styles";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Our Services | Go Delivery Express",
  description:
    "Ocean, train, air, road, logistics, and packaging services from Go Delivery Express.",
};

const services = [
  {
    title: "Ocean Freight",
    description:
      "We work closely with major seaports around the world to move your cargo reliably.",
    image: "https://xpsworldwideexpress.pk/img/img-cap6-300x300-1.jpg",
    alt: "Cargo ship and containers at an international port",
  },
  {
    title: "Train Freight",
    description:
      "Comprehensive transport for urgent, valuable, fragile, and oversized cargo.",
    image: "https://xpsworldwideexpress.pk/img/img-cap1-300x300-1.jpg",
    alt: "Freight train carrying cargo",
  },
  {
    title: "Air Freight",
    description:
      "Fast international connections for urgent and high-priority shipments.",
    image: "https://xpsworldwideexpress.pk/img/img-cap3-300x300-1.jpg",
    alt: "Air freight aircraft ready for departure",
  },
  {
    title: "Go Delivery Logistics",
    description:
      "Forwarding that moves goods safely, economically, and efficiently to your customers.",
    image: "https://xpsworldwideexpress.pk/img/img-cap4-300x300-1.jpg",
    alt: "Logistics workers coordinating a shipment",
  },
  {
    title: "Road Freight",
    description:
      "Road transport for business and personal effects, tailored to your delivery needs.",
    image:
      "https://xpsworldwideexpress.pk/img/img-cap2-1-qwto1z24zwp4crbeopfjro3dchiepuw7o8txth4cs8.jpg",
    alt: "Road freight truck transporting cargo",
  },
  {
    title: "Packaging",
    description:
      "Professional packing helps protect your belongings through every leg of the journey.",
    image:
      "https://xpsworldwideexpress.pk/img/theme_image_02-qwto1z2diw7xg5htuo0r5dnwgbm4tslrter023uxds.jpg",
    alt: "Carefully packed goods prepared for transport",
  },
];

const serviceBenefits = [
  {
    title: "We Make It Faster",
    description:
      "Get documents, parcels, and other shipments moving with express delivery options.",
    icon: Clock3,
  },
  {
    title: "24/7 Availability",
    description:
      "Arrange shipments on your schedule with support when you need it.",
    icon: ShieldCheck,
  },
  {
    title: "On Time Delivery",
    description:
      "Track your parcel and stay informed from collection through arrival.",
    icon: PackageCheck,
  },
];

export default function ServicesPage() {
  return (
    <main>
      <SiteHeader />
      <section
        id="services-hero"
        className="relative grid h-[52svh] min-h-110 max-h-170 place-items-center bg-cover bg-[center_48%] text-white max-[760px]:h-[44svh] max-[760px]:min-h-64"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(9,10,12,0.68),rgba(9,10,12,0.55)),url(https://xpsworldwideexpress.pk/img/theme_image_02.jpg)",
        }}
      >
        <div className="relative z-10 px-5 pt-24 text-center max-[760px]:pt-20">
          <h1 className="m-0 text-[clamp(42px,5vw,72px)] font-normal leading-tight text-white">
            Our Services
          </h1>
        </div>
      </section>

      <ScrollReveal>
        <section
          id="services"
          className={`${pageWrap} py-25 max-[760px]:py-16`}
          aria-label="Freight and logistics services"
        >
          <div className="grid grid-cols-3 gap-x-10 gap-y-16 max-[900px]:grid-cols-2 max-[760px]:gap-x-5 max-[760px]:gap-y-12 max-[520px]:grid-cols-1">
            {services.map((service) => (
              <article key={service.title} className="min-w-0 text-center">
                <div
                  className="aspect-square w-full bg-cover bg-center"
                  role="img"
                  aria-label={service.alt}
                  style={{ backgroundImage: `url(${service.image})` }}
                />
                <h2 className="mb-3 mt-6 text-[clamp(24px,2.5vw,34px)] font-medium text-[#ec8123]">
                  {service.title}
                </h2>
                <p className="mx-auto mb-0 max-w-[38ch] text-[15px] leading-[1.7] text-neutral-600">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-[#f3f4f5] py-20 max-[760px]:py-14" id="experience">
          <div className={`${pageWrap} grid grid-cols-[.9fr_1.1fr] items-center gap-16 max-[760px]:grid-cols-1 max-[760px]:gap-10`}>
            <div>
              <p className={orangeEyebrow}>Experience that moves with you</p>
              <h2 className="mb-5 mt-0 text-[clamp(34px,4vw,52px)] font-normal leading-tight text-neutral-900">
                <span className="block text-[clamp(64px,8vw,104px)] font-semibold leading-none text-[#ec8123]">20</span>
                Years of Experience
              </h2>
              <p className="mb-0 max-w-[60ch] text-[16px] leading-[1.8] text-neutral-600">
                Go Delivery Express is an international freight forwarder, providing first-class import and export services by sea, air, and road for businesses and personal shipments.
              </p>
            </div>
            <div className="divide-y divide-neutral-300 border-y border-neutral-300">
              {serviceBenefits.map(({ title, description, icon: Icon }) => (
                <article key={title} className="grid grid-cols-[auto_1fr] gap-5 py-6">
                  <span className="grid size-12 place-items-center rounded-full bg-white text-[#ec8123]">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="mb-2 mt-0 text-lg font-semibold text-neutral-900">{title}</h3>
                    <p className="mb-0 text-sm leading-[1.65] text-neutral-600">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <SiteFooter />
    </main>
  );
}
