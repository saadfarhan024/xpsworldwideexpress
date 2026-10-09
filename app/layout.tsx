import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Go Delivery Express | Cargo & Logistics",
  description:
    "Go Delivery Express provides courier, cargo, freight, warehousing, and fulfillment services for businesses in Pakistan and worldwide.",
  applicationName: "Go Delivery Express",
  category: "business",
  keywords: ["cargo services", "courier services", "freight forwarding", "warehousing", "fulfillment", "Pakistan logistics"],
  verification: {
    google: "Br9u9ABiqaUOXBVeKYQbQV9fS9Ab7SLRx3Muu72pU1Q",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "Go Delivery Express",
    title: "Go Delivery Express | Cargo & Logistics",
    description: "Courier, cargo, freight, warehousing, and fulfillment services for businesses in Pakistan and worldwide.",
    images: [{ url: "/opengraph-image.png", width: 2400, height: 1260, alt: "Go Delivery Express cargo and logistics services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Go Delivery Express | Cargo & Logistics",
    description: "Courier, cargo, freight, warehousing, and fulfillment services for businesses in Pakistan and worldwide.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
