"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import iStoryTokenABI from "@/lib/abis/iStoryToken.json";
import { parseEther } from "viem";
import Image from "next/image";
import { Clock, Heart, MessageCircle, Share2 } from "lucide-react";

// The author_walletProfile and StoryType interfaces should be imported from a central file
// (like StoryFetcher.tsx or a types file), but for a single-file context,
// they are defined here for clarity and consistency with the data structure.

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

export interface StoryDataType {
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
  isPaid?: boolean;
}

interface StoryCardProps {
  story: StoryDataType;
  onLike?: (id: number) => void;
  onFollow?: (username: string) => void;
  onShare?: (id: number) => void;
  onUnlock?: (id: number) => void;
}

const ISTORY_TOKEN_ADDRESS = "0xYouriStoryTokenAddress"; // Update after deploy
const DEFAULT_AVATAR = "https://placehold.co/48x48/6366f1/ffffff?text=U"; // Using a simple placeholder URL

export function StoryCard({
  story,
  onLike,
  onFollow,
  onShare,
  onUnlock,
}: StoryCardProps) {
  const [tipAmount, setTipAmount] = useState(5);
  const [isPaying, setIsPaying] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const { writeContract, data: tipHash } = useWriteContract();
  const { writeContract: payContract, data: payHash } = useWriteContract();

  useWaitForTransactionReceipt({
    hash: tipHash || payHash,
    onSuccess: () => {
      toast.success("Transaction confirmed!");
      setIsTipping(false);
      setIsPaying(false);
      if (payHash) onUnlock?.(story.id);
    },
  });

  const handleTip = () => {
    setIsTipping(true);
    writeContract({
      address: ISTORY_TOKEN_ADDRESS as `0x${string}`,
      abi: iStoryTokenABI.abi,
      functionName: "tipCreator",
      args: [
        story.author_wallet.username as `0x${string}`,
        parseEther(tipAmount.toString()),
        BigInt(story.id),
      ],
    });
  };

  const handlePaywall = () => {
    if (story.paywallAmount === 0) return;
    setIsPaying(true);
    payContract({
      address: ISTORY_TOKEN_ADDRESS as `0x${string}`,
      abi: iStoryTokenABI.abi,
      functionName: "payPaywall",
      args: [
        story.author_wallet.username as `0x${string}`,
        parseEther(story.paywallAmount.toString()),
        BigInt(story.id),
      ],
    });
  };

  const isLocked = story.paywallAmount > 0 && !story.isPaid;

  return (
    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        {/* author_wallet Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="w-12 h-12">
              {/* Ensure image src exists, falling back to DEFAULT_AVATAR */}
              <Image
                src={story.author_wallet?.avatar || DEFAULT_AVATAR}
                alt={story.author_wallet?.name || "avatar"}
                height={48}
                width={48}
                unoptimized
              />
              <AvatarFallback>
                {(story.author_wallet?.name || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {story.author_wallet?.name}
                </span>
                <span className="text-sm text-gray-500">
                  @{story.author_wallet?.username}
                </span>
                <div className="flex space-x-1">
                  {story.author_wallet?.badges?.map((badge) => (
                    <Badge key={badge}>{badge}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {story.timestamp}
                </div>
                <div>{story.author_wallet?.followers} followers</div>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={story.author_wallet?.isFollowing ? "secondary" : "default"}
            onClick={() => onFollow?.(story.author_wallet?.username)}
          >
            {story.author_wallet?.isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {story.title}
        </h3>
        {isLocked ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {story.teaser || "🔒 Premium content locked behind paywall"}
            </p>
            <Button
              onClick={handlePaywall}
              disabled={isPaying}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isPaying
                ? "Paying..."
                : `Pay ${story.paywallAmount} $ISTORY to Unlock`}
            </Button>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {story.content}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {story.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onLike?.(story.id)}
              className={story.isLiked ? "text-red-500" : ""}
            >
              <Heart
                className={`w-4 h-4 mr-1 ${
                  story.isLiked ? "fill-current" : ""
                }`}
              />
              {story.likes}
            </Button>
            <Button size="sm" variant="ghost">
              <MessageCircle className="w-4 h-4 mr-1" />
              {story.comments}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShare?.(story.id)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              {story.shares}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTip}
              disabled={isTipping}
            >
              {isTipping ? "Tipping..." : `Tip ${tipAmount} $ISTORY`}
            </Button>
            <input
              title="tiprange"
              type="range"
              min="1"
              max="50"
              value={tipAmount}
              onChange={(e) => setTipAmount(Number(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
