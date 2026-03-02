// Library/Archive Screen - Personal stories, books, themes, life areas
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
import type { StoryWithMetadata, LifeDomain } from "../../types";
import {
  GlassCard,
  GradientButton,
  AnimatedListItem,
  Badge,
  StatCard,
  SectionHeader,
  GRADIENTS,
} from "../../components/ui";

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
  const { isAuthenticated } = useAuthStore();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" }}>
        <GlassCard intensity="medium" style={{ padding: 32, alignItems: "center", marginHorizontal: 24 }}>
          <BookOpen size={48} color="#64748b" />
          <Text style={{ marginTop: 16, fontSize: 17, color: "#94a3b8" }}>Sign in to view your archive</Text>
          <View style={{ marginTop: 16 }}>
            <GradientButton
              onPress={() => router.push("/auth/login")}
              title="Sign In"
              gradient={GRADIENTS.primary}
            />
          </View>
        </GlassCard>
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

  const renderStory = ({ item, index }: { item: StoryWithMetadata; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        onPress={() => router.push(`/story/${item.id}`)}
        activeOpacity={0.8}
      >
        <GlassCard intensity="light" style={{ padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              {isCanonical(item) && (
                <Star size={14} color="#facc15" fill="#facc15" />
              )}
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#fff" }} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={{ marginLeft: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
              {item.hasAudio && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" }} />
              )}
              <Text style={{ fontSize: 11, color: "#64748b" }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Text style={{ marginTop: 4, fontSize: 13, color: "#94a3b8" }} numberOfLines={2}>
            {item.content}
          </Text>
          <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Badge text={item.mood} />
            {!item.is_public && (
              <Badge text="Private" variant="warning" />
            )}
            {item.story_metadata?.life_domain && item.story_metadata.life_domain !== "general" && (
              <Badge text={item.story_metadata.life_domain} variant="violet" />
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  const renderThemesView = () => (
    <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {themeGroups.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <Text style={{ color: "#94a3b8" }}>No themes discovered yet</Text>
        </View>
      ) : (
        themeGroups.map((group, idx) => {
          const isExpanded = expandedThemes.has(group.theme);
          const color = THEME_COLORS[idx % THEME_COLORS.length];
          return (
            <AnimatedListItem key={group.theme} index={idx}>
              <View style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => toggleTheme(group.theme)}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    intensity="light"
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}
                  >
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }}
                      />
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "#fff", textTransform: "capitalize" }}>
                        {group.theme}
                      </Text>
                      <Badge text={String(group.count)} />
                    </View>
                    {isExpanded ? (
                      <ChevronDown size={18} color="#64748b" />
                    ) : (
                      <ChevronRight size={18} color="#64748b" />
                    )}
                  </GlassCard>
                </TouchableOpacity>
                {isExpanded && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    {group.stories.map((story) => (
                      <TouchableOpacity
                        key={story.id}
                        onPress={() => router.push(`/story/${story.id}`)}
                        activeOpacity={0.8}
                      >
                        <GlassCard
                          intensity="light"
                          withBorder={false}
                          style={{ marginLeft: 24, marginTop: 8, padding: 12 }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {isCanonical(story) && (
                              <Star size={12} color="#facc15" fill="#facc15" />
                            )}
                            <Text style={{ flex: 1, fontSize: 13, color: "#fff" }} numberOfLines={1}>
                              {story.title}
                            </Text>
                            <Text style={{ fontSize: 11, color: "#64748b" }}>
                              {new Date(story.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </View>
            </AnimatedListItem>
          );
        })
      )}
    </View>
  );

  const renderDomainsView = () => {
    const totalStories = stories.length;
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {domainGroups.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ color: "#94a3b8" }}>No life areas tracked yet</Text>
          </View>
        ) : (
          domainGroups.map((group, idx) => {
            const Icon = DOMAIN_ICONS[group.domain] || TreePine;
            const color = DOMAIN_COLORS[group.domain] || "#94a3b8";
            const pct = totalStories > 0 ? (group.count / totalStories) * 100 : 0;
            return (
              <AnimatedListItem key={group.domain} index={idx}>
                <GlassCard intensity="light" style={{ padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: color + "20",
                      }}
                    >
                      <Icon size={20} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: "#fff", textTransform: "capitalize" }}>
                          {group.domain}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#94a3b8" }}>
                          {Math.round(pct)}%
                        </Text>
                      </View>
                      <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <LinearGradient
                          colors={[color, color + "80"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ height: 6, borderRadius: 3, width: `${pct}%` }}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: "#64748b" }}>
                      {group.count} {group.count === 1 ? "story" : "stories"}
                    </Text>
                    {group.dominantTone && (
                      <Text style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>
                        Tone: {group.dominantTone}
                      </Text>
                    )}
                  </View>
                </GlassCard>
              </AnimatedListItem>
            );
          })
        )}
      </View>
    );
  };

  const tabs: LibraryTab[] = ["all", "stories", "books", "key-moments", "themes", "life-areas"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <AnimatedListItem index={0}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>Your Archive</Text>
          <Text style={{ fontSize: 13, color: "#94a3b8" }}>
            {stories.length} stories
          </Text>
        </View>
      </AnimatedListItem>

      {/* Monthly Summary Card */}
      {monthlySummary && monthlySummary.storyCount > 0 && (
        <AnimatedListItem index={1}>
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <GlassCard intensity="medium" style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Calendar size={16} color="#a78bfa" />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {monthlySummary.month} {monthlySummary.year}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <StatCard value={monthlySummary.storyCount} label="Stories" />
                <StatCard value={monthlySummary.canonicalCount} label="Key Moments" color="#fbbf24" />
                <StatCard value={themeGroups.length} label="Themes" color="#a78bfa" />
              </View>
              {monthlySummary.topThemes.length > 0 && (
                <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {monthlySummary.topThemes.map((theme) => (
                    <Badge key={theme} text={theme} variant="violet" />
                  ))}
                  {monthlySummary.dominantDomain && (
                    <Badge text={monthlySummary.dominantDomain} variant="success" />
                  )}
                </View>
              )}
            </GlassCard>
          </View>
        </AnimatedListItem>
      )}

      {/* Stats Row */}
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4, flexDirection: "row", gap: 8 }}>
        <StatCard value={stories.length} label="Total" />
        <StatCard value={canonicalStories.length} label="Key Moments" color="#fbbf24" />
        <StatCard value={themeGroups.length} label="Themes" color="#a78bfa" />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return isActive ? (
            <GradientButton
              key={tab}
              onPress={() => setActiveTab(tab)}
              title={tab.replace("-", " ")}
              gradient={GRADIENTS.primary}
              size="sm"
            />
          ) : (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
            >
              <GlassCard
                intensity="light"
                style={{ paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: "#94a3b8",
                    textTransform: "capitalize",
                  }}
                >
                  {tab.replace("-", " ")}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
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
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Text style={{ color: "#94a3b8" }}>
                {isLoading ? "Loading..." : "No stories yet. Start recording!"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
