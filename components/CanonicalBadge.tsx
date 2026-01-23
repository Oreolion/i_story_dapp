"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanonicalBadgeProps {
  storyId: string;
  isCanonical: boolean;
  isAuthor: boolean;
  size?: "sm" | "md" | "lg";
  onToggle?: (newValue: boolean) => void;
  className?: string;
}

const sizeClasses = {
  sm: {
    button: "h-7 px-2 text-xs",
    icon: "w-3 h-3",
    badge: "text-xs",
  },
  md: {
    button: "h-8 px-3 text-sm",
    icon: "w-4 h-4",
    badge: "text-sm",
  },
  lg: {
    button: "h-10 px-4 text-base",
    icon: "w-5 h-5",
    badge: "text-base",
  },
};

export function CanonicalBadge({
  storyId,
  isCanonical,
  isAuthor,
  size = "md",
  onToggle,
  className,
}: CanonicalBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localIsCanonical, setLocalIsCanonical] = useState(isCanonical);

  const classes = sizeClasses[size];

  const handleToggle = async () => {
    if (!isAuthor || isUpdating) return;

    const newValue = !localIsCanonical;

    // Optimistic update
    setLocalIsCanonical(newValue);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_canonical: newValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      toast.success(
        newValue
          ? "Marked as Key Moment"
          : "Removed from Key Moments"
      );

      onToggle?.(newValue);
    } catch (error) {
      // Revert on error
      setLocalIsCanonical(!newValue);
      console.error("Error toggling canonical status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  // Display-only mode for non-authors
  if (!isAuthor) {
    if (!localIsCanonical) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                "bg-[hsl(var(--story-500)/0.15)] text-[hsl(var(--story-600))] dark:text-[hsl(var(--story-400))] border-[hsl(var(--story-500)/0.3)] animate-glow-pulse",
                classes.badge,
                className
              )}
            >
              <Star className={cn("fill-current mr-1", classes.icon)} />
              Key Moment
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This story was marked as a key life moment by the author</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Interactive toggle button for authors
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={localIsCanonical ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isUpdating}
            className={cn(
              "transition-all duration-200",
              localIsCanonical
                ? "bg-[hsl(var(--story-500))] hover:bg-[hsl(var(--story-600))] text-white border-[hsl(var(--story-500))] hover-glow-canonical"
                : "border-[hsl(var(--story-500)/0.4)] text-[hsl(var(--story-600))] hover:bg-[hsl(var(--story-500)/0.1)] dark:border-[hsl(var(--story-500)/0.3)] dark:text-[hsl(var(--story-400))]",
              classes.button,
              className
            )}
          >
            {isUpdating ? (
              <Loader2 className={cn("animate-spin mr-1", classes.icon)} />
            ) : (
              <motion.div
                animate={{ scale: localIsCanonical ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Star
                  className={cn(
                    "mr-1",
                    classes.icon,
                    localIsCanonical && "fill-current"
                  )}
                />
              </motion.div>
            )}
            {localIsCanonical ? "Key Moment" : "Mark as Key Moment"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {localIsCanonical
              ? "Click to remove from Key Moments"
              : "Mark this story as a key life moment"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
