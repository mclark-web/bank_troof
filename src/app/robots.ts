import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://bank-troof.vercel.app/sitemap.xml",
    host: "https://bank-troof.vercel.app",
  };
}
