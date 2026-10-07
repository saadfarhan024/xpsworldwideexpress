import type { Metadata } from "next";
import { FaCircleNotch } from "react-icons/fa";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { pageWrap, sectionTitle } from "@/components/site/styles";

export const metadata: Metadata = {
  title: "Careers | XPS Worldwide Express",
  description:
    "Explore career opportunities and employee benefits at XPS Worldwide Express.",
};

const benefits = [
  "An open-door culture with a supportive learning environment.",
  "Opportunities to grow through promotions.",
  "Transfers based on employee interests.",
  "Intensive training and development programs.",
  "Commission and bonus programs for the sales team.",
  "Accommodation for employees working in other regions.",
];

export default function CareerPage() {
  return (
    <main>
      <SiteHeader />
      <section
        id="career-hero"
        className="relative grid h-[52svh] min-h-110 max-h-170 place-items-center bg-cover bg-[center_48%] text-white max-[760px]:h-[62svh] max-[760px]:min-h-120"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(9,10,12,0.68),rgba(9,10,12,0.55)),url(https://xpsworldwideexpress.pk/img/breadcrumb-carrier.jpg)",
        }}
      >
        <div className="relative z-10 px-5 pt-24 text-center">
          <h1 className="m-0 text-[clamp(42px,5vw,72px)] font-normal leading-tight text-white">
            Careers at XPS
          </h1>
        </div>
      </section>

      <ScrollReveal>
        <section
          className={`${pageWrap} grid grid-cols-[1fr_.88fr] items-center gap-[clamp(40px,6vw,96px)] py-25 max-[1100px]:gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-8 max-[760px]:py-16`}
          id="career-overview"
        >
          <div className="max-w-137.5">
            <h2 className={sectionTitle}>Our Career</h2>
            <p className="my-6.25 mb-7.75 text-[16px] leading-[1.9] text-[#515257]">
              Our team works together to solve logistics and courier challenges and improve the services we offer. We welcome recent graduates and experienced professionals interested in internships, management trainee programs, and other roles at XPS.
            </p>
          </div>
          <div
            className="min-h-105 rounded-[10px] bg-cover bg-center shadow-[0_0_22px_0_rgba(0,0,0,0.12)] max-[760px]:min-h-85 max-[420px]:min-h-70"
            role="img"
            aria-label="A courier handing a parcel to a customer"
            style={{ backgroundImage: "url(https://xpsworldwideexpress.pk/img/h19hlda8v0m2d0urc.jpg)" }}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-[#e6e6e6]">
          <div
            className={`${pageWrap} grid grid-cols-[1fr_.88fr] items-center gap-[clamp(40px,6vw,96px)] py-25 max-[1100px]:gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-8 max-[760px]:py-16`}
            id="career-benefits"
          >
            <div
              className="relative flex min-h-105 items-end overflow-hidden rounded-[10px] bg-cover bg-center p-[clamp(28px,5vw,64px)] text-white shadow-[0_0_22px_0_rgba(0,0,0,0.18)] max-[760px]:min-h-85 max-[420px]:min-h-70"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,rgba(9,10,12,0.76),rgba(9,10,12,0.34)),linear-gradient(0deg,rgba(9,10,12,0.62),transparent 78%),url(https://xpsworldwideexpress.pk/img/CTA-About-new.png)",
              }}
            >
              <div className="max-w-105">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Job Offers</p>
                <h2 className="mb-4 text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.12] text-white">
                  Find your place at XPS
                </h2>
                <p className="m-0 max-w-95 text-base leading-7 text-white/90">
                  Have questions about the opportunities and benefits we offer our employees? We’d be happy to help.
                </p>
              </div>
            </div>

            <div className="max-w-137.5">
              <h2 className="m-0 text-[clamp(28px,3vw,38px)] font-medium text-[#202126]">Benefits at XPS</h2>
              <ul className="my-6 grid list-none gap-4.5 p-0 text-[16px] leading-[1.8] text-[#515257]">
                {benefits.map((benefit) => (
                  <li className="flex items-start gap-3.5" key={benefit}>
                    <FaCircleNotch aria-hidden="true" className="mt-1.5 shrink-0 text-[#c9272c]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <a
                className="inline-flex items-center rounded-md bg-[#ed171d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90d13] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ed171d]"
                href="/contact-us"
              >
                Ask about career opportunities
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <SiteFooter />
    </main>
  );
}
