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
import { getEmotionClass, domainLabels } from "@/lib/design-tokens";

interface DomainsViewProps {
  domainGroups: DomainGroup[];
  isLoading: boolean;
  totalStories: number;
}

// Domain configuration with icons and design system colors
type IconComponent = React.ComponentType<{ className?: string }>;
const domainConfig: Record<LifeDomain, { icon: IconComponent; bgColor: string; textColor: string; label: string }> = {
  work: {
    icon: Briefcase,
    bgColor: "bg-[hsl(var(--domain-work)/0.15)]",
    textColor: "text-[hsl(var(--domain-work))]",
    label: "Work",
  },
  relationships: {
    icon: Heart,
    bgColor: "bg-[hsl(var(--domain-relationships)/0.15)]",
    textColor: "text-[hsl(var(--domain-relationships))]",
    label: "Relationships",
  },
  health: {
    icon: Activity,
    bgColor: "bg-[hsl(var(--domain-health)/0.15)]",
    textColor: "text-[hsl(var(--domain-health))]",
    label: "Health",
  },
  identity: {
    icon: User,
    bgColor: "bg-[hsl(var(--domain-identity)/0.15)]",
    textColor: "text-[hsl(var(--domain-identity))]",
    label: "Identity",
  },
  growth: {
    icon: TrendingUp,
    bgColor: "bg-[hsl(var(--domain-growth)/0.15)]",
    textColor: "text-[hsl(var(--domain-growth))]",
    label: "Growth",
  },
  creativity: {
    icon: Palette,
    bgColor: "bg-[hsl(var(--domain-creativity)/0.15)]",
    textColor: "text-[hsl(var(--domain-creativity))]",
    label: "Creativity",
  },
  spirituality: {
    icon: Sparkles,
    bgColor: "bg-[hsl(var(--domain-spirituality)/0.15)]",
    textColor: "text-[hsl(var(--domain-spirituality))]",
    label: "Spirituality",
  },
  family: {
    icon: Users,
    bgColor: "bg-[hsl(var(--domain-family)/0.15)]",
    textColor: "text-[hsl(var(--domain-family))]",
    label: "Family",
  },
  adventure: {
    icon: Compass,
    bgColor: "bg-[hsl(var(--domain-adventure)/0.15)]",
    textColor: "text-[hsl(var(--domain-adventure))]",
    label: "Adventure",
  },
  learning: {
    icon: BookOpen,
    bgColor: "bg-[hsl(var(--domain-learning)/0.15)]",
    textColor: "text-[hsl(var(--domain-learning))]",
    label: "Learning",
  },
  general: {
    icon: HelpCircle,
    bgColor: "bg-[hsl(var(--domain-general)/0.15)]",
    textColor: "text-[hsl(var(--domain-general))]",
    label: "General",
  },
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
      <Card className="card-elevated rounded-xl bg-[hsl(var(--memory-500)/0.05)] border-[hsl(var(--memory-500)/0.2)]">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--growth-600))] rounded-full flex items-center justify-center">
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
      <Card className="card-elevated rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Compass className="w-5 h-5 text-[hsl(var(--memory-500))]" />
            <span className="text-gradient-memory">Life Areas Distribution</span>
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
                className={`card-elevated rounded-xl cursor-pointer overflow-hidden hover-glow-memory ${config.bgColor}`}
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
                      <Badge className={`${getEmotionClass(group.dominantTone)} border capitalize`}>
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
                      <span className="text-[hsl(var(--insight-500))]">
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
