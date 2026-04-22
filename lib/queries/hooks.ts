"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api";
import { queryKeys } from "./keys";

/* ==========================================================================
   Auth / Profile
   ========================================================================== */

export function useUserProfile() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ user: any }>(token, "/api/user/profile");
    },
    staleTime: 60_000,
    retry: (count, err) => {
      // Don't retry 401s — user is genuinely logged out
      if (err instanceof ApiError && err.status === 401) return false;
      return count < 2;
    },
  });
}

/* ==========================================================================
   Stories
   ========================================================================== */

export interface Story {
  id: string;
  numeric_id: number;
  title: string;
  content: string;
  teaser?: string;
  created_at: string;
  story_date?: string;
  is_public: boolean;
  likes: number;
  shares: number;
  comments_count: number;
  has_audio: boolean;
  audio_url: string | null;
  mood?: string;
  tags?: string[];
  paywall_amount?: number;
  story_type?: string;
  author_id: string;
  author_wallet?: string;
  view_count: number;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    wallet_address: string | null;
    followers_count: number;
    badges: string[];
  } | null;
}

export function useStoriesFeed() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.stories.feed,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ stories: Story[] }>(token, "/api/stories/feed");
    },
    staleTime: 30_000,
  });
}

export function useStory(storyId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId),
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ story: Story & { parentStory?: { id: string; title: string } | null }; comments: any[] }>(
        token,
        `/api/stories/${storyId}`
      );
    },
    enabled: !!storyId,
    staleTime: 30_000,
  });
}

export function useStoryMetadata(storyId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.stories.metadata(storyId),
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<any>(token, `/api/stories/${storyId}/metadata`);
    },
    enabled: !!storyId,
    staleTime: 60_000,
  });
}

/* ==========================================================================
   Social (Likes, Follows, Comments)
   ========================================================================== */

export function useLikeStatus(storyId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.social.likeStatus(storyId),
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ liked: boolean; count: number }>(
        token,
        `/api/social/like/status?storyId=${storyId}`
      );
    },
    enabled: !!storyId,
    staleTime: 10_000,
  });
}

export function useToggleLike() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["social", "like", "toggle"],
    mutationFn: async (storyId: string) => {
      const token = await getAccessToken();
      return apiPost<{ success: boolean; data: { isLiked: boolean; totalLikes: number } }>(
        token,
        "/api/social/like",
        { storyId }
      );
    },
    onSuccess: (_data, storyId) => {
      qc.invalidateQueries({ queryKey: queryKeys.social.likeStatus(storyId) });
      qc.invalidateQueries({ queryKey: queryKeys.stories.feed });
      qc.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });
}

export function useFollowStatus(userId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.social.followStatus(userId),
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ following: boolean }>(token, `/api/social/follow/status?userId=${userId}`);
    },
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function useToggleFollow() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["social", "follow", "toggle"],
    mutationFn: async ({ userId, action }: { userId: string; action: "follow" | "unfollow" }) => {
      const token = await getAccessToken();
      return apiPost<{ success: boolean }>(token, "/api/social/follow", { userId, action });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.social.followStatus(variables.userId) });
      qc.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/* ==========================================================================
   Library / Collections
   ========================================================================== */

export function useLibraryCollections() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.library.collections,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ collections: any[] }>(token, "/api/stories/collections");
    },
    staleTime: 30_000,
  });
}

export function useCollection(collectionId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.library.collection(collectionId),
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ collection: any; stories: any[] }>(
        token,
        `/api/stories/collections/${collectionId}`
      );
    },
    enabled: !!collectionId,
    staleTime: 30_000,
  });
}

/* ==========================================================================
   Notifications
   ========================================================================== */

export function useNotifications() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ notifications: any[]; unreadCount: number }>(token, "/api/notifications");
    },
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", "markRead"],
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      return apiPatch(token, `/api/notifications/${id}`, { read: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/* ==========================================================================
   Payments
   ========================================================================== */

export function usePaymentStatus() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.payments.status,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiGet<{ subscription_plan: string; subscription_expires_at: string | null }>(
        token,
        "/api/payment/status"
      );
    },
    staleTime: 60_000,
  });
}
