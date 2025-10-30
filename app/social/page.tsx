"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/components/Provider"; // <-- USE useApp
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {

  TrendingUp,
  Users,
  Star,
//   Clock,
//   Award,
//   Volume2,
//   Eye,
  BookOpen,
  Zap,
//   UserPlus,
  Loader2, // Added Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { StoryCard, StoryDataType } from "@/components/StoryCard";
// Assuming these hooks work correctly and likely use useAccount internally
import { useIStoryToken } from "../hooks/useIStoryToken";
import { useLikeSystem } from "../hooks/useLikeSystem";
// import { useStorybookNFT } from "../hooks/useStoryBookNFT"; // Keep if needed
// Removed useAccount import as useApp provides address via `user` if needed,
// but relying on internal hook usage is better.
// Removed useSignMessage as it's not used here.
// Removed parseEther as it's not used here.
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";

// --- Interfaces (Ensure these match your actual data structures) ---
interface AuthorProfile {
  id?: string; // Optional: Supabase ID
  name: string | null;
  username: string | null; // Used as identifier in some contract calls? Be careful.
  avatar: string | null;
  wallet_address: string | null;
  badges: string[] | null;
  followers: number;
  isFollowing: boolean; // Managed client-side
}
// Ensure this matches or extends StoryDataType from StoryCard
// export interface StoryType extends StoryDataType {
// Add any fields specific to the SocialPage state if not in StoryDataType
// }

export interface FeaturedWriterType {
  name: string;
  username: string;
  avatar: string;
  followers: number;
  stories: number;
  speciality: string;
}

const featuredWriters: FeaturedWriterType[] = [
  {
    name: "David Kim",
    username: "@davidk",
    avatar: "...",
    followers: 2100,
    stories: 45,
    speciality: "Life Philosophy",
  },
  {
    name: "Anna Thompson",
    username: "@annat",
    avatar: "...",
    followers: 1800,
    stories: 38,
    speciality: "Travel Adventures",
  },
  {
    name: "James Wilson",
    username: "@jamesw",
    avatar: "...",
    followers: 1450,
    stories: 52,
    speciality: "Tech Stories",
  },
];
// Define moodColors with type safety
const moodColors: { [key: string]: string } = {
  peaceful: "bg-green-100 dark:bg-green-900 text-green-600",
  inspiring: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600",
  adventurous: "bg-blue-100 dark:bg-blue-900 text-blue-600",
  // Add other moods if needed
};

export default function SocialPage() {
  const { user, isConnected } = useApp(); // <-- Use useApp for connection status & basic user info
  const [stories, setStories] = useState<StoryDataType[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [unlockedStories, setUnlockedStories] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Blockchain hooks (assuming they use useAccount internally for address)
  const iStoryToken = useIStoryToken();
  const likeSystem = useLikeSystem();
  // const storybookNFT = useStorybookNFT(); // Uncomment if used
  const supabase = useMemo(() => supabaseClient, []);

  // Fetch community stories from Supabase
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        // Query includes timestamp alias and joins users table selecting necessary fields
        const { data, error } = await supabase
          .from("stories")
          .select(
            `
            *,
            timestamp:created_at,
            author_wallet:users (id, name, username, avatar, wallet_address, followers_count, badges)
          `
          ) // **Select followers_count**
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("[SOCIAL PAGE LOG] Fetched stories:", data);

        const validStories =
          (data?.filter((s) => s.author_wallet) as any[]) || [];

        // Map data to StoryType, ensuring AuthorProfile matches the required structure
        const storiesWithDefaults: StoryDataType[] = validStories.map((s) => ({
          id: s.id,
          numeric_id: s.numeric_id ?? String(s.id),
          author_wallet: {
            id: s.author_wallet.id,
            name: s.author_wallet.name,
            username: s.author_wallet.username,
            avatar: s.author_wallet.avatar,
            wallet_address: s.author_wallet.wallet_address, // Map wallet_address
            // **FIXED:** Map followers_count to followers
            followers: s.author_wallet.followers_count ?? 0,
            badges: s.author_wallet.badges ?? [],
            isFollowing: false, // Default client-side state
          } as AuthorProfile, // Assert type after mapping
          title: s.title ?? "Untitled Story",
          content: s.content ?? "",
          timestamp: s.timestamp, // Use the alias
          likes: s.likes ?? 0,
          comments: s.comments ?? 0,
          shares: s.shares ?? 0,
          hasAudio: s.hasAudio ?? false,
          isLiked: false, // Default client-side state
          mood: s.mood ?? "unknown",
          tags: s.tags ?? [],
          paywallAmount: s.paywallAmount ?? 0,
          teaser: s.teaser,
          isPaid: false, // Default client-side state
        }));

        setStories(storiesWithDefaults);
      } catch (err: any) {
        console.error("[SOCIAL PAGE LOG] Supabase fetch error:", err);
        toast.error(`Failed to load stories: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupabaseData();
  }, [supabase]); // Run only when supabase client instance changes (effectively once)

  // --- Event Handlers ---

  const handleUnlock = async (storyNumericId: string) => {
    // Use isConnected from useApp as the guard
    if (!isConnected || !user?.address || !iStoryToken) {
      return toast.error("Please connect your wallet to unlock stories.");
    }
    const story = stories.find((s) => s.numeric_id === storyNumericId);
    if (!story || !story.author_wallet)
      return toast.error("Story or author wallet not found");
    if (story.paywallAmount <= 0) return; // Can't unlock free stories

    console.log(
      `[SOCIAL PAGE LOG] Attempting unlock for story ${storyNumericId} by user ${user.address}`
    );
    try {
      const numericIdBigInt = BigInt(story.numeric_id);
      const authorAddress = story.author_wallet.wallet_address as `0x${string}`; // Use the correct field
      // Assuming payPaywall uses the internally connected account from useIStoryToken hook
      await iStoryToken.write.payPaywall(
        authorAddress,
        story.paywallAmount,
        numericIdBigInt
      );

      setUnlockedStories((prev) => new Set(prev).add(story.id)); // Add Supabase ID to Set
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, isPaid: true } : s))
      );
      toast.success(`Unlocked! Paid ${story.paywallAmount} $ISTORY`);
      // Optional: Sync unlock to DB or re-fetch contract state
    } catch (error: any) {
      console.error("[SOCIAL PAGE LOG] Unlock error:", error);
      const errorMessage =
        error.shortMessage || error.message || "Check console/wallet.";
      toast.error(`Unlock failed: ${errorMessage}`);
    }
  };

  const handleLike = async (storyNumericId: string) => {
    // Use isConnected from useApp as the guard
    if (!isConnected || !user?.address || !likeSystem) {
      return toast.error("Please connect your wallet to like stories.");
    }
    const storyIndex = stories.findIndex(
      (s) => s.numeric_id === storyNumericId
    );
    if (storyIndex === -1) return toast.error("Story not found");

    const story = stories[storyIndex];
    const numericIdBigInt = BigInt(story.numeric_id);
    const isCurrentlyLiked = story.isLiked;
    const currentLikes = story.likes; // Store original likes for rollback

    console.log(
      `[SOCIAL PAGE LOG] Attempting ${
        isCurrentlyLiked ? "unlike" : "like"
      } for story ${storyNumericId} by user ${user.address}`
    );

    // Optimistic UI
    setStories((prev) =>
      prev.map((s, index) =>
        index === storyIndex
          ? {
              ...s,
              isLiked: !isCurrentlyLiked,
              likes: isCurrentlyLiked ? s.likes - 1 : s.likes + 1,
            }
          : s
      )
    );

    try {
      const likerAddress = user.address as `0x${string}`; // Get address from useApp
      // Assuming likeStory uses the internally connected account from useLikeSystem hook
      // If your contract needs the user address explicitly:
      // await likeSystem.write.likeStory(numericIdBigInt, user.address as `0x${string}`);
      await likeSystem.write.likeStory(numericIdBigInt, likerAddress); // Assuming hook handles address

      toast.success(
        isCurrentlyLiked ? "Story unliked" : "Story liked! +1 $ISTORY"
      );

      // Re-fetch accurate like count from contract after success
      const likes = await likeSystem.read.getLikes(numericIdBigInt);
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id ? { ...s, likes: Number(likes || 0n) } : s
        )
      );
      // Optional: Sync like status to Supabase DB for persistence across sessions
    } catch (error: any) {
      console.error("[SOCIAL PAGE LOG] Like error:", error);
      // Rollback UI on failure
      setStories((prev) =>
        prev.map(
          (s, index) =>
            index === storyIndex
              ? { ...s, isLiked: isCurrentlyLiked, likes: currentLikes }
              : s // Revert fully
        )
      );
      const errorMessage =
        error.shortMessage || error.message || "Check console/wallet.";
      toast.error(`Like action failed: ${errorMessage}`);
    }
  };

  const handleFollow = (authorUsername: string) => {
    // Placeholder: Implement actual follow logic using isConnected and user.address if needed
    if (!isConnected) return toast.error("Connect wallet to follow.");
    toast(`Follow action for ${authorUsername} (pending implementation)`);
  };

  const handleShare = (storyId: number) => {
    // Placeholder: Implement actual share logic
    toast(`Share action for story ID ${storyId} (pending implementation)`);
  };

  // Loading State UI
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
        <h2 className="text-2xl font-semibold">Loading Community Stories...</h2>
      </div>
    );
  }

  // Main Render
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          {" "}
          <Users className="w-8 h-8 text-white" />{" "}
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Community Stories
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover inspiring stories from writers
        </p>
      </div>

      {/* Stats Bar (Uses iStoryToken hook for user's actual balance) */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Other stats remain the same */}
            <div className="text-center space-y-2">
              {" "}
              <BookOpen className="w-6 h-6 mx-auto text-purple-600" />{" "}
              <div className="text-xl font-bold ...">156</div>{" "}
              <div className="text-sm ...">Stories Today</div>{" "}
            </div>
            <div className="text-center space-y-2">
              {" "}
              <Users className="w-6 h-6 mx-auto text-indigo-600" />{" "}
              <div className="text-xl font-bold ...">2.8K</div>{" "}
              <div className="text-sm ...">Active Writers</div>{" "}
            </div>
            <div className="text-center space-y-2">
              {" "}
              <TrendingUp className="w-6 h-6 mx-auto text-emerald-600" />{" "}
              <div className="text-xl font-bold ...">#mindful</div>{" "}
              <div className="text-sm ...">Trending</div>{" "}
            </div>
            {/* Your $ISTORY balance */}
            <div className="text-center space-y-2">
              <Star className="w-6 h-6 mx-auto text-yellow-600" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {/* Display balance from hook, check isConnected from useApp */}
                {isConnected && iStoryToken?.balance !== undefined
                  ? `${Number(iStoryToken.balance / BigInt(1e18)).toFixed(2)}`
                  : "0"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your $ISTORY
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            <TabsContent value="feed" className="space-y-6">
              {stories.length > 0 ? (
                stories.map((story, index) => (
                  <motion.div
                    key={story.numeric_id || story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Pass the correctly typed story object */}
                    <StoryCard
                      story={{
                        ...story,
                        // Ensure isPaid reflects unlock status from state
                        isPaid: story.isPaid || unlockedStories.has(story.id),
                      }}
                      // Pass handlers
                      onFollow={() =>
                        handleFollow(story.author_wallet?.username || "unknown")
                      }
                      onShare={() => handleShare(story.id)}
                      onLike={() => handleLike(story.numeric_id)}
                      onUnlock={() => handleUnlock(story.numeric_id)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">No stories found</h3>
                  <p>Start the conversation!</p>
                </div>
              )}
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
