import { MapPin } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import { Brand } from "@/components/site/brand";
import { pageWrap } from "@/components/site/styles";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
];

const importantLinks = [
  { label: "Services", href: "/services" },
  { label: "Career", href: "/career" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

function FooterLinks({ title, links }: { title: string; links: typeof quickLinks }) {
  return (
    <div className="flex flex-col items-start gap-3.5">
      <h3 className="mb-2 mt-1 text-[19px] font-semibold text-[#111] max-[760px]:text-[17px]">{title}</h3>
      {links.map((link) => (
        <a key={link.label} className="text-[14px] text-[#45464a] transition-colors hover:text-[#163e6a]" href={link.href}>{link.label}</a>
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#f1f2f4] px-0 pb-6.25 pt-17.5 max-[760px]:pt-13.75">
      <div className={`${pageWrap} grid grid-cols-[1.55fr_.72fr_.82fr_1.12fr] gap-11.25 max-[1100px]:gap-7 max-[760px]:grid-cols-2 max-[760px]:gap-x-6.25 max-[760px]:gap-y-9.5`}>
        <div>
          <div className="mb-5.75"><Brand /></div>
          <p className="text-[14px] leading-[1.8] text-[#505156]">XPS Worldwide Express aiming to disrupt the logistics &amp; courier industry of Pakistan. We are on a mission to provide the best services.</p>
        </div>
        <FooterLinks title="Quick Links" links={quickLinks} />
        <FooterLinks title="Important Links" links={importantLinks} />
        <div className="max-[760px]:col-span-full max-[420px]:col-span-full">
          <h3 className="mb-5.5 mt-1 text-[19px] font-semibold text-[#111] max-[760px]:text-[17px]">Address</h3>
          <p className="mb-4.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-[#505156]"><MapPin className="mt-0.75 size-4.25 shrink-0 text-[#163e6a]" /> Shop-40 Liaqat Market Near New Memon Masjid Bolton Market M.A Jinnah Road Karachi, Pakistan</p>
          <h3 className="mb-3.25 mt-5 text-[19px] font-semibold text-[#111] max-[760px]:text-[17px]">Chat with us</h3>
          <div className="flex gap-2.75">
            <a className="text-[#163e6a] transition-colors hover:opacity-80" href="https://www.facebook.com/XPSWorldwideExpress" target="_blank" rel="noreferrer" aria-label="Chat with XPS on Facebook"><FaFacebook className="size-8.5" /></a>
            <a className="text-[#e1306c] transition-colors hover:opacity-80" href="https://www.instagram.com/xpsworldwideexpress/" target="_blank" rel="noreferrer" aria-label="Chat with XPS on Instagram"><FaInstagram className="size-8.5" /></a>
            <a className="text-[#25d366] transition-colors hover:opacity-80" href="https://wa.me/923363587468" target="_blank" rel="noreferrer" aria-label="Chat with XPS on WhatsApp"><FaWhatsapp className="size-8.5" /></a>
          </div>
        </div>
      </div>
      <div className="mx-6 mt-13.5 flex flex-wrap items-center justify-center gap-2.5 text-center text-[12px] text-[#35363a] max-[760px]:mt-10.5 max-[760px]:gap-1.75 max-[760px]:text-[11px]">
        © Copyright {new Date().getFullYear()}, XPS Worldwide Express <span className="size-0.75 rounded-full bg-[#8c8d91]" /> All rights reserved <span className="size-0.75 rounded-full bg-[#8c8d91]" /> Designed by <b className="font-semibold text-[#163e6a]">IT Vision (Pvt.) LTD.</b>
      </div>
    </footer>
  );
}
