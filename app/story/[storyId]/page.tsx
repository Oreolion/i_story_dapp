"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { parseEther } from "viem";

// FIX: Go up 3 levels to reach project root
// [id] -> story -> app -> root
import { useApp } from "../../../components/Provider";
import { useAuth } from "../../../components/AuthProvider";

// FIX: Go up 3 levels to reach project root hooks
import { useIStoryToken } from "../../hooks/useIStoryToken";
// import { useLikeSystem } from "../../../hooks/useLikeSystem";
import { useStoryProtocol } from "../../hooks/useStoryProtocol";
import { useStoryNFT } from "../../hooks/useStoryNFT";

// FIX: Go up 2 levels to reach 'app' folder, then into 'utils'
// [id] -> story -> app -> utils
import { supabaseClient } from "../../utils/supabase/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import {
  Heart,
  Share2,
  Volume2,
  Calendar,
  User,
  Loader2,
  ArrowLeft,
  Sparkles,
  Lock,
  CheckCircle2,
  MessageCircle,
  Send,
  Edit,
  KeyRound,
} from "lucide-react";

// --- Types ---

interface AuthorProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  wallet_address: string | null;
  followers_count: number;
  badges: string[] | null;
}

interface StoryData {
  id: string;
  numeric_id: string;
  title: string;
  content: string;
  teaser?: string;
  created_at: string;
  likes: number;
  shares: number;
  has_audio: boolean;
  audio_url?: string;
  mood: string;
  tags: string[];
  paywall_amount: number;
  author: AuthorProfile;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  author: {
    name: string | null;
    avatar: string | null;
    wallet_address: string | null;
  };
}

const moodColors: { [key: string]: string } = {
  peaceful: "from-green-400 to-emerald-600",
  inspiring: "from-yellow-400 to-orange-500",
  adventurous: "from-blue-400 to-cyan-600",
  nostalgic: "from-purple-400 to-pink-600",
  thoughtful: "from-indigo-400 to-purple-600",
  exciting: "from-red-400 to-orange-600",
  neutral: "from-gray-400 to-slate-600",
  unknown: "from-gray-400 to-slate-600",
};

export default function StoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { storyId } = use(params);

  const router = useRouter();
  const { isConnected } = useApp();
  const { address } = useAccount();
  const authInfo = useAuth();

  const supabase = supabaseClient;

  // Blockchain Hooks
  const { allowance, approve, isPending: isApproving } = useIStoryToken();
  const {
    payPaywall,
    isPending: isPayingProtocol,
    hash: payHash,
  } = useStoryProtocol();
  const { mintBook, isPending: isMinting } = useStoryNFT();
  //   const likeSystem = useLikeSystem();

  // State
  const [story, setStory] = useState<StoryData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Actions State
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Inputs
  const [newComment, setNewComment] = useState("");
  const [tipAmount, setTipAmount] = useState(5);

  // Dialogs
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showPaywallDialog, setShowPaywallDialog] = useState(false);

  // --- 1. Fetch Data ---
  useEffect(() => {
    // Stop if requirements aren't met
    if (!supabase || !storyId) {
      // Only stop loading if storyId is definitely missing/undefined
      if (storyId === undefined) return;
      setIsLoading(false);
      return;
    }

    const fetchStoryAndComments = async () => {
      try {
        setIsLoading(true);

        // A. Fetch Story
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select(
            `
            id, numeric_id, title, content, teaser, created_at, likes, shares, has_audio, audio_url, mood, tags, paywall_amount,
            author:users!stories_author_wallet_fkey (
              id, name, username, avatar, wallet_address, followers_count, badges
            )
          `
          )
          .eq("id", storyId)
          .maybeSingle();

        if (storyError) throw storyError;

        if (storyData && storyData.author) {
          setStory({
            id: storyData.id,
            numeric_id: storyData.numeric_id,
            title: storyData.title,
            content: storyData.content,
            teaser: storyData.teaser,
            created_at: storyData.created_at,
            likes: storyData.likes || 0,
            shares: storyData.shares || 0,
            has_audio: storyData.has_audio || false,
            audio_url: storyData.audio_url,
            mood: storyData.mood || "neutral",
            tags: storyData.tags || [],
            paywall_amount: storyData.paywall_amount || 0,
            author: {
              id: storyData.author.id,
              name: storyData.author.name,
              username: storyData.author.username,
              avatar: storyData.author.avatar,
              wallet_address: storyData.author.wallet_address,
              followers_count: storyData.author.followers_count || 0,
              badges: storyData.author.badges || [],
            },
          });

          // Check if unlocked in DB
          if (authInfo?.id && storyData.paywall_amount > 0) {
            const { data: unlockData } = await supabase
              .from("unlocked_content")
              .select("id")
              .eq("user_id", authInfo.id)
              .eq("story_id", storyId)
              .maybeSingle();

            if (unlockData) setIsUnlocked(true);
          }
        } else {
          setStory(null);
        }

        // B. Fetch Comments
        const { data: commentsData } = await supabase
          .from("comments")
          .select(
            `
            id, content, created_at,
            author:users!comments_author_id_fkey (name, avatar, wallet_address)
          `
          )
          .eq("story_id", storyId)
          .order("created_at", { ascending: false });

        const formattedComments = (commentsData || []).map((c: any) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          author: {
            name: c.author?.name || "Anonymous",
            avatar: c.author?.avatar,
            wallet_address: c.author?.wallet_address,
          },
        }));

        setComments(formattedComments);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryAndComments();
  }, [supabase, storyId, authInfo?.id]);

  // --- 2. Payment Verification Listener ---
  useEffect(() => {
    if (payHash && !isSyncing) {
      const syncToDb = async () => {
        setIsSyncing(true);
        toast.loading("Verifying payment...", { id: "sync-toast" });
        try {
          const res = await fetch("/api/sync/verify-tx", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              txHash: payHash,
              userWallet: address,
            }),
          });

          if (!res.ok) throw new Error("Verification failed");

          setIsUnlocked(true);
          setShowPaywallDialog(false);
          toast.success("Story Unlocked!", { id: "sync-toast" });
        } catch (err) {
          console.error(err);
          toast.error("Payment confirmed but sync failed. Unlocked locally.", {
            id: "sync-toast",
          });
          setIsUnlocked(true);
        } finally {
          setIsSyncing(false);
        }
      };
      syncToDb();
    }
  }, [payHash, address]);

  // --- 3. Actions ---

  const handleUnlock = async () => {
    if (!story) return;
    const requiredAmount = parseEther(story.paywall_amount.toString());

    // Step 1: Approve if needed
    if (allowance < requiredAmount) {
      try {
        await approve(story.paywall_amount.toString());
        return;
      } catch (e) {
        return;
      }
    }

    // Step 2: Pay
    await payPaywall(
      story.author.wallet_address as string,
      story.paywall_amount,
      BigInt(story.numeric_id)
    );
  };

  const handleLike = async () => {
    if (!isConnected) return toast.error("Please connect your wallet");
    if (!story) return;

    try {
      setIsLiking(true);
      //   const numericIdBigInt = BigInt(story.numeric_id);
      //   const likerAddress = address as `0x${string}`;

      //   await likeSystem.write.likeStory(numericIdBigInt, likerAddress);

      setIsLiked(!isLiked);
      setStory((prev) =>
        prev
          ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 }
          : null
      );
      toast.success(isLiked ? "Story unliked" : "Story liked!");
    } catch (error: any) {
      console.error("Like error:", error);
      toast.error("Failed to like story");
    } finally {
      setIsLiking(false);
    }
  };

  const handleTip = async () => {
    if (!isConnected) return toast.error("Please connect your wallet");
    if (!iStoryToken || !story) return;

    try {
      setIsTipping(true);
      await iStoryToken.write.tipCreator(
        story.author.wallet_address as `0x${string}`,
        tipAmount,
        BigInt(story.numeric_id)
      );
      toast.success(`Tipped ${tipAmount} $ISTORY!`);
      setShowTipDialog(false);
    } catch (error: any) {
      console.error("Tip error:", error);
      toast.error("Failed to send tip");
    } finally {
      setIsTipping(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!authInfo?.id) return toast.error("Please sign in to comment");
    if (!supabase) return;

    setIsPostingComment(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          story_id: storyId,
          author_id: authInfo.id,
          author_wallet: authInfo.wallet_address,
          content: newComment,
        })
        .select(
          `
            id, content, created_at,
            author:users!comments_author_id_fkey (name, avatar, wallet_address)
        `
        )
        .single();

      if (error) throw error;

      const newCommentObj: CommentData = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        author: {
          name: data.author?.name || "Me",
          avatar: data.author?.avatar,
          wallet_address: data.author?.wallet_address,
        },
      };

      setComments((prev) => [newCommentObj, ...prev]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleMintStory = async () => {
    if (!isConnected) return toast.error("Connect wallet");
    if (!story?.numeric_id) return;

    const { data } = await supabase
      ?.from("stories")
      .select("ipfs_hash")
      .eq("id", story.id)
      .single();

    if (!data?.ipfs_hash)
      return toast.error("This story hasn't been pinned to IPFS yet.");

    const tokenURI = `ipfs://${data.ipfs_hash}`;
    await mintBook(tokenURI);
  };

  // --- Helpers ---
  const isAuthor =
    authInfo?.wallet_address?.toLowerCase() ===
    story?.author.wallet_address?.toLowerCase();
  const isPaywalled =
    (story?.paywall_amount || 0) > 0 && !isUnlocked && !isAuthor;
  const gradientClass = story
    ? moodColors[story.mood] || moodColors.neutral
    : "";

  // Button State Logic
  const getUnlockButtonState = () => {
    if (isApproving)
      return {
        text: "Approving Tokens...",
        icon: <Loader2 className="animate-spin w-4 h-4 mr-2" />,
        disabled: true,
      };
    if (isPayingProtocol)
      return {
        text: "Processing Payment...",
        icon: <Loader2 className="animate-spin w-4 h-4 mr-2" />,
        disabled: true,
      };
    if (isSyncing)
      return {
        text: "Verifying...",
        icon: <Loader2 className="animate-spin w-4 h-4 mr-2" />,
        disabled: true,
      };

    const requiredAmount = story
      ? parseEther(story.paywall_amount.toString())
      : BigInt(0);
    if (allowance < requiredAmount) {
      return {
        text: "Approve $ISTORY",
        icon: <KeyRound className="w-4 h-4 mr-2" />,
        disabled: false,
      };
    }
    return {
      text: "Confirm Payment",
      icon: <CheckCircle2 className="w-4 h-4 mr-2" />,
      disabled: false,
    };
  };
  const btnState = getUnlockButtonState();

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Story Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/social">
              <Button className="w-full">Back to Social Feed</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {isAuthor && (
          <Button
            // Disable editing if it's already on IPFS (Minted/Pinned)
            disabled={!!story.ipfs_hash}
            className="bg-indigo-600 ..."
            onClick={() => router.push(`/record?id=${story.id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            {story.ipfs_hash ? "Locked (Minted)" : "Edit Story"}
          </Button>
        )}
      </div>

      {/* Main Story Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-xl overflow-hidden">
          {/* Dynamic Header */}
          <div
            className={`h-48 bg-gradient-to-r ${gradientClass} relative overflow-hidden flex items-end p-6`}
          >
            <div className="relative z-10 text-white w-full">
              <div className="flex justify-between items-end">
                <div>
                  <Badge className="mb-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                    {story.mood.toUpperCase()}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold shadow-sm">
                    {story.title}
                  </h1>
                </div>
                <div className="text-right text-white/90 text-sm font-medium hidden md:block">
                  <div className="flex items-center justify-end gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(story.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <CardContent className="pt-8">
            {/* Author & Meta Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12 border-2 border-purple-100">
                  <AvatarImage src={story.author.avatar || undefined} />
                  <AvatarFallback>
                    {story.author.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {story.author.name || "Anonymous"}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">
                      @{story.author.username || "user"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 mr-2" />
                    <span>{story.author.followers_count} followers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center text-sm text-gray-500 gap-4 mr-2">
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" /> {story.likes}
                  </span>
                  <span className="flex items-center">
                    <Share2 className="w-4 h-4 mr-1" /> {story.shares}
                  </span>
                </div>
                {!isAuthor && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast("Follow feature coming soon")}
                  >
                    Follow
                  </Button>
                )}
              </div>
            </div>

            {/* Paywall Content Blocker */}
            {isPaywalled ? (
              <div className="relative p-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-purple-300 text-center space-y-4">
                <Lock className="w-12 h-12 mx-auto text-purple-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Premium Story
                </h3>
                <p className="text-gray-500">
                  Support the author to read the full story.
                </p>
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg hover:scale-105 transition-transform"
                    onClick={() => setShowPaywallDialog(true)}
                  >
                    Unlock for {story.paywall_amount} $ISTORY
                  </Button>
                </div>
                <div className="absolute inset-0 -z-10 opacity-10 blur-sm p-8 select-none overflow-hidden">
                  {story.teaser || "This content is hidden behind a paywall..."}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {story.has_audio && story.audio_url && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <audio
                      controls
                      src={story.audio_url}
                      className="w-full h-10"
                    />
                  </div>
                )}
                <article className="prose dark:prose-invert max-w-none text-lg leading-8 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {story.content}
                </article>
                <div className="flex flex-wrap gap-2 pt-4">
                  {story.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  className={
                    isLiked ? "bg-red-500 text-white hover:bg-red-600" : ""
                  }
                  onClick={handleLike}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`}
                  />{" "}
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTipDialog(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> Tip
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMintStory}
                  disabled={isMinting}
                >
                  <Sparkles className="w-4 h-4 mr-2" />{" "}
                  {isMinting ? "Minting..." : "Mint NFT"}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  navigator.share?.({
                    title: story.title,
                    url: window.location.href,
                  })
                }
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" /> Comments ({comments.length})
        </h3>
        <Card className="p-4 bg-gray-50 dark:bg-gray-900/50 border-dashed">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={authInfo?.avatar || undefined} />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] bg-white dark:bg-black"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handlePostComment}
                  disabled={isPostingComment || !newComment.trim()}
                  className="bg-indigo-600"
                >
                  {isPostingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}{" "}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          {comments.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={c.author.avatar || undefined} />
                  <AvatarFallback>{c.author.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">
                    {c.author.name || "Anonymous"}{" "}
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {c.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Paywall Dialog */}
      <Dialog open={showPaywallDialog} onOpenChange={setShowPaywallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Premium Story</DialogTitle>
            <DialogDescription>
              Confirm payment to access the full content.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center space-y-2">
            <Lock className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
            <p>Price to Unlock</p>
            <p className="text-3xl font-bold text-emerald-600">
              {story?.paywall_amount} $ISTORY
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUnlock}
              disabled={btnState.disabled}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {btnState.icon} {btnState.text}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tip Dialog */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Tip</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>How much do you want to tip?</p>
            <Input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleTip}>Send {tipAmount} $ISTORY</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}