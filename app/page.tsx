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
  const siteUrl = process.env.APP_URL || "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Go Delivery Express",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Courier, cargo, freight, warehousing, and fulfillment services for businesses in Pakistan and worldwide.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+92-336-3587468",
      contactType: "customer service",
      areaServed: "PK",
      availableLanguage: ["English"],
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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
