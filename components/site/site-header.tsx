"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/site/brand";
import { MobileNavigation } from "@/components/site/mobile-navigation";
import { pageWrap } from "@/components/site/styles";

const links = [
    { label: "Home", href: "/" },
    { label: "About us", href: "/about-us" },
    { label: "Services", href: "/services" },
    { label: "Our Career", href: "/career" },
    { label: "Contact us", href: "/contact-us" },
    { label: "Track Order", href: "/tracking" },
];

const mobileLinks = [
    ...links.slice(0, 5),
    { label: "Login", href: "/login" },
    { label: "Register", href: "/register" },
    links[5],
];

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateScrollState = () => setIsScrolled(window.scrollY > 24);
        const frame = window.requestAnimationFrame(updateScrollState);
        window.addEventListener("scroll", updateScrollState, { passive: true });

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", updateScrollState);
        };
    }, []);

    return (
        <header className={`fixed inset-x-0 top-0 z-50 w-full transition-[background-color,border-color,color,box-shadow] duration-200 ${isScrolled ? "border-b border-neutral-200 bg-white text-neutral-900 shadow-[0_4px_24px_rgba(0,0,0,0.14)]" : "border-b border-transparent bg-transparent text-white"}`}>
          <div className={`${pageWrap} flex min-h-29.5 items-center justify-between gap-9.5 max-[900px]:min-h-23`}>
            <Brand priority />
            <MobileNavigation links={mobileLinks} isScrolled={isScrolled} />
            <nav className="flex items-center gap-[clamp(18px,2.1vw,38px)] max-[1100px]:gap-3.5 max-[900px]:hidden" aria-label="Main navigation">
                {links.map((link) => (
                    <a key={link.label} className={`whitespace-nowrap text-[13px] font-semibold uppercase transition-colors hover:text-[#ec8123] max-[1100px]:text-[11px] ${isScrolled ? "text-neutral-800" : "text-white"}`} href={link.href}>
                        {link.label}
                    </a>
                ))}
                <Button nativeButton={false} render={<a href="/register" />} className="h-auto min-h-10.5 min-w-26 rounded-[4px] bg-[#080808] px-5 text-[13px] font-bold uppercase hover:bg-[#252525] max-[1100px]:min-w-0 max-[1100px]:px-3.5 max-[1100px]:text-[11px]">Register</Button>
                <Button nativeButton={false} render={<a href="/login" />} className="h-auto min-h-10.5 min-w-26 rounded-[4px] bg-[#163e6a] px-5 text-[13px] font-bold uppercase hover:bg-[#ec8123] max-[1100px]:min-w-0 max-[1100px]:px-3.5 max-[1100px]:text-[11px]">Login</Button>
                        </nav>
                    </div>
        </header>
    );
}
