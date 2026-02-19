// Story Detail Screen - Content, audio, like, share, tip, paywall, CRE badge
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Coins,
  ShieldCheck,
  Play,
  Pause,
} from "lucide-react-native";
import { Audio } from "expo-av";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";
import { apiGet, apiPost } from "../../lib/api";
import type { StoryDataType, CommentDataTypes } from "../../types";

export default function StoryDetailScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { isAuthenticated } = useAuthStore();
  const [story, setStory] = useState<StoryDataType | null>(null);
  const [comments, setComments] = useState<CommentDataTypes[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await apiGet<{ story: StoryDataType; comments: CommentDataTypes[] }>(
          `/api/stories/${storyId}`
        );
        if (res.ok && res.data) {
          setStory(res.data.story);
          setComments(res.data.comments || []);
        }
      } catch (err) {
        console.error("[StoryDetail] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (storyId) fetchStory();
    return () => {
      sound?.unloadAsync();
    };
  }, [storyId]);

  const handleLike = async () => {
    if (!story || !isAuthenticated) return;
    setStory({
      ...story,
      isLiked: !story.isLiked,
      likes: story.isLiked ? story.likes - 1 : story.likes + 1,
    });
    await apiPost("/api/social/like", { storyId: story.id });
  };

  const handleComment = async () => {
    if (!newComment.trim() || !storyId) return;
    const res = await apiPost<{ comment: CommentDataTypes }>("/api/stories", {
      storyId,
      content: newComment,
    });
    if (res.ok && res.data?.comment) {
      setComments((prev) => [res.data!.comment, ...prev]);
      setNewComment("");
    }
  };

  const playAudio = async () => {
    if (!story?.audio_url) return;
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: story.audio_url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error("[StoryDetail] Audio play failed:", err);
    }
  };

  if (loading || !story) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-slate-400">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-3 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-white" numberOfLines={1}>
            {story.title}
          </Text>
        </View>

        {/* Author */}
        <View className="mb-4 flex-row items-center">
          {story.author.avatar ? (
            <Image
              source={{ uri: story.author.avatar }}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-violet-600">
              <Text className="text-xl font-bold text-white">
                {story.author.name?.[0] || "?"}
              </Text>
            </View>
          )}
          <View className="ml-3">
            <Text className="font-semibold text-white">
              {story.author.name || "Anonymous"}
            </Text>
            <Text className="text-xs text-slate-400">{story.timestamp}</Text>
          </View>
        </View>

        {/* Audio Player */}
        {story.hasAudio && story.audio_url && (
          <TouchableOpacity
            onPress={playAudio}
            className="mb-4 flex-row items-center gap-3 rounded-xl bg-slate-800 p-4"
          >
            {isPlaying ? (
              <Pause size={24} color="#a78bfa" />
            ) : (
              <Play size={24} color="#a78bfa" />
            )}
            <Text className="text-slate-300">
              {isPlaying ? "Playing..." : "Listen to audio"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Paywall */}
        {story.paywallAmount > 0 && !story.isPaid ? (
          <View className="rounded-xl bg-slate-800 p-6">
            <Lock size={32} color="#a78bfa" />
            <Text className="mt-2 text-lg font-semibold text-white">
              Premium Content
            </Text>
            <Text className="mt-1 text-sm text-slate-400">
              {story.teaser || "Unlock this story for"} {story.paywallAmount} $STORY
            </Text>
            <TouchableOpacity className="mt-4 rounded-xl bg-violet-600 p-3">
              <Text className="text-center font-semibold text-white">
                Unlock for {story.paywallAmount} $STORY
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Story Content */
          <Text className="mb-6 text-base leading-7 text-slate-200">
            {story.content}
          </Text>
        )}

        {/* Tags */}
        {story.tags.length > 0 && (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {story.tags.map((tag) => (
              <View key={tag} className="rounded-full bg-slate-800 px-3 py-1">
                <Text className="text-xs text-slate-400">#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row items-center gap-6 border-t border-slate-800 py-4">
          <TouchableOpacity
            onPress={handleLike}
            className="flex-row items-center gap-1"
          >
            <Heart
              size={22}
              color={story.isLiked ? "#ef4444" : "#64748b"}
              fill={story.isLiked ? "#ef4444" : "transparent"}
            />
            <Text className="text-sm text-slate-400">{story.likes}</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-1">
            <MessageCircle size={22} color="#64748b" />
            <Text className="text-sm text-slate-400">{comments.length}</Text>
          </View>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Coins size={22} color="#facc15" />
            <Text className="text-sm text-slate-400">Tip</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View className="mt-2">
          <Text className="mb-3 text-lg font-semibold text-white">
            Comments ({comments.length})
          </Text>

          {isAuthenticated && (
            <View className="mb-4 flex-row gap-2">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-white"
                placeholderTextColor="#64748b"
              />
              <TouchableOpacity
                onPress={handleComment}
                className="items-center justify-center rounded-xl bg-violet-600 px-4"
              >
                <Text className="font-semibold text-white">Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {comments.map((c) => (
            <View key={c.id} className="mb-3 rounded-xl bg-slate-800 p-3">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-slate-700">
                  <Text className="text-xs text-white">
                    {c.author.name?.[0] || "?"}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-white">
                  {c.author.name || "Anonymous"}
                </Text>
                <Text className="text-xs text-slate-500">
                  {new Date(c.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text className="mt-1 text-sm text-slate-300">{c.content}</Text>
            </View>
          ))}
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
