import '../app/globals.css';
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../components/Provider';
import { Navigation } from '../components/Navigation';
import { Toaster } from 'react-hot-toast';
// import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IStory - AI-Powered Blockchain Journaling',
  description: 'Record your life stories with AI transcription, store them on blockchain, and monetize your creativity.',
  keywords: 'journaling, blockchain, NFT, AI, speech-to-text, Web3',
  authors: [{ name: 'iStoryChain Team' }],
  openGraph: {
    title: 'IStory - AI-Powered Blockchain Journaling',
    description: 'Record your life stories with AI transcription, store them on blockchain, and monetize your creativity.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
//   const supabase = await createSupabaseServerClient();
//   const { data: { session } } = await supabase.auth.getSession(); // Get server session (for auth checks)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              }}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}