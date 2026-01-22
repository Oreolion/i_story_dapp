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

// Theme color mapping
const themeColors: Record<string, string> = {
  growth: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  reflection: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  change: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  loss: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  love: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  gratitude: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  challenge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  family: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  friendship: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  healing: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  identity: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  creativity: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  adventure: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
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
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
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
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
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
              className={`border-0 shadow-lg transition-all duration-300 cursor-pointer hover:shadow-xl ${
                expandedTheme === group.theme
                  ? "ring-2 ring-purple-500 dark:ring-purple-400"
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
      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
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
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
