"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Sparkles,
  Heart,
  Star,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";

const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org";

interface VerifiedMetrics {
  significance_score: number;
  emotional_depth: number;
  quality_score: number;
  word_count: number;
  verified_themes: string[];
  on_chain_tx_hash?: string | null;
  cre_attestation_id?: string | null;
}

interface VerifiedMetricsCardProps {
  metrics: VerifiedMetrics | null;
  isPending: boolean;
  className?: string;
}

const emotionalDepthLabels: Record<number, string> = {
  1: "Surface",
  2: "Mild",
  3: "Moderate",
  4: "Deep",
  5: "Profound",
};

export function VerifiedMetricsCard({
  metrics,
  isPending,
  className = "",
}: VerifiedMetricsCardProps) {
  // Pending state
  if (isPending && !metrics) {
    return (
      <Card className={`rounded-xl border-yellow-400/30 bg-yellow-50/50 dark:bg-yellow-900/10 ${className}`}>
        <CardContent className="py-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-yellow-500 animate-spin" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            Chainlink CRE is verifying this story...
          </p>
          <p className="text-xs text-gray-500">
            Multiple nodes are analyzing the content for consensus
          </p>
        </CardContent>
      </Card>
    );
  }

  // No metrics
  if (!metrics) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`rounded-xl border-emerald-400/30 overflow-hidden ${className}`}>
        {/* Green gradient top border */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400">
                Verified Metrics
              </span>
            </div>
            {metrics.on_chain_tx_hash && (
              <a
                href={`${BLOCK_EXPLORER}/tx/${metrics.on_chain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-emerald-500 flex items-center gap-1 transition-colors"
              >
                View Proof <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Score bars */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Star className="w-3.5 h-3.5" />
                  Significance
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {metrics.significance_score}/100
                </span>
              </div>
              <Progress
                value={metrics.significance_score}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quality
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {metrics.quality_score}/100
                </span>
              </div>
              <Progress
                value={metrics.quality_score}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Emotional depth & word count */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-pink-300/50 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20"
            >
              <Heart className="w-3 h-3 mr-1" />
              {emotionalDepthLabels[metrics.emotional_depth] || "Moderate"} Depth
            </Badge>
            <Badge
              variant="outline"
              className="border-gray-300/50 text-gray-600 dark:text-gray-400"
            >
              <FileText className="w-3 h-3 mr-1" />
              {metrics.word_count.toLocaleString()} words
            </Badge>
          </div>

          {/* Themes */}
          {metrics.verified_themes && metrics.verified_themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metrics.verified_themes.map((theme) => (
                <Badge
                  key={theme}
                  variant="secondary"
                  className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-700/30"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified by Chainlink CRE
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
