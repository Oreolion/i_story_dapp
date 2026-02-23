// Library/Archive Screen - Personal stories, books, themes, life areas
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  BookOpen,
  Star,
  Calendar,
  Briefcase,
  Heart,
  Activity,
  Brain,
  Compass,
  Palette,
  Sparkles,
  GraduationCap,
  Lightbulb,
  Users,
  TreePine,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { usePatterns } from "../../hooks/usePatterns";
import type { StoryWithMetadata, ThemeGroup, DomainGroup, LifeDomain } from "../../types";

type LibraryTab = "all" | "stories" | "books" | "key-moments" | "themes" | "life-areas";

const DOMAIN_ICONS: Record<LifeDomain, React.ComponentType<any>> = {
  work: Briefcase,
  relationships: Heart,
  health: Activity,
  identity: Brain,
  growth: Sparkles,
  creativity: Palette,
  spirituality: Lightbulb,
  family: Users,
  adventure: Compass,
  learning: GraduationCap,
  general: TreePine,
};

const DOMAIN_COLORS: Record<LifeDomain, string> = {
  work: "#60a5fa",
  relationships: "#f472b6",
  health: "#4ade80",
  identity: "#a78bfa",
  growth: "#facc15",
  creativity: "#fb923c",
  spirituality: "#c084fc",
  family: "#f87171",
  adventure: "#22d3ee",
  learning: "#34d399",
  general: "#94a3b8",
};

const THEME_COLORS = [
  "#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa",
  "#a78bfa", "#fb923c", "#22d3ee", "#f87171", "#4ade80",
];

export default function LibraryScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    stories,
    themeGroups,
    domainGroups,
    canonicalStories,
    monthlySummary,
    isLoading,
    refetch,
  } = usePatterns();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleTheme = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <BookOpen size={48} color="#64748b" />
        <Text className="mt-4 text-lg text-slate-400">Sign in to view your archive</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-4 rounded-full bg-violet-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCanonical = (story: StoryWithMetadata) =>
    story.story_metadata?.is_canonical === true;

  const filteredStories = (() => {
    switch (activeTab) {
      case "stories":
        return stories;
      case "key-moments":
        return canonicalStories;
      default:
        return stories;
    }
  })();

  const renderStory = ({ item }: { item: StoryWithMetadata }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.id}`)}
      className="mb-3 rounded-xl bg-slate-800 p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          {isCanonical(item) && (
            <Star size={14} color="#facc15" fill="#facc15" />
          )}
          <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View className="ml-2 flex-row items-center gap-2">
          {item.hasAudio && (
            <View className="h-2 w-2 rounded-full bg-green-400" />
          )}
          <Text className="text-xs text-slate-500">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-sm text-slate-400" numberOfLines={2}>
        {item.content}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-slate-700 px-2 py-1">
          <Text className="text-xs capitalize text-slate-300">{item.mood}</Text>
        </View>
        {!item.is_public && (
          <View className="rounded-full bg-amber-900/30 px-2 py-1">
            <Text className="text-xs text-amber-400">Private</Text>
          </View>
        )}
        {item.story_metadata?.life_domain && item.story_metadata.life_domain !== "general" && (
          <View className="rounded-full bg-violet-900/30 px-2 py-1">
            <Text className="text-xs capitalize text-violet-400">
              {item.story_metadata.life_domain}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderThemesView = () => (
    <View className="px-4 pb-8">
      {themeGroups.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-slate-400">No themes discovered yet</Text>
        </View>
      ) : (
        themeGroups.map((group, idx) => {
          const isExpanded = expandedThemes.has(group.theme);
          const color = THEME_COLORS[idx % THEME_COLORS.length];
          return (
            <View key={group.theme} className="mb-3">
              <TouchableOpacity
                onPress={() => toggleTheme(group.theme)}
                className="flex-row items-center justify-between rounded-xl bg-slate-800 p-4"
              >
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-base font-medium capitalize text-white">
                    {group.theme}
                  </Text>
                  <View className="rounded-full bg-slate-700 px-2 py-0.5">
                    <Text className="text-xs font-medium text-slate-300">
                      {group.count}
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronDown size={18} color="#64748b" />
                ) : (
                  <ChevronRight size={18} color="#64748b" />
                )}
              </TouchableOpacity>
              {isExpanded &&
                group.stories.map((story) => (
                  <TouchableOpacity
                    key={story.id}
                    onPress={() => router.push(`/story/${story.id}`)}
                    className="ml-6 mt-2 rounded-lg bg-slate-800/50 p-3"
                  >
                    <View className="flex-row items-center gap-2">
                      {isCanonical(story) && (
                        <Star size={12} color="#facc15" fill="#facc15" />
                      )}
                      <Text className="flex-1 text-sm text-white" numberOfLines={1}>
                        {story.title}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {new Date(story.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          );
        })
      )}
    </View>
  );

  const renderDomainsView = () => {
    const totalStories = stories.length;
    return (
      <View className="px-4 pb-8">
        {domainGroups.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-slate-400">No life areas tracked yet</Text>
          </View>
        ) : (
          domainGroups.map((group) => {
            const Icon = DOMAIN_ICONS[group.domain] || TreePine;
            const color = DOMAIN_COLORS[group.domain] || "#94a3b8";
            const pct = totalStories > 0 ? (group.count / totalStories) * 100 : 0;
            return (
              <View key={group.domain} className="mb-3 rounded-xl bg-slate-800 p-4">
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color + "20" }}
                  >
                    <Icon size={20} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium capitalize text-white">
                        {group.domain}
                      </Text>
                      <Text className="text-sm font-medium text-slate-400">
                        {Math.round(pct)}%
                      </Text>
                    </View>
                    <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                      <View
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </View>
                  </View>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500">
                    {group.count} {group.count === 1 ? "story" : "stories"}
                  </Text>
                  {group.dominantTone && (
                    <Text className="text-xs capitalize text-slate-500">
                      Tone: {group.dominantTone}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  const tabs: LibraryTab[] = ["all", "stories", "books", "key-moments", "themes", "life-areas"];

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-white">Your Archive</Text>
        <Text className="text-sm text-slate-400">
          {stories.length} stories
        </Text>
      </View>

      {/* Monthly Summary Card */}
      {monthlySummary && monthlySummary.storyCount > 0 && (
        <View className="mx-4 mt-3 rounded-xl bg-slate-800 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Calendar size={16} color="#a78bfa" />
            <Text className="text-sm font-semibold text-white">
              {monthlySummary.month} {monthlySummary.year}
            </Text>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white">
                {monthlySummary.storyCount}
              </Text>
              <Text className="text-xs text-slate-400">Stories</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-amber-400">
                {monthlySummary.canonicalCount}
              </Text>
              <Text className="text-xs text-slate-400">Key Moments</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-violet-400">
                {themeGroups.length}
              </Text>
              <Text className="text-xs text-slate-400">Themes</Text>
            </View>
          </View>
          {monthlySummary.topThemes.length > 0 && (
            <View className="mt-3 flex-row flex-wrap gap-1">
              {monthlySummary.topThemes.map((theme) => (
                <View key={theme} className="rounded-full bg-violet-900/30 px-2 py-0.5">
                  <Text className="text-xs capitalize text-violet-300">{theme}</Text>
                </View>
              ))}
              {monthlySummary.dominantDomain && (
                <View className="rounded-full bg-emerald-900/30 px-2 py-0.5">
                  <Text className="text-xs capitalize text-emerald-300">
                    {monthlySummary.dominantDomain}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Stats Row */}
      <View className="mx-4 mt-3 mb-1 flex-row gap-2">
        <View className="flex-1 items-center rounded-lg bg-slate-800/60 py-2">
          <Text className="text-sm font-bold text-white">{stories.length}</Text>
          <Text className="text-xs text-slate-500">Total</Text>
        </View>
        <View className="flex-1 items-center rounded-lg bg-slate-800/60 py-2">
          <Text className="text-sm font-bold text-amber-400">{canonicalStories.length}</Text>
          <Text className="text-xs text-slate-500">Key Moments</Text>
        </View>
        <View className="flex-1 items-center rounded-lg bg-slate-800/60 py-2">
          <Text className="text-sm font-bold text-violet-400">{themeGroups.length}</Text>
          <Text className="text-xs text-slate-500">Themes</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1.5 ${
              activeTab === tab ? "bg-violet-600" : "bg-slate-800"
            }`}
          >
            <Text
              className={`text-xs font-medium capitalize ${
                activeTab === tab ? "text-white" : "text-slate-400"
              }`}
            >
              {tab.replace("-", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {activeTab === "themes" ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderThemesView()}
        </ScrollView>
      ) : activeTab === "life-areas" ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderDomainsView()}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredStories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStory}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-slate-400">
                {isLoading ? "Loading..." : "No stories yet. Start recording!"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
