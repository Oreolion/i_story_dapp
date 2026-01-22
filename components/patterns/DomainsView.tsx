"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainGroup, LifeDomain, EmotionalTone } from "@/app/types";
import {
  Briefcase,
  Heart,
  Activity,
  User,
  TrendingUp,
  Palette,
  Sparkles,
  Users,
  Compass,
  BookOpen,
  HelpCircle,
} from "lucide-react";

interface DomainsViewProps {
  domainGroups: DomainGroup[];
  isLoading: boolean;
  totalStories: number;
}

// Domain configuration with icons and colors
const domainConfig: Record<LifeDomain, { icon: React.ElementType; bgColor: string; textColor: string; label: string }> = {
  work: {
    icon: Briefcase,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    label: "Work",
  },
  relationships: {
    icon: Heart,
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    textColor: "text-rose-700 dark:text-rose-300",
    label: "Relationships",
  },
  health: {
    icon: Activity,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    label: "Health",
  },
  identity: {
    icon: User,
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    textColor: "text-violet-700 dark:text-violet-300",
    label: "Identity",
  },
  growth: {
    icon: TrendingUp,
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-300",
    label: "Growth",
  },
  creativity: {
    icon: Palette,
    bgColor: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    textColor: "text-fuchsia-700 dark:text-fuchsia-300",
    label: "Creativity",
  },
  spirituality: {
    icon: Sparkles,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
    label: "Spirituality",
  },
  family: {
    icon: Users,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    label: "Family",
  },
  adventure: {
    icon: Compass,
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    textColor: "text-cyan-700 dark:text-cyan-300",
    label: "Adventure",
  },
  learning: {
    icon: BookOpen,
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    textColor: "text-indigo-700 dark:text-indigo-300",
    label: "Learning",
  },
  general: {
    icon: HelpCircle,
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    label: "General",
  },
};

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

export function DomainsView({ domainGroups, isLoading, totalStories }: DomainsViewProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Distribution card skeleton */}
        <Skeleton className="h-32 rounded-xl" />
        {/* Domain cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (domainGroups.length === 0 || totalStories === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0 shadow-lg">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No Life Areas Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Start recording stories to see how your experiences are distributed across different areas of life.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages for the distribution chart
  const distributions = domainGroups.map((group) => ({
    ...group,
    percentage: totalStories > 0 ? (group.count / totalStories) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Domain Distribution Overview */}
      <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Compass className="w-5 h-5 text-cyan-600" />
            <span>Life Areas Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {distributions.slice(0, 5).map((group) => {
            const config = domainConfig[group.domain];
            const Icon = config.icon;
            return (
              <div key={group.domain} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${config.textColor}`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {group.count} ({Math.round(group.percentage)}%)
                  </span>
                </div>
                <Progress
                  value={group.percentage}
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Domain Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domainGroups.map((group, index) => {
          const config = domainConfig[group.domain];
          const Icon = config.icon;
          const percentage = totalStories > 0 ? (group.count / totalStories) * 100 : 0;

          return (
            <motion.div
              key={group.domain}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${config.bgColor}`}
                onClick={() => {
                  // Navigate to first story in this domain
                  if (group.stories.length > 0) {
                    router.push(`/story/${group.stories[0].id}`);
                  }
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${config.bgColor} border border-current/10`}>
                      <Icon className={`w-6 h-6 ${config.textColor}`} />
                    </div>
                    <span className={`text-2xl font-bold ${config.textColor}`}>
                      {group.count}
                    </span>
                  </div>

                  <h3 className={`font-semibold text-lg mb-1 ${config.textColor}`}>
                    {config.label}
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {Math.round(percentage)}% of stories
                    </span>
                    {group.dominantTone && (
                      <Badge className={toneColors[group.dominantTone]}>
                        {group.dominantTone}
                      </Badge>
                    )}
                  </div>

                  {/* Story count indicator */}
                  <div className="mt-4 pt-3 border-t border-current/10">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {group.count} {group.count === 1 ? "story" : "stories"}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400">
                        View all
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
