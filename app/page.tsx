import { HeroSection } from "@/components/site/hero-section";
import { SiteHeader } from "@/components/site/site-header";
import {
  AboutSection,
  ContactSection,
  FreightRibbon,
  PromiseSection,
  WhySection,
} from "@/components/site/home-sections";
import { ServicesSection } from "@/components/site/services-section";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { TeamSection } from "@/components/site/team-section";
export default function Home() {
  return (
    <main>
      <SiteHeader />
      <HeroSection />
      <ScrollReveal><FreightRibbon /></ScrollReveal>
      <ScrollReveal><AboutSection /></ScrollReveal>
      <ScrollReveal><PromiseSection /></ScrollReveal>
      <ScrollReveal><ServicesSection /></ScrollReveal>
      <ScrollReveal><WhySection /></ScrollReveal>
      <ScrollReveal><TeamSection /></ScrollReveal>
      <ScrollReveal><ContactSection /></ScrollReveal>
      <ScrollReveal><SiteFooter /></ScrollReveal>
    </main>
  );
}
