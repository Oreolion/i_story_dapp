import "../app/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProvidersDynamic } from "../components/ProvidersDynamic";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Toaster } from "react-hot-toast";
import { GlobalBackgroundDynamic } from "../components/three/GlobalBackgroundDynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://estory.vercel.app"),
  title: {
    default: "eStory - AI-Powered Blockchain Journaling",
    template: "%s | eStory",
  },
  description:
    "Record your life stories with AI voice transcription, store them permanently on the blockchain, discover cognitive patterns, and mint your journals as NFT books.",
  keywords: [
    "journaling",
    "blockchain",
    "NFT",
    "AI",
    "speech-to-text",
    "Web3",
    "voice journal",
    "digital diary",
    "Base",
    "Ethereum",
    "story NFT",
    "eStory",
  ],
  authors: [{ name: "eStory Team" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://estory.vercel.app",
    siteName: "eStory",
    title: "eStory - AI-Powered Blockchain Journaling",
    description:
      "Record your life stories with AI voice transcription, store them permanently on the blockchain, and mint your journals as NFT books.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "eStory - AI-Powered Blockchain Journaling",
    description:
      "AI voice transcription, blockchain permanence, and NFT books for your personal stories.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "eStory",
      url: "https://estory.vercel.app",
      logo: "https://estory.vercel.app/favicon.ico",
      description:
        "AI-powered blockchain journaling platform that transforms personal narratives into sovereign memory infrastructure.",
    },
    {
      "@type": "WebSite",
      name: "eStory",
      url: "https://estory.vercel.app",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://estory.vercel.app/social?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <ProvidersDynamic>
          {/* 3D Background - renders behind all content */}
          <GlobalBackgroundDynamic />

          <div className="relative min-h-screen flex flex-col">
            <Navigation />
            <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
              {children}
            </main>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className:
                  "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
              }}
            />
          </div>
        </ProvidersDynamic>
      </body>
    </html>
  );
}
