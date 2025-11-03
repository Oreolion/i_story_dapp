"use client";
import dynamic from "next/dynamic";
// This dynamically imports your Providers, but disables SSR
export const ProvidersDynamic = dynamic(
  () => import("./Provider").then((m) => m.Providers),
  { ssr: false }
);
