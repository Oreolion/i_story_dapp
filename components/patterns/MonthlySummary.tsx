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

interface MonthlySummaryProps {
  summary: MonthlySummaryType | null;
  isLoading: boolean;
}

// Domain icons mapping
const domainIcons: Record<LifeDomain, React.ElementType> = {
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

// Theme colors
const themeColors: string[] = [
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
];

// Emotional tone colors
const toneColors: Record<EmotionalTone, string> = {
  reflective: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  joyful: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  anxious: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  hopeful: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  melancholic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  grateful: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  frustrated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  peaceful: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  excited: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  uncertain: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

// Get significance label based on score
function getSignificanceLabel(score: number): { label: string; color: string } {
  if (score >= 0.7) {
    return { label: "Significant", color: "text-emerald-600 dark:text-emerald-400" };
  } else if (score >= 0.4) {
    return { label: "Moderate", color: "text-amber-600 dark:text-amber-400" };
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
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-0 shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
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
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-0 shadow-lg overflow-hidden">
        <CardContent className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Month Header */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.month} {summary.year}
                  </h3>
                  <Badge variant="secondary" className="bg-white/60 dark:bg-gray-800/60">
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
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600" />
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
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500" />
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
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
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
          <div className="mt-6 pt-4 border-t border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                <Badge className={toneColors[summary.dominantTone]}>
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
