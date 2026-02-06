"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import iStoryTokenABI from "@/lib/abis/iStoryToken.json";
import { parseEther } from "viem";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Calendar, Globe, Lock, Star, Headphones } from "lucide-react";
import { StoryDataType, EmotionalTone } from "@/app/types";

interface StoryCardProps {
  story: StoryDataType;
  onLike?: (id: number) => void;
  onFollow?: (username: string) => void;
  onShare?: (id: number) => void;
  onUnlock?: (id: number) => void;
  variant?: 'default' | 'compact' | 'featured';
}

const ISTORY_TOKEN_ADDRESS = "0xYouriStoryTokenAddress";
const DEFAULT_AVATAR = "https://placehold.co/48x48/6366f1/ffffff?text=U";

// Map emotional tone to CSS class for left border color
const getToneClass = (tone?: EmotionalTone | string): string => {
  const toneMap: Record<string, string> = {
    reflective: 'card-tone-reflective',
    joyful: 'card-tone-joyful',
    anxious: 'card-tone-anxious',
    hopeful: 'card-tone-hopeful',
    melancholic: 'card-tone-melancholic',
    grateful: 'card-tone-grateful',
    frustrated: 'card-tone-frustrated',
    peaceful: 'card-tone-peaceful',
    excited: 'card-tone-excited',
    uncertain: 'card-tone-uncertain',
    neutral: 'card-tone-neutral',
  };
  return tone ? toneMap[tone] || '' : '';
};

export function StoryCard({
  story,
  onLike,
  onFollow,
  onShare,
  onUnlock,
  variant = 'default',
}: StoryCardProps) {
  const [tipAmount, setTipAmount] = useState(5);
  const [isPaying, setIsPaying] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const { writeContract, data: tipHash } = useWriteContract();
  const { writeContract: payContract, data: payHash } = useWriteContract();

  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: tipHash || payHash,
  });

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess) {
      toast.success("Transaction confirmed!");
      setIsTipping(false);
      setIsPaying(false);
      if (payHash) onUnlock?.(story.id);
    }
  }, [isTxSuccess, payHash, onUnlock, story.id]);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isLocked = story.paywallAmount > 0 && !story.isPaid;
  const metadata = (story as any).metadata;
  const emotionalTone = metadata?.emotional_tone;
  const isCanonical = metadata?.is_canonical;
  const hasAudio = (story as any).has_audio || story.hasAudio;

  // Build card classes based on story properties
  const cardClasses = [
    'rounded-xl overflow-hidden transition-all duration-200',
    emotionalTone ? `card-tone ${getToneClass(emotionalTone)}` : 'card-elevated',
    isCanonical ? 'card-canonical ring-1 ring-[hsl(var(--story-500)/0.3)]' : '',
    'hover-shadow-subtle',
  ].filter(Boolean).join(' ');

  // Compact variant for library/grid views
  if (variant === 'compact') {
    return (
      <Card className={cardClasses}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2">
              {story.title}
            </h3>
            {isCanonical && (
              <Star className="w-4 h-4 text-[hsl(var(--story-500))] flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {isLocked ? (story.teaser || "Premium content") : story.content}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {(story as any).story_date ? formatDate((story as any).story_date) : story.timestamp}
            </div>
            <div className="flex items-center gap-3">
              {hasAudio && <Headphones className="w-3 h-3 text-[hsl(var(--memory-500))]" />}
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {story.likes}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default full card
  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-3">
        {/* Author Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="w-11 h-11">
              <Image
                src={story.author_wallet?.avatar || DEFAULT_AVATAR}
                alt={story.author_wallet?.name || "avatar"}
                height={44}
                width={44}
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
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground">
                  {story.author_wallet?.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  @{story.author_wallet?.username}
                </span>
                {story.author_wallet?.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="badge-subtle text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center" title="Date of Memory">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {(story as any).story_date ? formatDate((story as any).story_date) : story.timestamp}
                </div>

                <div className="flex items-center" title={(story as any).is_public ? "Public" : "Private"}>
                  {(story as any).is_public ? (
                    <>
                      <Globe className="w-3.5 h-3.5 mr-1 text-[hsl(var(--growth-500))]" />
                      <span className="text-xs text-[hsl(var(--growth-600))]">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1 text-[hsl(var(--story-500))]" />
                      <span className="text-xs text-[hsl(var(--story-600))]">Private</span>
                    </>
                  )}
                </div>

                {hasAudio && (
                  <div className="flex items-center" title="Has audio">
                    <Headphones className="w-3.5 h-3.5 mr-1 text-[hsl(var(--memory-500))]" />
                    <span className="text-xs text-[hsl(var(--memory-500))]">Audio</span>
                  </div>
                )}

                <span className="text-muted-foreground">{story.author_wallet?.followers} followers</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={story.author_wallet?.isFollowing ? "secondary" : "outline"}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onFollow?.(story.author_wallet?.username || ''); }}
            className="text-sm"
          >
            {story.author_wallet?.isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title with canonical indicator */}
        <div className="flex items-start gap-2">
          <h3 className="text-xl font-semibold text-foreground flex-1">
            {story.title}
          </h3>
          {isCanonical && (
            <div className="flex items-center gap-1 text-[hsl(var(--story-500))]" title="Key Moment">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Content or Paywall */}
        {isLocked ? (
          <div className="p-4 bg-[hsl(var(--story-500)/0.08)] rounded-lg border border-[hsl(var(--story-500)/0.15)]">
            <p className="text-muted-foreground mb-3">
              {story.teaser || "Premium content locked behind paywall"}
            </p>
            <Button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePaywall(); }}
              disabled={isPaying}
              size="sm"
              className="btn-solid-story"
            >
              {isPaying ? "Processing..." : `Unlock for ${story.paywallAmount} $STORY`}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {story.content}
          </p>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Emotional tone & insights preview (if metadata exists) */}
        {metadata?.brief_insight && (
          <div className="p-3 bg-[hsl(var(--insight-500)/0.05)] rounded-lg border border-[hsl(var(--insight-500)/0.1)]">
            <p className="text-sm text-[hsl(var(--insight-600))] dark:text-[hsl(var(--insight-400))] italic">
              {metadata.brief_insight}
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--memory-500)/0.1)]">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike?.(story.id); }}
              className={`hover:bg-transparent ${story.isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${story.isLiked ? "fill-current" : ""}`} />
              {story.likes}
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} className="text-muted-foreground hover:text-foreground hover:bg-transparent">
              <MessageCircle className="w-4 h-4 mr-1" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onShare?.(story.id); }}
              className="text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <Share2 className="w-4 h-4 mr-1" />
              {story.shares}
            </Button>
          </div>

          {/* Tipping */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleTip(); }}
              disabled={isTipping}
              className="text-[hsl(var(--story-500))] hover:text-[hsl(var(--story-400))] hover:bg-[hsl(var(--story-500)/0.1)]"
            >
              {isTipping ? "Tipping..." : `Tip ${tipAmount}`}
            </Button>
            <input
              title="Tip amount"
              type="range"
              min="1"
              max="50"
              value={tipAmount}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onChange={(e) => { e.stopPropagation(); setTipAmount(Number(e.target.value)); }}
              className="w-16 h-1.5 bg-[hsl(var(--void-light))] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
