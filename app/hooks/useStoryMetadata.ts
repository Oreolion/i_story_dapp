"use client";

import { useState, useEffect, useCallback } from "react";
import { StoryMetadata } from "../types";

interface UseStoryMetadataReturn {
  metadata: StoryMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsCanonical: (value: boolean) => Promise<boolean>;
  isUpdating: boolean;
}

export function useStoryMetadata(storyId: string | null): UseStoryMetadataReturn {
  const [metadata, setMetadata] = useState<StoryMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stories/${storyId}/metadata`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch metadata");
      }

      const data = await res.json();
      setMetadata(data.metadata || null);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch metadata");
    } finally {
      setIsLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const markAsCanonical = useCallback(async (value: boolean): Promise<boolean> => {
    if (!storyId || isUpdating) return false;

    // Store previous value for rollback
    const previousValue = metadata?.is_canonical ?? false;

    // Optimistic update
    setMetadata((prev) => prev ? { ...prev, is_canonical: value } : null);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_canonical: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      const data = await res.json();
      setMetadata(data.metadata || null);
      return true;
    } catch (err) {
      console.error("Error updating canonical status:", err);
      // Rollback on error
      setMetadata((prev) => prev ? { ...prev, is_canonical: previousValue } : null);
      setError(err instanceof Error ? err.message : "Failed to update");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [storyId, metadata?.is_canonical, isUpdating]);

  return {
    metadata,
    isLoading,
    error,
    refetch: fetchMetadata,
    markAsCanonical,
    isUpdating,
  };
}
