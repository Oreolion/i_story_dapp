import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/social", "/story/"],
        disallow: ["/api/", "/record", "/library", "/profile", "/tracker", "/books/"],
      },
    ],
    sitemap: "https://estory.vercel.app/sitemap.xml",
  };
}
