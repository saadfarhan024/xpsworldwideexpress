import type { MetadataRoute } from "next";

const publicRoutes = ["/", "/about-us", "/services", "/career", "/contact-us", "/tracking", "/privacy-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : 0.7,
  }));
}
