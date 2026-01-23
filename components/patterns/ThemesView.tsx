"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeGroup, StoryWithMetadata } from "@/app/types";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  ArrowRight,
} from "lucide-react";

interface ThemesViewProps {
  themeGroups: ThemeGroup[];
  isLoading: boolean;
}

// Theme color mapping using design system semantic colors
const themeColors: Record<string, string> = {
  growth: "bg-[hsl(var(--growth-500)/0.15)] text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))] border border-[hsl(var(--growth-500)/0.3)]",
  reflection: "bg-[hsl(var(--insight-500)/0.15)] text-[hsl(var(--insight-600))] dark:text-[hsl(var(--insight-400))] border border-[hsl(var(--insight-500)/0.3)]",
  change: "bg-[hsl(var(--story-500)/0.15)] text-[hsl(var(--story-600))] dark:text-[hsl(var(--story-400))] border border-[hsl(var(--story-500)/0.3)]",
  loss: "bg-[hsl(var(--tone-melancholic)/0.15)] text-[hsl(var(--tone-melancholic))] border border-[hsl(var(--tone-melancholic)/0.3)]",
  love: "bg-[hsl(var(--domain-relationships)/0.15)] text-[hsl(var(--domain-relationships))] border border-[hsl(var(--domain-relationships)/0.3)]",
  gratitude: "bg-[hsl(var(--tone-grateful)/0.15)] text-[hsl(var(--tone-grateful))] border border-[hsl(var(--tone-grateful)/0.3)]",
  challenge: "bg-[hsl(var(--tone-frustrated)/0.15)] text-[hsl(var(--tone-frustrated))] border border-[hsl(var(--tone-frustrated)/0.3)]",
  success: "bg-[hsl(var(--growth-500)/0.15)] text-[hsl(var(--growth-600))] dark:text-[hsl(var(--growth-400))] border border-[hsl(var(--growth-500)/0.3)]",
  family: "bg-[hsl(var(--domain-family)/0.15)] text-[hsl(var(--domain-family))] border border-[hsl(var(--domain-family)/0.3)]",
  friendship: "bg-[hsl(var(--memory-500)/0.15)] text-[hsl(var(--memory-600))] dark:text-[hsl(var(--memory-400))] border border-[hsl(var(--memory-500)/0.3)]",
  healing: "bg-[hsl(var(--tone-peaceful)/0.15)] text-[hsl(var(--tone-peaceful))] border border-[hsl(var(--tone-peaceful)/0.3)]",
  identity: "bg-[hsl(var(--domain-identity)/0.15)] text-[hsl(var(--domain-identity))] border border-[hsl(var(--domain-identity)/0.3)]",
  creativity: "bg-[hsl(var(--domain-creativity)/0.15)] text-[hsl(var(--domain-creativity))] border border-[hsl(var(--domain-creativity)/0.3)]",
  adventure: "bg-[hsl(var(--domain-adventure)/0.15)] text-[hsl(var(--domain-adventure))] border border-[hsl(var(--domain-adventure)/0.3)]",
  default: "bg-[hsl(var(--void-light))] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
};

function getThemeColor(theme: string): string {
  const normalizedTheme = theme.toLowerCase();
  return themeColors[normalizedTheme] || themeColors.default;
}

export function ThemesView({ themeGroups, isLoading }: ThemesViewProps) {
  const router = useRouter();
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const toggleExpand = (theme: string) => {
    setExpandedTheme(expandedTheme === theme ? null : theme);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Theme pills skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (themeGroups.length === 0) {
    return (
      <Card className="card-insight rounded-xl bg-[hsl(var(--insight-500)/0.05)]">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[hsl(var(--insight-600))] to-[hsl(var(--memory-600))] rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No Themes Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Record stories and let AI analyze them to discover recurring themes in your life.
            </p>
          </div>
          <Button
            onClick={() => router.push("/record")}
            className="bg-gradient-to-r from-[hsl(var(--insight-600))] to-[hsl(var(--memory-600))] hover:from-[hsl(var(--insight-700))] hover:to-[hsl(var(--memory-700))]"
          >
            Record Your First Story
          </Button>
        </CardContent>
      </Card>
    );
  }

  const topThemes = themeGroups.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Theme Pills Overview */}
      <div className="flex flex-wrap gap-2">
        {topThemes.map((group) => (
          <Badge
            key={group.theme}
            className={`${getThemeColor(group.theme)} cursor-pointer hover:opacity-80 transition-opacity px-3 py-1`}
            onClick={() => toggleExpand(group.theme)}
          >
            {group.theme} ({group.count})
          </Badge>
        ))}
      </div>

      {/* Theme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themeGroups.map((group) => (
          <motion.div
            key={group.theme}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className={`card-elevated rounded-xl cursor-pointer hover-glow-insight ${
                expandedTheme === group.theme
                  ? "ring-2 ring-[hsl(var(--insight-500))] dark:ring-[hsl(var(--insight-400))]"
                  : ""
              }`}
              onClick={() => toggleExpand(group.theme)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getThemeColor(group.theme)}>
                      {group.theme}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {group.count} {group.count === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                    {expandedTheme === group.theme ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Preview: Show first story title */}
                {group.stories.length > 0 && expandedTheme !== group.theme && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">
                        {group.stories[0].title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Latest: {new Date(group.latestDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Expanded: Show stories list */}
                <AnimatePresence>
                  {expandedTheme === group.theme && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2"
                    >
                      {group.stories.slice(0, 4).map((story) => (
                        <StoryPreviewCard
                          key={story.id}
                          story={story}
                          onClick={() => router.push(`/story/${story.id}`)}
                        />
                      ))}
                      {group.stories.length > 4 && (
                        <div className="text-center pt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{group.stories.length - 4} more stories
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Story preview card component
function StoryPreviewCard({
  story,
  onClick,
}: {
  story: StoryWithMetadata;
  onClick: () => void;
}) {
  return (
    <div
      className="p-3 bg-[hsl(var(--void-light))] rounded-lg hover:bg-[hsl(var(--memory-500)/0.1)] transition-colors cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {story.title}
          </h4>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(story.created_at).toLocaleDateString()}</span>
            {story.story_metadata?.emotional_tone && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="capitalize">
                  {story.story_metadata.emotional_tone}
                </span>
              </>
            )}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[hsl(var(--insight-500))] transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
