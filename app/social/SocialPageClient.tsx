"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../components/Provider";
import { useAuth } from "../../components/AuthProvider";
import { useBackgroundMode } from "@/contexts/BackgroundContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Users,
  Star,
  BookOpen,
  Zap,
  Loader2,
  Search,
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { toast } from "react-hot-toast";

// FIX: Relative paths based on app/social/ location
import { StoryCard } from "../../components/StoryCard";
import { StoryDataType } from "../types/index";
import { useEStoryToken } from "../hooks/useIStoryToken";
import { useStoryProtocol } from "../hooks/useStoryProtocol";
import { supabaseClient } from "../../app/utils/supabase/supabaseClient";
import { useAccount } from "wagmi";
import Link from "next/link";

// --- Types ---
interface AuthorProfile {
  id?: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  wallet_address: string | null;
  badges: string[] | null;
  followers: number;
  isFollowing: boolean;
}

export interface FeaturedWriterType {
  name: string;
  username: string;
  avatar: string;
  followers: number;
  stories: number;
  speciality: string;
}

// Mock data for sidebar (keep as requested)
const featuredWriters: FeaturedWriterType[] = [
  {
    name: "David Kim",
    username: "@davidk",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    followers: 2100,
    stories: 45,
    speciality: "Life Philosophy",
  },
  {
    name: "Anna Thompson",
    username: "@annat",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anna",
    followers: 1800,
    stories: 38,
    speciality: "Travel Adventures",
  },
  {
    name: "James Wilson",
    username: "@jamesw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    followers: 1450,
    stories: 52,
    speciality: "Tech Stories",
  },
];

export default function SocialPage() {
  const { isConnected } = useApp();
  const { address } = useAccount();

  // Set background mode for this page
  useBackgroundMode('social');

  // State
  const [stories, setStories] = useState<StoryDataType[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [unlockedStories, setUnlockedStories] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Hooks
  const eStoryToken = useEStoryToken();
  const { payPaywall } = useStoryProtocol();
  const supabase = supabaseClient;

  // Use centralized auth token from AuthProvider
  const { getAccessToken } = useAuth();

  // Helper to get auth headers for API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch ALL stories via API route (bypasses RLS, uses admin client)
        let data: any[] = [];
        try {
          const res = await fetch("/api/stories/feed");
          if (res.ok) {
            const json = await res.json();
            data = json.stories || [];
          }
        } catch {
          // API route failed — try direct Supabase as fallback
        }

        // Fallback: retry the API route once (skip direct Supabase — RLS issues)
        if (data.length === 0) {
          try {
            const retryRes = await fetch("/api/stories/feed");
            if (retryRes.ok) {
              const retryJson = await retryRes.json();
              data = retryJson.stories || [];
            }
          } catch {
            // Fallback failed — proceed with empty data
          }
        }

        // 2. Filter out stories with missing authors (data integrity) and non-public
        const validStories = (data?.filter((s: any) => s.author) as any[]) || [];

        // 3. Collect unique author IDs for follow status check
        const authorIds = [
          ...new Set(
            validStories
              .map((s) => s.author?.id)
              .filter(Boolean)
          ),
        ] as string[];

        // 4. Fetch follow status + like status in parallel (if user is authenticated)
        let followingMap: Record<string, boolean> = {};
        let likedMap: Record<string, boolean> = {};
        const token = await getAccessToken();
        if (token) {
          const authHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };

          const [followResult, likeResult] = await Promise.allSettled([
            // Follow status
            authorIds.length > 0
              ? fetch(`/api/social/follow?followed_ids=${authorIds.join(",")}`, { headers: authHeaders })
                  .then((r) => r.ok ? r.json() : null)
              : Promise.resolve(null),
            // Like status
            validStories.length > 0
              ? fetch(`/api/social/like/status?story_ids=${validStories.map((s: any) => s.id).join(",")}`, { headers: authHeaders })
                  .then((r) => r.ok ? r.json() : null)
              : Promise.resolve(null),
          ]);

          if (followResult.status === "fulfilled" && followResult.value) {
            followingMap = followResult.value.following || {};
          }
          if (likeResult.status === "fulfilled" && likeResult.value) {
            likedMap = likeResult.value.liked || {};
          }
        }

        // 5. Map DB data to UI format
        const authorProfile = (s: any): AuthorProfile => ({
          id: s.author.id,
          name: s.author.name || "Anonymous Writer",
          username:
            s.author.username ||
            `@user${s.author.wallet_address?.slice(0, 4)}`,
          avatar: s.author.avatar,
          wallet_address: s.author.wallet_address,
          followers:
            s.author.followers_count ?? 0,
          badges: s.author.badges ?? ["Storyteller"],
          isFollowing:
            followingMap[s.author.id] || false,
        });

        const storiesWithDefaults: StoryDataType[] = validStories.map((s) => {
          const author = authorProfile(s);
          return {
            id: s.id,
            numeric_id: s.numeric_id ?? String(s.id),

            // Author Mapping - both author and author_wallet required
            author: author,
            author_wallet: author,

            // Story Content Mapping
            title: s.title ?? "Untitled Story",
            content: s.content ?? "",
            teaser: s.teaser,
            timestamp: s.created_at,

            // Stats Mapping
            likes: s.likes ?? 0,
            comments: s.comments_count ?? 0,
            shares: s.shares ?? Math.floor(Math.random() * 50),

            // Media & Meta
            hasAudio: s.has_audio ?? false,
            audio_url: s.audio_url,
            mood: s.mood || "neutral",
            tags: s.tags && s.tags.length > 0 ? s.tags : ["life", "story"],
            paywallAmount: s.paywall_amount ?? 0,

            // Required fields
            is_public: true,
            story_date: s.story_date || s.created_at,
            created_at: s.created_at,

            // Interactive State
            isLiked: likedMap[s.id] || false,
            isPaid: false,
          };
        });

        setStories(storiesWithDefaults);
      } catch (err: any) {
        console.error("[SOCIAL PAGE] Fetch error:", err);
        toast.error("Failed to load the feed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupabaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Event Handlers ---

  const handleUnlock = async (storyNumericId: string) => {
    if (!isConnected || !address || !eStoryToken) {
      return toast.error("Please connect your wallet to unlock stories.");
    }

    const story = stories.find((s) => s.numeric_id === storyNumericId);
    if (!story || !story.author_wallet?.wallet_address) {
      return toast.error("Invalid story data");
    }

    try {
      toast.loading("Processing payment...", { id: "unlock-toast" });

      const authorAddress = story.author_wallet.wallet_address as string;

      await payPaywall(
        authorAddress,
        story.paywallAmount,
        story.numeric_id
      );

      setUnlockedStories((prev) => new Set(prev).add(String(story.id)));
      setStories((prev) =>
        prev.map((s) => (String(s.id) === String(story.id) ? { ...s, isPaid: true } : s))
      );

      toast.success(`Unlocked! Paid ${story.paywallAmount} $ESTORY`, {
        id: "unlock-toast",
      });
    } catch (error: any) {
      console.error("Unlock error:", error);
      toast.error("Transaction failed", { id: "unlock-toast" });
    }
  };

  const handleLike = async (storyNumericId: string) => {
    const token = await getAccessToken();
    if (!token) {
      return toast.error("Please sign in to like stories.");
    }

    const storyIndex = stories.findIndex(
      (s) => s.numeric_id === storyNumericId
    );
    if (storyIndex === -1) return;

    const story = stories[storyIndex];
    const isCurrentlyLiked = story.isLiked;
    const originalLikes = story.likes;

    // Optimistic UI Update
    setStories((prev) =>
      prev.map((s, i) =>
        i === storyIndex
          ? {
              ...s,
              isLiked: !isCurrentlyLiked,
              likes: isCurrentlyLiked ? s.likes - 1 : s.likes + 1,
            }
          : s
      )
    );

    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storyId: story.id }),
      });

      if (!res.ok) throw new Error("Like failed");

      const { data } = await res.json();
      // Sync with server state
      setStories((prev) =>
        prev.map((s, i) =>
          i === storyIndex
            ? { ...s, isLiked: data.isLiked, likes: data.totalLikes }
            : s
        )
      );
    } catch (error) {
      console.error("Like error:", error);
      // Revert UI on failure
      setStories((prev) =>
        prev.map((s, i) =>
          i === storyIndex
            ? { ...s, isLiked: isCurrentlyLiked, likes: originalLikes }
            : s
        )
      );
      toast.error("Like action failed");
    }
  };

  const handleFollow = async (authorId: string) => {
    const token = await getAccessToken();
    if (!token) return toast.error("Please sign in to follow writers.");

    // Optimistic UI: toggle isFollowing on all stories by this author
    setStories((prev) =>
      prev.map((s) =>
        s.author?.id === authorId
          ? {
              ...s,
              author_wallet: { ...s.author_wallet, isFollowing: !s.author_wallet?.isFollowing },
              author: { ...s.author, isFollowing: !s.author.isFollowing },
            }
          : s
      )
    );

    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          followed_id: authorId,
        }),
      });

      if (!res.ok) {
        throw new Error("Follow action failed");
      }

      const { isFollowing, followers_count } = await res.json();

      // Update with server-confirmed state and follower count
      setStories((prev) =>
        prev.map((s) =>
          s.author?.id === authorId
            ? {
                ...s,
                author_wallet: { ...s.author_wallet, isFollowing, followers: followers_count },
                author: { ...s.author, isFollowing, followers: followers_count },
              }
            : s
        )
      );

      toast.success(isFollowing ? "Followed!" : "Unfollowed");
    } catch (error) {
      console.error("Follow error:", error);
      // Revert optimistic update
      setStories((prev) =>
        prev.map((s) =>
          s.author?.id === authorId
            ? {
                ...s,
                author_wallet: { ...s.author_wallet, isFollowing: !s.author_wallet?.isFollowing },
                author: { ...s.author, isFollowing: !s.author.isFollowing },
              }
            : s
        )
      );
      toast.error("Follow action failed");
    }
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/story/${id}`;
    if (navigator.share) {
      navigator.share({ title: "Check out this story!", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  // Filter Logic
  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "trending") return matchesSearch && story.likes > 5; // Dummy trending logic
    if (activeTab === "following")
      return matchesSearch && story.author_wallet?.isFollowing; // Dummy following logic

    return matchesSearch;
  });

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BrandedLoader size="md" message="Curating stories..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] rounded-full flex items-center justify-center shadow-lg"
        >
          <Users className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Discover <span className="text-gradient-memory">Stories</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore narratives from storytellers preserving what matters
        </p>
      </div>

      {/* Stats Bar */}
      <Card className="card-elevated bg-[hsl(var(--memory-500)/0.05)] border-[hsl(var(--memory-500)/0.2)]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <BookOpen className="w-6 h-6 mx-auto text-[hsl(var(--memory-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Published Stories
              </div>
            </div>
            <div className="text-center space-y-2">
              <Users className="w-6 h-6 mx-auto text-[hsl(var(--insight-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {new Set(stories.map(s => s.author?.id).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Writers
              </div>
            </div>
            <div className="text-center space-y-2">
              <TrendingUp className="w-6 h-6 mx-auto text-[hsl(var(--growth-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                #mindful
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Trending
              </div>
            </div>
            <div className="text-center space-y-2">
              <Star className="w-6 h-6 mx-auto text-[hsl(var(--story-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {isConnected && eStoryToken?.balance !== undefined
                  ? `${Number(eStoryToken.balance / BigInt(1e18)).toFixed(0)}`
                  : "0"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your $ESTORY
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Center: Story Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search stories or tags..."
              className="pl-10 bg-white/50 dark:bg-gray-800/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="feed">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>

            {/* Feed Content */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredStories.length > 0 ? (
                  filteredStories.map((story, index) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/story/${story.id}`} passHref>
                        <StoryCard
                          story={{
                            ...story,
                            isPaid:
                              story.isPaid || unlockedStories.has(String(story.id)),
                          }}
                          onFollow={() =>
                            handleFollow(
                              story.author?.id || ""
                            )
                          }
                          onShare={() => handleShare(String(story.id))}
                          onLike={() => handleLike(story.numeric_id)}
                          onUnlock={() => handleUnlock(story.numeric_id)}
                        />
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold">No stories found</h3>
                    <p>Be the first to share your story!</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Featured Writers */}
          <Card className="card-elevated sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-[hsl(var(--story-500))]" />
                <span>Featured Writers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredWriters.map((writer) => (
                <div
                  key={writer.username}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-[hsl(var(--memory-400))] transition-all">
                      <AvatarImage src={writer.avatar} alt={writer.name || "Writer"} />
                      <AvatarFallback>{writer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{writer.name}</div>
                      <div className="text-xs text-gray-500">
                        {writer.speciality}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[hsl(var(--growth-500))]" />
                <span>Trending Topics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "#mindfulness",
                  "#tech",
                  "#travel",
                  "#wellness",
                  "#crypto",
                  "#dreams",
                  "#nature",
                  "#future",
                ].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-[hsl(var(--memory-500)/0.15)] transition-colors"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Community Impact */}
          <Card className="card-elevated bg-[hsl(var(--growth-500)/0.05)] border-[hsl(var(--growth-500)/0.2)]">
            <CardHeader>
              <CardTitle className="text-lg text-gradient-growth">Community Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Paid
                </span>
                <span className="font-bold text-[hsl(var(--growth-500))]">
                  45.2K $ESTORY
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Shared
                </span>
                <span className="font-bold text-[hsl(var(--growth-600))]">12.5K Stories</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
