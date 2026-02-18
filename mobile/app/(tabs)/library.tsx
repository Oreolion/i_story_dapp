// Library/Archive Screen - Personal stories, books, themes
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BookOpen, Star, Tag, Globe } from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { apiGet } from "../../lib/api";
import type { StoryDataType } from "../../types";

type LibraryTab = "all" | "stories" | "books" | "key-moments";

export default function LibraryScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [stories, setStories] = useState<StoryDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");

  const fetchLibrary = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiGet<{ stories: StoryDataType[] }>("/api/stories");
      if (res.ok && res.data?.stories) {
        // Filter to user's own stories
        setStories(
          res.data.stories.filter(
            (s) => s.author.wallet_address === user?.wallet_address
          )
        );
      }
    } catch (err) {
      console.error("[Library] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLibrary();
    setRefreshing(false);
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

  const renderStory = ({ item }: { item: StoryDataType }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.id}`)}
      className="mb-3 rounded-xl bg-slate-800 p-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
          {item.title}
        </Text>
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
      <View className="mt-2 flex-row gap-2">
        <View className="rounded-full bg-slate-700 px-2 py-1">
          <Text className="text-xs capitalize text-slate-300">{item.mood}</Text>
        </View>
        {!item.is_public && (
          <View className="rounded-full bg-amber-900/30 px-2 py-1">
            <Text className="text-xs text-amber-400">Private</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-4 py-4">
        <Text className="text-2xl font-bold text-white">Your Archive</Text>
        <Text className="text-sm text-slate-400">
          {stories.length} stories
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 pb-3">
        {(["all", "stories", "books", "key-moments"] as LibraryTab[]).map(
          (tab) => (
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
          )
        )}
      </View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStory}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-slate-400">
              {loading ? "Loading..." : "No stories yet. Start recording!"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
