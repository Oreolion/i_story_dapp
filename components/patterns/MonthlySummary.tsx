"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlySummary as MonthlySummaryType, LifeDomain, EmotionalTone } from "@/app/types";
import {
  Calendar,
  Star,
  TrendingUp,
  Sparkles,
  FileText,
  Briefcase,
  Heart,
  Activity,
  User,
  Palette,
  Users,
  Compass,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { getEmotionClass } from "@/lib/design-tokens";

interface MonthlySummaryProps {
  summary: MonthlySummaryType | null;
  isLoading: boolean;
}

// Domain icons mapping
type IconComponent = React.ComponentType<{ className?: string }>;
const domainIcons: Record<LifeDomain, IconComponent> = {
  work: Briefcase,
  relationships: Heart,
  health: Activity,
  identity: User,
  growth: TrendingUp,
  creativity: Palette,
  spirituality: Sparkles,
  family: Users,
  adventure: Compass,
  learning: BookOpen,
  general: HelpCircle,
};

// Theme colors using design system
const themeColors: string[] = [
  "bg-[hsl(var(--insight-500)/0.15)] text-[hsl(var(--insight-600))] dark:text-[hsl(var(--insight-400))] border border-[hsl(var(--insight-500)/0.3)]",
  "bg-[hsl(var(--growth-500)/0.15)] text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))] border border-[hsl(var(--growth-500)/0.3)]",
  "bg-[hsl(var(--story-500)/0.15)] text-[hsl(var(--story-600))] dark:text-[hsl(var(--story-400))] border border-[hsl(var(--story-500)/0.3)]",
];

// Get significance label based on score using design system colors
function getSignificanceLabel(score: number): { label: string; color: string } {
  if (score >= 0.7) {
    return { label: "Significant", color: "text-[hsl(var(--growth-500))]" };
  } else if (score >= 0.4) {
    return { label: "Moderate", color: "text-[hsl(var(--story-500))]" };
  } else {
    return { label: "Routine", color: "text-gray-500 dark:text-gray-400" };
  }
}

export function MonthlySummary({ summary, isLoading }: MonthlySummaryProps) {
  if (isLoading) {
    return (
      <Skeleton className="h-48 rounded-xl" />
    );
  }

  if (!summary || summary.storyCount === 0) {
    return (
      <Card className="card-elevated rounded-xl">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[hsl(var(--void-light))] rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {summary?.month || "This Month"} {summary?.year || new Date().getFullYear()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No stories recorded yet this month
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const significanceInfo = getSignificanceLabel(summary.avgSignificance);
  const DomainIcon = summary.dominantDomain ? domainIcons[summary.dominantDomain] : HelpCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-insight rounded-xl bg-[hsl(var(--insight-500)/0.05)] overflow-hidden">
        <CardContent className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Month Header */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-[hsl(var(--insight-600))] to-[hsl(var(--memory-600))] rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.month} {summary.year}
                  </h3>
                  <Badge variant="secondary" className="bg-[hsl(var(--void-surface))]">
                    {summary.storyCount} {summary.storyCount === 1 ? "story" : "stories"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your monthly storytelling summary
                </p>
              </div>
            </div>

            {/* Key Stats */}
            <div className="flex flex-wrap gap-6">
              {/* Stories */}
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[hsl(var(--void-surface))] rounded-lg">
                  <FileText className="w-4 h-4 text-[hsl(var(--insight-500))]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.storyCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Stories</div>
                </div>
              </div>

              {/* Key Moments */}
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[hsl(var(--void-surface))] rounded-lg">
                  <Star className="w-4 h-4 text-[hsl(var(--story-500))]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.canonicalCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Key Moments</div>
                </div>
              </div>

              {/* Significance */}
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[hsl(var(--void-surface))] rounded-lg">
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--growth-500))]" />
                </div>
                <div>
                  <div className={`text-lg font-bold ${significanceInfo.color}`}>
                    {Math.round(summary.avgSignificance * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {significanceInfo.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Themes & Domain */}
          <div className="mt-6 pt-4 border-t border-[hsl(var(--insight-500)/0.2)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Top Themes */}
            {summary.topThemes.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Top themes:</span>
                <div className="flex flex-wrap gap-1">
                  {summary.topThemes.map((theme, index) => (
                    <Badge
                      key={theme}
                      className={themeColors[index % themeColors.length]}
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dominant Domain & Tone */}
            <div className="flex items-center space-x-4">
              {summary.dominantDomain && (
                <div className="flex items-center space-x-2">
                  <DomainIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {summary.dominantDomain}
                  </span>
                </div>
              )}
              {summary.dominantTone && (
                <Badge className={`${getEmotionClass(summary.dominantTone)} border capitalize`}>
                  {summary.dominantTone}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
