"use client";

import { useState, useEffect } from "react";
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
import { useStorybookNFT } from "../hooks/useStorybookNFT";
import { useAccount } from "wagmi";
import { parseEther } from "viem";

const mockStories = [
  {
    id: 1,
    author: {
      name: "Sarah Chen",
      username: "0x123...abc", // Mock wallet (replace with real in prod)
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Top Writer", "Community Star"],
      followers: 1250,
      isFollowing: false,
    },
    title: "The Art of Morning Rituals",
    content:
      "There's something magical about the quiet hours before the world wakes up. My morning ritual has become sacred to me - it starts with gratitude, moves through gentle movement, and ends with setting intentions for the day ahead. This practice has transformed not just my mornings, but my entire approach to life...",
    timestamp: "2 hours ago",
    likes: 89, // Will be overwritten by on-chain if available
    comments: 24,
    shares: 12,
    hasAudio: true,
    isLiked: false,
    mood: "peaceful",
    tags: ["wellness", "morning", "mindfulness"],
    paywallAmount: 0, // Free; fetched from NFT if on-chain
    isPaid: true, // N/A
  },
  {
    id: 2,
    author: {
      name: "Marcus Rodriguez",
      username: "0x456...def",
      avatar:
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Storyteller", "Early Adopter"],
      followers: 890,
      isFollowing: true,
    },
    title: "Building Dreams in Code",
    content:
      "Ten years ago, I wrote my first line of code on a borrowed laptop in a coffee shop. Today, I'm launching my third startup. The journey hasn't been linear - there were failures, sleepless nights, and moments of doubt. But every setback taught me something valuable about resilience, creativity, and the power of never giving up on your dreams...",
    timestamp: "5 hours ago",
    likes: 156, // Will be overwritten
    comments: 43,
    shares: 28,
    hasAudio: false,
    isLiked: true,
    mood: "inspiring",
    tags: ["entrepreneurship", "coding", "dreams"],
    paywallAmount: 10, // Fetched from NFT
    isPaid: false,
    teaser:
      "Unlock the full story of my startup journey—exclusive insights on resilience and code that changed my life.",
  },
  {
    id: 3,
    author: {
      name: "Elena Vasquez",
      username: "0x789...ghi",
      avatar:
        "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      badges: ["Travel Stories"],
      followers: 654,
      isFollowing: false,
    },
    title: "Letters from Patagonia",
    content:
      "The wind here carries stories from across continents. I'm sitting by a glacial lake, writing by candlelight in my tent, and I've never felt more connected to the natural world. Three weeks into this solo trek through Patagonia, and every day brings new lessons about solitude, strength, and the incredible beauty that exists when we step away from our digital lives...",
    timestamp: "1 day ago",
    likes: 203, // Will be overwritten
    comments: 67,
    shares: 45,
    hasAudio: true,
    isLiked: false,
    mood: "adventurous",
    tags: ["travel", "nature", "solitude"],
    paywallAmount: 0, // Fetched from NFT
  },
];

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
  const [stories, setStories] = useState(mockStories);
  const [activeTab, setActiveTab] = useState("feed");
  const [unlockedStories, setUnlockedStories] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [useOnChainData, setUseOnChainData] = useState(false); // Toggle for on-chain

  // Hooks (top-level)
  const { address } = useAccount();
  const iStoryToken = useIStoryToken();
  const likeSystem = useLikeSystem();
  const storybookNFT = useStorybookNFT();

  // Fetch only when toggled
  useEffect(() => {
    if (!useOnChainData) {
      setStories(mockStories); // Reset to mocks
      setIsLoading(false);
      return;
    }

    const fetchOnChainData = async () => {
      if (!likeSystem || !storybookNFT || !address) {
        console.log("Hooks or wallet not ready—staying offline");
        setUseOnChainData(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const updatedStories = await Promise.all(
          stories.map(async (story) => {
            try {
              const likes = await likeSystem.read.getLikes(BigInt(story.id));
              const paywall = await storybookNFT.read.getPaywall(
                BigInt(story.id)
              );
              return {
                ...story,
                likes: Number(likes || 0n), // Fallback to 0 if no data
                paywallAmount: Number(paywall || 0n),
              };
            } catch (storyError) {
              console.warn(
                `No on-chain data for story ${story.id} (using mock):`,
                storyError
              );
              return story; // Per-story mock fallback
            }
          })
        );
        setStories(updatedStories);
        toast.success("Loaded from blockchain (some may use mocks)");
      } catch (error) {
        console.error("On-chain fetch failed:", error);
        toast.error("Blockchain load failed—switched to offline mode");
        setUseOnChainData(false); // Auto-toggle off
        setStories(mockStories); // Full mock fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnChainData();
  }, [useOnChainData, likeSystem, storybookNFT, address]);

  const handleLike = async (storyId: number) => {
    if (!likeSystem || !address) {
      toast.error("Wallet not connected");
      return;
    }

    // Optimistic update (works offline too)
    setStories((prev) =>
      prev.map((story) => {
        if (story.id === storyId) {
          return {
            ...story,
            isLiked: !story.isLiked,
            likes: story.isLiked ? story.likes - 1 : story.likes + 1,
          };
        }
        return story;
      })
    );

    try {
      await likeSystem.write.likeStory(
        BigInt(storyId),
        address as `0x${string}`
      );
      toast.success("Story liked! +1 $STORY token earned");
      // Refetch if on-chain mode
      if (useOnChainData) {
        const likes = await likeSystem.read.getLikes(BigInt(storyId));
        setStories((prev) =>
          prev.map((story) =>
            story.id === storyId
              ? { ...story, likes: Number(likes || 0n) }
              : story
          )
        );
      }
    } catch (error) {
      // Revert optimistic
      setStories((prev) =>
        prev.map((story) => {
          if (story.id === storyId) {
            return {
              ...story,
              isLiked: !story.isLiked,
              likes: story.isLiked ? story.likes + 1 : story.likes - 1,
            };
          }
          return story;
        })
      );
      toast.error("Like failed—check wallet");
      console.error("Like error:", error);
    }
  };

  const handleFollow = (authorUsername: string) => {
    setStories((prev) =>
      prev.map((story) => {
        if (story.author.username === authorUsername) {
          return {
            ...story,
            author: {
              ...story.author,
              isFollowing: !story.author.isFollowing,
              followers: story.author.isFollowing
                ? story.author.followers - 1
                : story.author.followers + 1,
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

  const handleUnlock = async (storyId: number) => {
    if (!iStoryToken || !address) {
      toast.error("Wallet not connected");
      return;
    }

    const story = stories.find((s) => s.id === storyId);
    if (!story || story.paywallAmount === 0) return;

    try {
      await iStoryToken.write.payPaywall(
        story.author.username as `0x${string}`,
        story.paywallAmount,
        BigInt(storyId)
      );
      setUnlockedStories((prev) => new Set([...prev, storyId]));
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, isPaid: true } : s))
      );
      toast.success(`Unlocked! Paid ${story.paywallAmount} $ISTORY`);
      // Refetch if on-chain
      if (useOnChainData && storybookNFT) {
        const paywall = await storybookNFT.read.getPaywall(BigInt(storyId));
        setStories((prev) =>
          prev.map((s) =>
            s.id === storyId
              ? { ...s, paywallAmount: Number(paywall || 0n) }
              : s
          )
        );
      }
    } catch (error) {
      toast.error("Unlock failed—insufficient tokens?");
      console.error("Unlock error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">Loading stories from blockchain...</div>
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

      {/* Toggle Button */}
      <div className="text-right">
        <Button
          variant="outline"
          onClick={() => setUseOnChainData(!useOnChainData)}
          disabled={isLoading}
        >
          {useOnChainData ? "Switch to Offline" : "Load from Chain"}
        </Button>
      </div>

      {/* Stats Bar - With real token balance */}
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

      {/* Main Content - Unchanged except StoryCard props */}
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
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StoryCard
                    story={{
                      ...story,
                      isPaid: story.isPaid || unlockedStories.has(story.id),
                    }}
                    onLike={handleLike}
                    onFollow={handleFollow}
                    onShare={handleShare}
                    onUnlock={handleUnlock}
                  />
                </motion.div>
              ))}
            </TabsContent>

            {/* Trending & Following Tabs - Unchanged */}
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

        {/* Sidebar - Unchanged */}
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
