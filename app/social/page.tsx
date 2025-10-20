"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Star,
  Clock,
  Award,
  Volume2,
  Eye,
  BookOpen,
  Zap,
  UserPlus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { StoryCard } from "@/components/StoryCard";
import { useIStoryToken } from "../hooks/useIStoryToken";
import { useLikeSystem } from "../hooks/useLikeSystem";
import { useStorybookNFT } from "../hooks/useStoryBookNFT";
import { useAccount, useSignMessage } from "wagmi";
import { parseEther } from "viem";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";

interface AuthorProfile {
  name: string;
  username: string;
  avatar: string;
  badges: string[];
  followers: number;
  isFollowing: boolean;
}

export interface StoryType {
  id: number;
  numeric_id: string;
  author_wallet: AuthorProfile;
  title: string;
  content: string;
  teaser?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  hasAudio: boolean;
  isLiked: boolean;
  mood: string;
  tags: string[];
  paywallAmount: number;
  isPaid?: boolean; // Matches optionality of StoryCardProps
}
export interface FeaturedWriterType {
  name: string;
  username: string;
  avatar: string;
  followers: number;
  stories: number;
  speciality: string;
}

const featuredWriters = [
  {
    name: "David Kim",
    username: "@davidk",
    avatar:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 2100,
    stories: 45,
    speciality: "Life Philosophy",
  },
  {
    name: "Anna Thompson",
    username: "@annat",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 1800,
    stories: 38,
    speciality: "Travel Adventures",
  },
  {
    name: "James Wilson",
    username: "@jamesw",
    avatar:
      "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
    followers: 1450,
    stories: 52,
    speciality: "Tech Stories",
  },
];
const moodColors = {
  peaceful: "bg-green-100 dark:bg-green-900 text-green-600",
  inspiring: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600",
  adventurous: "bg-blue-100 dark:bg-blue-900 text-blue-600",
};
export default function SocialPage() {
  const [stories, setStories] = useState<StoryType[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [unlockedStories, setUnlockedStories] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  // Hooks (top-level)
  const { address } = useAccount();
  const iStoryToken = useIStoryToken();
  const likeSystem = useLikeSystem();
  const storybookNFT = useStorybookNFT();
  // read client-side flag (must set NEXT_PUBLIC_DEV_BYPASS_SIG=true in .env.local)
  //   const DEV_BYPASS_CLIENT = process.env.NEXT_PUBLIC_DEV_BYPASS_SIG === "true";
  const supabase = useMemo(() => supabaseClient, []);

  // 🔹 Fetch data from Supabase (users, stories, etc.)
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        // Data returned here matches the new, correct StoryType structure
        const { data, error } = await supabase.from("stories").select("*");
        if (error) throw error;
        console.log("🧠 Supabase stories:", data);
        setStories(data as StoryType[]); // Explicitly cast for safety
      } catch (err) {
        console.error("Supabase fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupabaseData();
  }, [supabase]);

  const handleUnlock = async (storyId: string) => {
    if (!iStoryToken || !address) {
      toast.error("Wallet not connected");
      return;
    }

    const story = stories.find((s) => s.id === Number(storyId));
    if (!story) {
      toast.error("Story not found");
      return;
    }
    if (story.paywallAmount === 0) return;

    try {
      const storyNumericId = BigInt(story.numeric_id);

      // Call smart contract function
      await iStoryToken.write.payPaywall(
        story.author_wallet.username as `0x${string}`,
        story.paywallAmount,
        storyNumericId
      );

      // Optimistic UI update
      setUnlockedStories((prev) => new Set([...prev, Number(storyId)]));
      setStories((prev) =>
        prev.map((s) => (s.id === Number(storyId) ? { ...s, isPaid: true } : s))
      );

      toast.success(`Unlocked! Paid ${story.paywallAmount} $ISTORY`);

      // Optional: Refresh latest paywall state from contract
      if (storybookNFT) {
        const paywall = await storybookNFT.read.getPaywall(storyNumericId);
        setStories((prev) =>
          prev.map((s) =>
            s.id === Number(storyId)
              ? { ...s, paywallAmount: Number(paywall || 0n) }
              : s
          )
        );
      }

      // Optional: Sync unlock event to Supabase for tracking
      await fetch("/api/stories/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: story.id,
          wallet_address: address,
          paid: true,
          paywall_amount: story.paywallAmount,
        }),
      });
    } catch (error) {
      console.error("Unlock error:", error);
      toast.error("Unlock failed — please check balance or try again");
    }
  };

  const handleLike = async (storyId: string) => {
    if (!likeSystem || !address) {
      toast.error("Wallet not connected");
      return;
    }

    const story = stories.find((s) => s.id === Number(storyId));
    if (!story) {
      toast.error("Story not found");
      return;
    }

    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) =>
        s.id === Number(storyId)
          ? {
              ...s,
              isLiked: !s.isLiked,
              likes: s.isLiked ? s.likes - 1 : s.likes + 1,
            }
          : s
      )
    );

    try {
      const storyNumericId = BigInt(story.numeric_id);

      // On-chain like
      await likeSystem.write.likeStory(
        storyNumericId,
        address as `0x${string}`
      );

      toast.success("Story liked! +1 $STORY token earned");

      // Sync latest like count from contract
      const likes = await likeSystem.read.getLikes(storyNumericId);
      setStories((prev) =>
        prev.map((s) =>
          s.id === Number(storyId) ? { ...s, likes: Number(likes || 0n) } : s
        )
      );

      // Optional: Sync to Supabase for UI consistency
      await fetch("/api/stories/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: story.id,
          wallet_address: address,
          liked: true,
        }),
      });
    } catch (error) {
      console.error("Like error:", error);

      // Rollback optimistic update on failure
      setStories((prev) =>
        prev.map((s) =>
          s.id === Number(storyId)
            ? {
                ...s,
                isLiked: !s.isLiked,
                likes: s.isLiked ? s.likes + 1 : s.likes - 1,
              }
            : s
        )
      );

      toast.error("Like failed — check wallet or gas settings");
    }
  };

  const handleFollow = (authorUsername: string) => {
    setStories((prev) =>
      prev.map((story) => {
        if (story.author_wallet.username === authorUsername) {
          return {
            ...story,
            author_wallet: {
              ...story.author_wallet,
              isFollowing: !story.author_wallet.isFollowing,
              followers: story.author_wallet.isFollowing
                ? story.author_wallet.followers - 1
                : story.author_wallet.followers + 1,
            },
          };
        }
        return story;
      })
    );
    toast.success("Following status updated");
  };

  const handleShare = (storyId: number) => {
    toast.success("Story shared! +2 $STORY tokens earned");
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">Loading stories from database...</div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <Users className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Community Stories
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover inspiring stories from writers around the world
        </p>
      </div>
      {/* Stats Bar */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: "Stories Today",
                value: "156",
                icon: BookOpen,
                color: "text-purple-600",
              },
              {
                label: "Active Writers",
                value: "2.8K",
                icon: Users,
                color: "text-indigo-600",
              },
              {
                label: "Trending Tags",
                value: "#mindfulness",
                icon: TrendingUp,
                color: "text-emerald-600",
              },
              {
                label: "Your $ISTORY",
                value: iStoryToken?.balance
                  ? `${Number(iStoryToken.balance / BigInt(1e18)).toFixed(2)}`
                  : "0",
                icon: Star,
                color: "text-yellow-600",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center space-y-2">
                  <Icon className={`w-6 h-6 mx-auto ${stat.color}`} />
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Latest Stories</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            <TabsContent value="feed" className="space-y-6">
              {stories.map((story, index) => (
                <motion.div
                  key={story.numeric_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StoryCard
                    // Fix: story is now the raw story object, as expected by StoryCardProps
                    story={{
                      ...story,
                      isPaid: story.isPaid || unlockedStories.has(story.id),
                    }}
                    onFollow={handleFollow}
                    onShare={handleShare}
                    onLike={() => handleLike(story.numeric_id)}
                    onUnlock={() => handleUnlock(story.numeric_id)}
                  />
                </motion.div>
              ))}
            </TabsContent>
            {/* Trending & Following Tabs */}
            <TabsContent value="trending" className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-12 h-12 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Trending Stories
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Coming soon - discover the most popular stories of the day
              </p>
            </TabsContent>
            <TabsContent value="following" className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Following Feed
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Stories from writers you follow will appear here
              </p>
            </TabsContent>
          </Tabs>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Writers */}
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Featured Writers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredWriters.map((writer) => (
                <div
                  key={writer.username}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={writer.avatar} />
                      <AvatarFallback>
                        {writer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{writer.name}</div>
                      <div className="text-xs text-gray-500">
                        {writer.speciality}
                      </div>
                      <div className="text-xs text-gray-400">
                        {writer.stories} stories
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Trending Tags */}
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span>Trending Topics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "#mindfulness",
                  "#entrepreneurship",
                  "#travel",
                  "#wellness",
                  "#coding",
                  "#dreams",
                  "#nature",
                ].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Community Stats */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-lg">Community Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">45.2K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  $STORY Tokens Earned
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">12.5K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stories Shared
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">2.8K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Writers
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
