"use client";

import { AlertTriangle } from "lucide-react";

export function TestnetBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>Base Sepolia Testnet — No real assets</span>
    </div>
  );
}
