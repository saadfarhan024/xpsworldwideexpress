import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xpsworldwideexpress.pk",
        port: "",
        pathname: "/img/logo.png",
        search: "",
      },
    ],
  },
};

export default nextConfig;
