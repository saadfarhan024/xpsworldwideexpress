import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonPrimary, eyebrow, pageWrap } from "@/components/site/styles";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate h-[min(890px,92vh)] min-h-185 bg-cover bg-position-[center_55%] text-white motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 max-[760px]:h-[min(700px,92svh)] max-[760px]:min-h-145 max-[760px]:max-h-none max-[760px]:bg-position-[58%_center] max-[420px]:min-h-140"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(12 12 15 / 78%) 0%, rgb(15 15 17 / 56%) 48%, rgb(10 12 15 / 48%) 100%), linear-gradient(0deg, rgb(5 7 10 / 38%), transparent 55%), url(https://xpsworldwideexpress.pk/img/theme_image_23.jpg)",
      }}
    >
      <div className="min-h-29.5 max-[760px]:min-h-16" aria-hidden="true" />
      <div className={`${pageWrap} relative max-w-360 pt-[clamp(120px,13vh,190px)] max-[760px]:pt-25 max-[420px]:pt-23`}>
        <p className={`${eyebrow} text-[#ec8123] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-100`}>
          Moving business forward
        </p>
        <h1 className="m-0 w-[min(690px,62%)] text-[clamp(48px,6vw,82px)] font-normal leading-[1.04] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-200 max-[760px]:w-full max-[760px]:max-w-[13ch] max-[760px]:text-[clamp(43px,11vw,58px)] max-[760px]:leading-[1.02] max-[420px]:max-w-[12ch] max-[420px]:text-[42px]">
          Full Sustainable Cargo Solutions<span className="text-[#163e6a]">!</span>
        </h1>
        <p className="mb-7.5 mt-6 max-w-147.5 text-[clamp(17px,1.7vw,23px)] leading-[1.65] text-white/90 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-300 max-[760px]:mt-5 max-[760px]:mb-8 max-[760px]:max-w-[34ch] max-[760px]:text-[16px] max-[760px]:leading-[1.55]">
          Representative logistics operator providing full range of service in the sphere of customs clearance and transportation worldwide.
        </p>
        <Button nativeButton={false} render={<a href="#services" />} className={`${buttonPrimary} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-500`}>
          Our Services <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div className="absolute bottom-10 right-[max(32px,calc((100%-1440px)/2))] flex items-center gap-3 text-[10px] tracking-[.16em] text-white/65 max-[760px]:bottom-6.25 max-[760px]:right-5 max-[760px]:text-[9px]" aria-hidden="true">
        <span className="text-[14px] text-white">01</span>
        <i className="h-px w-17.5 bg-[#ec8123]" /> GLOBAL LOGISTICS
      </div>
    </section>
  );
}
