"use client";

import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerifiedBadgeProps {
  status: "verified" | "pending" | "unverified";
  txHash?: string | null;
  className?: string;
}

const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org";

export function VerifiedBadge({ status, txHash, className = "" }: VerifiedBadgeProps) {
  if (status === "unverified") {
    return null;
  }

  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className={`border-yellow-400/50 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 ${className}`}
      >
        <Clock className="w-3 h-3 mr-1 animate-pulse" />
        Verifying...
      </Badge>
    );
  }

  // Verified
  const badge = (
    <Badge
      variant="outline"
      className={`border-emerald-400/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ${className}`}
    >
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Verified
      {txHash && <ExternalLink className="w-3 h-3 ml-1" />}
    </Badge>
  );

  if (txHash) {
    return (
      <a
        href={`${BLOCK_EXPLORER}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex hover:opacity-80 transition-opacity"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
