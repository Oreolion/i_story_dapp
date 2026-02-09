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
import { toast } from "react-hot-toast";

// FIX: Relative paths based on app/social/ location
import { StoryCard } from "../../components/StoryCard";
import { StoryDataType } from "../types/index";
import { useIStoryToken } from "../hooks/useIStoryToken";
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
  const iStoryToken = useIStoryToken();
  const { payPaywall } = useStoryProtocol();
  const supabase = supabaseClient;

  // Helper to get auth token for API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!supabase) return { "Content-Type": "application/json" };
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // --- Fetch Data ---
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch ALL stories (public feed)
        const { data, error } = await supabase
          .from("stories")
          .select(
            `
            id, numeric_id, title, content, created_at, likes, comments_count, shares, has_audio, audio_url, mood, tags, paywall_amount, teaser,
            author:users!stories_author_wallet_fkey (
              id, name, username, avatar, wallet_address, followers_count, badges
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        // 2. Filter out stories with missing authors (data integrity)
        const validStories = (data?.filter((s) => s.author) as any[]) || [];

        // 3. Collect unique author wallet addresses for follow status check
        const authorWallets = [
          ...new Set(
            validStories
              .map((s) => s.author?.wallet_address?.toLowerCase())
              .filter(Boolean)
          ),
        ] as string[];

        // 4. Fetch follow status for all authors (if user is connected)
        let followingMap: Record<string, boolean> = {};
        if (address && authorWallets.length > 0) {
          try {
            const headers = await getAuthHeaders();
            const followRes = await fetch(
              `/api/social/follow?follower_wallet=${address.toLowerCase()}&followed_wallets=${authorWallets.join(",")}`,
              { headers }
            );
            if (followRes.ok) {
              const { following } = await followRes.json();
              followingMap = following || {};
            }
          } catch (err) {
            console.error("[SOCIAL PAGE] Follow status fetch error:", err);
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
            followingMap[s.author.wallet_address?.toLowerCase()] || false,
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
            tags: s.tags && s.tags.length > 0 ? s.tags : ["life", "journal"],
            paywallAmount: s.paywall_amount ?? 0,

            // Required fields
            is_public: true,
            story_date: s.story_date || s.created_at,
            created_at: s.created_at,

            // Interactive State
            isLiked: false,
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
  }, [supabase, address]);

  // --- Event Handlers ---

  const handleUnlock = async (storyNumericId: string) => {
    if (!isConnected || !address || !iStoryToken) {
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

      toast.success(`Unlocked! Paid ${story.paywallAmount} $ISTORY`, {
        id: "unlock-toast",
      });
    } catch (error: any) {
      console.error("Unlock error:", error);
      toast.error("Transaction failed", { id: "unlock-toast" });
    }
  };

  const handleLike = async (storyNumericId: string) => {
    if (!isConnected || !address) {
      return toast.error("Please connect your wallet.");
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
      // Like functionality - currently using optimistic UI only
      // TODO: Implement blockchain-based like system when contract is ready

      // Optional: Fetch actual count from contract here to ensure sync
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

  const handleFollow = async (authorWallet: string) => {
    if (!isConnected || !address) return toast.error("Connect wallet to follow.");
    if (address.toLowerCase() === authorWallet.toLowerCase()) return;

    // Optimistic UI: toggle isFollowing on all stories by this author
    setStories((prev) =>
      prev.map((s) =>
        s.author_wallet?.wallet_address?.toLowerCase() === authorWallet.toLowerCase()
          ? {
              ...s,
              author_wallet: { ...s.author_wallet, isFollowing: !s.author_wallet.isFollowing },
              author: { ...s.author, isFollowing: !s.author.isFollowing },
            }
          : s
      )
    );

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers,
        body: JSON.stringify({
          follower_wallet: address,
          followed_wallet: authorWallet,
        }),
      });

      if (!res.ok) {
        throw new Error("Follow action failed");
      }

      const { isFollowing, followers_count } = await res.json();

      // Update with server-confirmed state and follower count
      setStories((prev) =>
        prev.map((s) =>
          s.author_wallet?.wallet_address?.toLowerCase() === authorWallet.toLowerCase()
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
          s.author_wallet?.wallet_address?.toLowerCase() === authorWallet.toLowerCase()
            ? {
                ...s,
                author_wallet: { ...s.author_wallet, isFollowing: !s.author_wallet.isFollowing },
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--memory-500))]" />
        <h2 className="text-2xl font-semibold">Curating stories...</h2>
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
          Community <span className="text-gradient-memory">Stories</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover inspiring stories from writers around the world
        </p>
      </div>

      {/* Stats Bar */}
      <Card className="card-elevated bg-[hsl(var(--memory-500)/0.05)] border-[hsl(var(--memory-500)/0.2)]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <BookOpen className="w-6 h-6 mx-auto text-[hsl(var(--memory-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stories.length + 124}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Stories Today
              </div>
            </div>
            <div className="text-center space-y-2">
              <Users className="w-6 h-6 mx-auto text-[hsl(var(--insight-500))]" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                2.8K
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
                {isConnected && iStoryToken?.balance !== undefined
                  ? `${Number(iStoryToken.balance / BigInt(1e18)).toFixed(0)}`
                  : "0"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your $ISTORY
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
                              story.author_wallet?.wallet_address || ""
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
                      <AvatarImage src={writer.avatar} />
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
                  45.2K $ISTORY
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
