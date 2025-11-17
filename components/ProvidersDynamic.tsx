"use client";

// This file dynamically imports your main Providers component
// with Server-Side Rendering (SSR) disabled.
// This is the fix for the "indexedDB is not defined" error.

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import React from "react";

// Dynamically import the Providers component with ssr: false
const Providers = dynamic(
  () => import("./Provider").then((mod) => mod.Providers),
  {
    ssr: false, // This is the key: it ensures this component only runs on the client
    loading: () => (
      // Show a full-page loader while wallet connectors are loading
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
        <h2 className="text-2xl font-semibold">Loading Wallet Connectors...</h2>
      </div>
    ),
  }
);

export function ProvidersDynamic({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}