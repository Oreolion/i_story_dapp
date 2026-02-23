// Story Detail Screen - Content, audio, like, share, tip, paywall, CRE badge, metadata, canonical toggle
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
  Star,
  Briefcase,
  Activity,
  Brain,
  Compass,
  Palette,
  Sparkles,
  GraduationCap,
  Lightbulb,
  Users,
  TreePine,
} from "lucide-react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";
import { apiGet, apiPost, apiPatch } from "../../lib/api";
import type { StoryDataType, CommentDataTypes, StoryMetadata, LifeDomain } from "../../types";

const DOMAIN_ICONS: Record<string, React.ComponentType<any>> = {
  work: Briefcase,
  relationships: Users,
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

const DOMAIN_COLORS: Record<string, string> = {
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

const TONE_COLORS: Record<string, string> = {
  reflective: "#818cf8",
  joyful: "#facc15",
  anxious: "#f87171",
  hopeful: "#4ade80",
  melancholic: "#a78bfa",
  grateful: "#34d399",
  frustrated: "#fb923c",
  peaceful: "#22d3ee",
  excited: "#f472b6",
  uncertain: "#94a3b8",
  neutral: "#64748b",
};

export default function StoryDetailScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [story, setStory] = useState<StoryDataType | null>(null);
  const [metadata, setMetadata] = useState<StoryMetadata | null>(null);
  const [comments, setComments] = useState<CommentDataTypes[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCanonical, setIsCanonical] = useState(false);
  const [togglingCanonical, setTogglingCanonical] = useState(false);

  const isOwner =
    isAuthenticated &&
    story &&
    user &&
    (story.author.wallet_address === user.wallet_address ||
      (story.author as any).id === user.id);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await apiGet<{
          story: StoryDataType;
          comments: CommentDataTypes[];
          metadata?: StoryMetadata;
          story_metadata?: StoryMetadata;
        }>(`/api/stories/${storyId}`);
        if (res.ok && res.data) {
          setStory(res.data.story);
          setComments(res.data.comments || []);
          const meta =
            res.data.metadata ||
            res.data.story_metadata ||
            (res.data.story as any).story_metadata ||
            (res.data.story as any).metadata ||
            null;
          setMetadata(meta);
          setIsCanonical(meta?.is_canonical === true);
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

  const toggleCanonical = async () => {
    if (!storyId || togglingCanonical) return;
    setTogglingCanonical(true);
    const newValue = !isCanonical;
    try {
      const res = await apiPatch(`/api/stories/${storyId}/metadata`, {
        is_canonical: newValue,
      });
      if (res.ok) {
        setIsCanonical(newValue);
        setMetadata((prev) => (prev ? { ...prev, is_canonical: newValue } : prev));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error("[StoryDetail] Toggle canonical failed:", err);
    } finally {
      setTogglingCanonical(false);
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

  const DomainIcon = metadata?.life_domain
    ? DOMAIN_ICONS[metadata.life_domain] || TreePine
    : null;
  const domainColor = metadata?.life_domain
    ? DOMAIN_COLORS[metadata.life_domain] || "#94a3b8"
    : "#94a3b8";
  const toneColor = metadata?.emotional_tone
    ? TONE_COLORS[metadata.emotional_tone] || "#64748b"
    : "#64748b";

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
          {isOwner && (
            <TouchableOpacity onPress={toggleCanonical} disabled={togglingCanonical}>
              <Star
                size={24}
                color={isCanonical ? "#facc15" : "#64748b"}
                fill={isCanonical ? "#facc15" : "transparent"}
              />
            </TouchableOpacity>
          )}
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

        {/* Metadata Section */}
        {metadata && (
          <View className="mb-4 rounded-xl bg-slate-800 p-4">
            {/* Themes */}
            {metadata.themes && metadata.themes.length > 0 && (
              <View className="mb-3">
                <Text className="mb-1.5 text-xs font-medium text-slate-500">THEMES</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {metadata.themes.map((theme, i) => (
                    <View
                      key={theme}
                      className="rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor:
                          (["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"][
                            i % 5
                          ]) + "25",
                      }}
                    >
                      <Text
                        className="text-xs font-medium capitalize"
                        style={{
                          color: ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"][
                            i % 5
                          ],
                        }}
                      >
                        {theme}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Domain + Tone Row */}
            <View className="mb-3 flex-row gap-2">
              {metadata.life_domain && DomainIcon && (
                <View
                  className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ backgroundColor: domainColor + "20" }}
                >
                  <DomainIcon size={12} color={domainColor} />
                  <Text
                    className="text-xs font-medium capitalize"
                    style={{ color: domainColor }}
                  >
                    {metadata.life_domain}
                  </Text>
                </View>
              )}
              {metadata.emotional_tone && (
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: toneColor + "20" }}
                >
                  <Text
                    className="text-xs font-medium capitalize"
                    style={{ color: toneColor }}
                  >
                    {metadata.emotional_tone}
                  </Text>
                </View>
              )}
              {metadata.significance_score > 0 && (
                <View className="flex-row items-center gap-1 rounded-full bg-amber-900/20 px-2.5 py-1">
                  <Text className="text-xs font-medium text-amber-400">
                    Significance: {metadata.significance_score}/10
                  </Text>
                </View>
              )}
            </View>

            {/* Brief Insight */}
            {metadata.brief_insight && (
              <View className="rounded-lg bg-slate-700/50 p-3">
                <Text className="text-xs italic leading-5 text-slate-300">
                  "{metadata.brief_insight}"
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Key Moment Toggle (owner only) */}
        {isOwner && (
          <TouchableOpacity
            onPress={toggleCanonical}
            disabled={togglingCanonical}
            className={`mb-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
              isCanonical ? "bg-amber-900/30" : "bg-slate-800"
            }`}
          >
            <Star
              size={18}
              color={isCanonical ? "#facc15" : "#64748b"}
              fill={isCanonical ? "#facc15" : "transparent"}
            />
            <Text
              className={`text-sm font-medium ${
                isCanonical ? "text-amber-400" : "text-slate-400"
              }`}
            >
              {isCanonical ? "Key Moment" : "Mark as Key Moment"}
            </Text>
          </TouchableOpacity>
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
