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
  title: "IStory - AI-Powered Blockchain Journaling",
  description:
    "Record your life stories with AI transcription, store them on blockchain, and monetize your creativity.",
  keywords: "journaling, blockchain, NFT, AI, speech-to-text, Web3",
  authors: [{ name: "iStoryChain Team" }],
  openGraph: {
    title: "IStory - AI-Powered Blockchain Journaling",
    description:
      "Record your life stories with AI transcription, store them on blockchain, and monetize your creativity.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
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