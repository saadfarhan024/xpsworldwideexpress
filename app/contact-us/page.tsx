import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { pageWrap } from "@/components/site/styles";

export const metadata: Metadata = {
  title: "Contact Us | Go Delivery Express",
  description:
    "Get in touch with Go Delivery Express for courier, shipping, and delivery support.",
};

const fieldClass =
  "h-14 w-full rounded-full border border-[#e5e5e7] bg-white px-5.5 text-[15px] text-[#25262a] shadow-[0_2px_1px_rgba(0,0,0,0.1)] outline-none transition placeholder:text-[#85868b] focus:border-[#163e6a] focus:ring-2 focus:ring-[#163e6a]/15";

export default function ContactUsPage() {
  return (
    <main>
      <SiteHeader />
      <section
        className="relative grid min-h-100 place-items-center overflow-hidden bg-cover bg-center px-5 pb-8 pt-30 text-center text-white max-[760px]:min-h-56 max-[760px]:pb-5 max-[760px]:pt-22"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(10,11,14,0.79),rgba(10,11,14,0.67)),url(https://xpsworldwideexpress.pk/img/breadcrumb-contact.jpg)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_8%_15%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(ellipse_at_92%_5%,rgba(255,255,255,0.1),transparent_32%)]" />
        <h1 className="relative m-0 text-[clamp(42px,5vw,66px)] font-medium leading-tight">Contact Us</h1>
      </section>

      <section className="bg-[#f6f6f7] py-20 max-[760px]:py-13.5">
        <div className={`${pageWrap} grid grid-cols-[1.05fr_.95fr] items-center gap-[clamp(36px,5vw,72px)] max-[900px]:grid-cols-1 max-[900px]:gap-10`}>
          <div>
            <p className="mb-6 text-[clamp(23px,2.4vw,30px)] font-semibold text-[#ec8123]">Get in touch with us</p>
            <form action="mailto:info@godeliveryexpress.pk" method="post" encType="text/plain" className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <label className="sr-only" htmlFor="first-name">First name</label>
              <input className={fieldClass} id="first-name" name="First name" placeholder="First Name" autoComplete="given-name" required />
              <label className="sr-only" htmlFor="last-name">Last name</label>
              <input className={fieldClass} id="last-name" name="Last name" placeholder="Last Name" autoComplete="family-name" required />
              <label className="sr-only" htmlFor="email">Email</label>
              <input className={fieldClass} id="email" name="Email" type="email" placeholder="Email" autoComplete="email" required />
              <label className="sr-only" htmlFor="phone">Phone number</label>
              <input className={fieldClass} id="phone" name="Phone" type="tel" placeholder="Phone Number" autoComplete="tel" />
              <label className="sr-only col-span-2 max-[520px]:col-span-1" htmlFor="subject">Subject</label>
              <input className={`${fieldClass} col-span-2 max-[520px]:col-span-1`} id="subject" name="Subject" placeholder="Subject" required />
              <label className="sr-only col-span-2 max-[520px]:col-span-1" htmlFor="message">Message</label>
              <textarea className="col-span-2 min-h-45 resize-y rounded-[26px] border border-[#e5e5e7] bg-white px-5.5 py-4 text-[15px] text-[#25262a] shadow-[0_2px_1px_rgba(0,0,0,0.1)] outline-none transition placeholder:text-[#85868b] focus:border-[#163e6a] focus:ring-2 focus:ring-[#163e6a]/15 max-[520px]:col-span-1" id="message" name="Message" placeholder="Message" required />
              <button className="col-span-2 mt-2 min-h-13 w-fit bg-[#163e6a] px-7 text-[15px] font-semibold text-white transition hover:bg-[#ec8123] max-[520px]:col-span-1" type="submit">Send message</button>
            </form>
            <p className="mb-0 mt-4 text-xs leading-5 text-[#77787d]">Submitting opens your email app with your message addressed to our team.</p>
          </div>

          <aside
            className="relative isolate flex min-h-120 flex-col justify-between overflow-hidden rounded-[8px] bg-cover bg-center p-[clamp(28px,4vw,44px)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.17)] max-[900px]:min-h-100 max-[520px]:min-h-120"
            style={{
              backgroundImage:
                "linear-gradient(90deg,rgba(16,17,20,0.82),rgba(16,17,20,0.72)),url(https://xpsworldwideexpress.pk/img/post-thumb2-e1599202970322.jpg)",
            }}
          >
            <div>
              <h2 className="mb-3 text-[23px] font-semibold text-[#ec8123]">Contact info</h2>
              <p className="m-0 max-w-120 text-[15px] leading-[1.9] text-white/80">
                We pride ourselves on providing courier and shipping services around the world. Contact us and we’ll help you find the right solution.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-7 max-[520px]:grid-cols-1">
              <div>
                <span className="mb-3.5 grid size-12 place-items-center rounded-full border-2 border-white text-white">
                  <Phone aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mb-2 text-[15px] font-semibold text-[#ec8123]">Phone number</h3>
                <a className="block py-1 text-[14px] text-white/85 hover:text-white" href="tel:+923363587468">+92 336 3587468</a>
                <a className="block py-1 text-[14px] text-white/85 hover:text-white" href="tel:+922132410335">+92 21 32410335</a>
              </div>
              <div>
                <span className="mb-3.5 grid size-12 place-items-center rounded-full border-2 border-white text-white">
                  <MapPin aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mb-2 text-[15px] font-semibold text-[#ec8123]">Address</h3>
                <p className="m-0 max-w-55 text-[13px] uppercase leading-[1.7] tracking-[0.04em] text-white/80">
                  Shop-40 Liaquat Market, near New Memon Masjid, Bolton Market, M.A. Jinnah Road, Karachi, Pakistan
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
