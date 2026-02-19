// Social Feed - Stories from community
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, Heart, MessageCircle, Share2, Lock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";
import { apiGet, apiPost } from "../../lib/api";
import type { StoryDataType } from "../../types";

type FeedTab = "latest" | "trending" | "following";

export default function SocialScreen() {
  const { isAuthenticated } = useAuthStore();
  const [stories, setStories] = useState<StoryDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");

  const fetchStories = useCallback(async () => {
    try {
      const res = await apiGet<{ stories: StoryDataType[] }>("/api/stories");
      if (res.ok && res.data?.stories) {
        setStories(res.data.stories);
      }
    } catch (err) {
      console.error("[Social] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStories();
    setRefreshing(false);
  };

  const handleLike = async (storyId: number) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    // Optimistic update
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 }
          : s
      )
    );
    await apiPost("/api/social/like", { storyId });
  };

  const filteredStories = stories.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase())
  );

  const renderStory = ({ item }: { item: StoryDataType }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.id}`)}
      className="mb-4 rounded-2xl bg-slate-800 p-4"
    >
      {/* Author Row */}
      <View className="mb-3 flex-row items-center">
        {item.author.avatar ? (
          <Image
            source={{ uri: item.author.avatar }}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-600">
            <Text className="text-lg font-bold text-white">
              {item.author.name?.[0] || "?"}
            </Text>
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-white">
            {item.author.name || "Anonymous"}
          </Text>
          <Text className="text-xs text-slate-400">{item.timestamp}</Text>
        </View>
        <View className="rounded-full bg-slate-700 px-3 py-1">
          <Text className="text-xs capitalize text-slate-300">{item.mood}</Text>
        </View>
      </View>

      {/* Content */}
      <Text className="mb-1 text-lg font-semibold text-white">{item.title}</Text>
      {item.paywallAmount > 0 && !item.isPaid ? (
        <View className="flex-row items-center gap-2">
          <Lock size={14} color="#64748b" />
          <Text className="text-sm italic text-slate-400">
            {item.teaser || "Premium content — unlock to read"}
          </Text>
        </View>
      ) : (
        <Text className="text-sm leading-5 text-slate-300" numberOfLines={3}>
          {item.content}
        </Text>
      )}

      {/* Actions */}
      <View className="mt-3 flex-row items-center gap-6">
        <TouchableOpacity
          onPress={() => handleLike(item.id)}
          className="flex-row items-center gap-1"
        >
          <Heart
            size={18}
            color={item.isLiked ? "#ef4444" : "#64748b"}
            fill={item.isLiked ? "#ef4444" : "transparent"}
          />
          <Text className="text-sm text-slate-400">{item.likes}</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-1">
          <MessageCircle size={18} color="#64748b" />
          <Text className="text-sm text-slate-400">{item.comments}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Share2 size={18} color="#64748b" />
          <Text className="text-sm text-slate-400">{item.shares}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Search Bar */}
      <View className="flex-row items-center gap-2 px-4 py-3">
        <View className="flex-1 flex-row items-center rounded-xl bg-slate-800 px-3 py-2">
          <Search size={18} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search stories..."
            className="ml-2 flex-1 text-base text-white"
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 pb-3">
        {(["latest", "trending", "following"] as FeedTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 ${
              activeTab === tab ? "bg-violet-600" : "bg-slate-800"
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                activeTab === tab ? "text-white" : "text-slate-400"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
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
              {loading ? "Loading stories..." : "No stories yet"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
