// Story Detail Screen - Content, audio, like, share, tip, paywall, CRE badge, metadata, canonical toggle
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Coins,
  Lock,
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
import { useAuthStore } from "../../stores/authStore";
import { apiGet, apiPost, apiPatch } from "../../lib/api";
import type { StoryDataType, CommentDataTypes, StoryMetadata } from "../../types";
import {
  GlassCard,
  GradientButton,
  AnimatedListItem,
  Badge,
  Avatar,
  SkeletonLoader,
  GRADIENTS,
} from "../../components/ui";

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
  work: "#60a5fa", relationships: "#f472b6", health: "#4ade80",
  identity: "#a78bfa", growth: "#facc15", creativity: "#fb923c",
  spirituality: "#c084fc", family: "#f87171", adventure: "#22d3ee",
  learning: "#34d399", general: "#94a3b8",
};

const TONE_COLORS: Record<string, string> = {
  reflective: "#818cf8", joyful: "#facc15", anxious: "#f87171",
  hopeful: "#4ade80", melancholic: "#a78bfa", grateful: "#34d399",
  frustrated: "#fb923c", peaceful: "#22d3ee", excited: "#f472b6",
  uncertain: "#94a3b8", neutral: "#64748b",
};

const THEME_COLORS = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];

function HeartButton({ isLiked, count, onPress }: { isLiked: boolean; count: number; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  return (
    <TouchableOpacity onPress={handlePress} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Animated.View style={animatedStyle}>
        <Heart size={22} color={isLiked ? "#ef4444" : "#64748b"} fill={isLiked ? "#ef4444" : "transparent"} />
      </Animated.View>
      <Text style={{ fontSize: 13, color: "#94a3b8" }}>{count}</Text>
    </TouchableOpacity>
  );
}

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
    isAuthenticated && story && user &&
    (story.author.wallet_address === user.wallet_address || (story.author as any).id === user.id);

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
          const meta = res.data.metadata || res.data.story_metadata ||
            (res.data.story as any).story_metadata || (res.data.story as any).metadata || null;
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
    return () => { sound?.unloadAsync(); };
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
      storyId, content: newComment,
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
      const res = await apiPatch(`/api/stories/${storyId}/metadata`, { is_canonical: newValue });
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
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
        else { await sound.playAsync(); setIsPlaying(true); }
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: story.audio_url }, { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
      });
    } catch (err) {
      console.error("[StoryDetail] Audio play failed:", err);
    }
  };

  if (loading || !story) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", paddingHorizontal: 16 }}>
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <SkeletonLoader variant="title" />
        <View style={{ marginTop: 16 }}>
          <SkeletonLoader variant="line" count={6} />
        </View>
      </SafeAreaView>
    );
  }

  const DomainIcon = metadata?.life_domain ? DOMAIN_ICONS[metadata.life_domain] || TreePine : null;
  const domainColor = metadata?.life_domain ? DOMAIN_COLORS[metadata.life_domain] || "#94a3b8" : "#94a3b8";
  const toneColor = metadata?.emotional_tone ? TONE_COLORS[metadata.emotional_tone] || "#64748b" : "#64748b";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "600", color: "#fff" }} numberOfLines={1}>
              {story.title}
            </Text>
            {isOwner && (
              <TouchableOpacity onPress={toggleCanonical} disabled={togglingCanonical}>
                <Star size={24} color={isCanonical ? "#facc15" : "#64748b"} fill={isCanonical ? "#facc15" : "transparent"} />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedListItem>

        {/* Author */}
        <AnimatedListItem index={1}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Avatar
              uri={story.author.avatar}
              name={story.author.name}
              size="lg"
              withGradientBorder
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontWeight: "600", color: "#fff", fontSize: 15 }}>
                {story.author.name || "Anonymous"}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b" }}>{story.timestamp}</Text>
            </View>
          </View>
        </AnimatedListItem>

        {/* Audio Player */}
        {story.hasAudio && story.audio_url && (
          <AnimatedListItem index={2}>
            <TouchableOpacity onPress={playAudio} activeOpacity={0.8}>
              <GlassCard
                intensity="light"
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 16 }}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
                >
                  {isPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
                </LinearGradient>
                <Text style={{ color: "#cbd5e1", fontSize: 14 }}>
                  {isPlaying ? "Playing..." : "Listen to audio"}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </AnimatedListItem>
        )}

        {/* Paywall or Content */}
        <AnimatedListItem index={3}>
          {story.paywallAmount > 0 && !story.isPaid ? (
            <GlassCard intensity="medium" style={{ padding: 24, marginBottom: 16 }}>
              <Lock size={32} color="#a78bfa" />
              <Text style={{ marginTop: 8, fontSize: 17, fontWeight: "600", color: "#fff" }}>
                Premium Content
              </Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: "#94a3b8" }}>
                {story.teaser || "Unlock this story for"} {story.paywallAmount} $STORY
              </Text>
              <View style={{ marginTop: 16 }}>
                <GradientButton
                  onPress={() => {}}
                  title={`Unlock for ${story.paywallAmount} $STORY`}
                  gradient={GRADIENTS.primary}
                  fullWidth
                />
              </View>
            </GlassCard>
          ) : (
            <Text style={{ marginBottom: 24, fontSize: 15, lineHeight: 26, color: "#e2e8f0" }}>
              {story.content}
            </Text>
          )}
        </AnimatedListItem>

        {/* Metadata Section */}
        {metadata && (
          <AnimatedListItem index={4}>
            <GlassCard intensity="light" style={{ padding: 16, marginBottom: 16 }}>
              {/* Themes */}
              {metadata.themes && metadata.themes.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ marginBottom: 6, fontSize: 10, fontWeight: "600", color: "#64748b", letterSpacing: 1 }}>
                    THEMES
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {metadata.themes.map((theme, i) => (
                      <Badge
                        key={theme}
                        text={theme}
                        color={THEME_COLORS[i % 5]}
                        bgColor={THEME_COLORS[i % 5] + "25"}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Domain + Tone Row */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {metadata.life_domain && DomainIcon && (
                  <Badge text={metadata.life_domain} color={domainColor} bgColor={domainColor + "20"} />
                )}
                {metadata.emotional_tone && (
                  <Badge text={metadata.emotional_tone} color={toneColor} bgColor={toneColor + "20"} />
                )}
                {metadata.significance_score > 0 && (
                  <Badge text={`Significance: ${metadata.significance_score}/10`} variant="warning" />
                )}
              </View>

              {/* Brief Insight */}
              {metadata.brief_insight && (
                <GlassCard intensity="light" withBorder={false} style={{ padding: 12 }}>
                  <Text style={{ fontSize: 12, fontStyle: "italic", lineHeight: 18, color: "#cbd5e1" }}>
                    "{metadata.brief_insight}"
                  </Text>
                </GlassCard>
              )}
            </GlassCard>
          </AnimatedListItem>
        )}

        {/* Key Moment Toggle (owner only) */}
        {isOwner && (
          <AnimatedListItem index={5}>
            <TouchableOpacity onPress={toggleCanonical} disabled={togglingCanonical} activeOpacity={0.8}>
              <GlassCard
                intensity="light"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  marginBottom: 16,
                  ...(isCanonical && { backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)" }),
                }}
              >
                <Star size={18} color={isCanonical ? "#facc15" : "#64748b"} fill={isCanonical ? "#facc15" : "transparent"} />
                <Text style={{ fontSize: 13, fontWeight: "500", color: isCanonical ? "#fbbf24" : "#94a3b8" }}>
                  {isCanonical ? "Key Moment" : "Mark as Key Moment"}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </AnimatedListItem>
        )}

        {/* Tags */}
        {story.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {story.tags.map((tag) => (
              <Badge key={tag} text={`#${tag}`} />
            ))}
          </View>
        )}

        {/* Actions */}
        <AnimatedListItem index={6}>
          <GlassCard
            intensity="light"
            style={{ flexDirection: "row", alignItems: "center", gap: 24, padding: 16, marginBottom: 16 }}
          >
            <HeartButton isLiked={story.isLiked} count={story.likes} onPress={handleLike} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MessageCircle size={22} color="#64748b" />
              <Text style={{ fontSize: 13, color: "#94a3b8" }}>{comments.length}</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Coins size={22} color="#facc15" />
              <Text style={{ fontSize: 13, color: "#94a3b8" }}>Tip</Text>
            </TouchableOpacity>
          </GlassCard>
        </AnimatedListItem>

        {/* Comments */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ marginBottom: 12, fontSize: 17, fontWeight: "600", color: "#fff" }}>
            Comments ({comments.length})
          </Text>

          {isAuthenticated && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <GlassCard intensity="light" style={{ flex: 1, padding: 0 }}>
                <TextInput
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Write a comment..."
                  style={{ paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#fff" }}
                  placeholderTextColor="#64748b"
                />
              </GlassCard>
              <GradientButton
                onPress={handleComment}
                title="Post"
                gradient={GRADIENTS.primary}
                size="sm"
              />
            </View>
          )}

          {comments.map((c, idx) => (
            <AnimatedListItem key={c.id} index={idx}>
              <GlassCard intensity="light" style={{ padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Avatar uri={null} name={c.author.name} size="sm" />
                  <Text style={{ fontSize: 13, fontWeight: "500", color: "#fff" }}>
                    {c.author.name || "Anonymous"}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#64748b" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ marginTop: 6, fontSize: 13, color: "#cbd5e1", lineHeight: 18 }}>
                  {c.content}
                </Text>
              </GlassCard>
            </AnimatedListItem>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
