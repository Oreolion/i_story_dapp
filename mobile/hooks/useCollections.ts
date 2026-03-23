// Hook: Story Collections CRUD
import { useState, useCallback } from "react";
import { apiGet, apiPost, api, apiDelete } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import type { StoryCollection, CollectionWithStories } from "../types";

export function useCollections() {
  const { isAuthenticated } = useAuthStore();
  const [collections, setCollections] = useState<StoryCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ collections: StoryCollection[] }>(
        "/api/stories/collections"
      );
      if (res.ok && res.data?.collections) {
        setCollections(res.data.collections);
      } else {
        setError(res.error || "Failed to fetch collections");
      }
    } catch (err) {
      console.error("[useCollections] Fetch failed:", err);
      setError("Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const createCollection = async (
    title: string,
    description?: string,
    is_public?: boolean
  ): Promise<StoryCollection | null> => {
    try {
      const res = await apiPost<{ collection: StoryCollection }>(
        "/api/stories/collections",
        { title, description, is_public }
      );
      if (res.ok && res.data?.collection) {
        setCollections((prev) => [res.data!.collection, ...prev]);
        return res.data.collection;
      }
      return null;
    } catch (err) {
      console.error("[useCollections] Create failed:", err);
      return null;
    }
  };

  const updateCollection = async (
    id: string,
    updates: { title?: string; description?: string; is_public?: boolean }
  ): Promise<boolean> => {
    try {
      const res = await api<{ collection: StoryCollection }>(
        `/api/stories/collections/${id}`,
        { method: "PUT", body: updates }
      );
      if (res.ok && res.data?.collection) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? res.data!.collection : c))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useCollections] Update failed:", err);
      return false;
    }
  };

  const deleteCollection = async (id: string): Promise<boolean> => {
    try {
      const res = await apiDelete(`/api/stories/collections/${id}`);
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useCollections] Delete failed:", err);
      return false;
    }
  };

  const fetchCollectionDetail = async (
    id: string
  ): Promise<CollectionWithStories | null> => {
    try {
      const res = await apiGet<{ collection: CollectionWithStories }>(
        `/api/stories/collections/${id}`
      );
      if (res.ok && res.data?.collection) {
        return res.data.collection;
      }
      return null;
    } catch (err) {
      console.error("[useCollections] Fetch detail failed:", err);
      return null;
    }
  };

  const addStoryToCollection = async (
    collectionId: string,
    storyId: string
  ): Promise<boolean> => {
    try {
      const res = await apiPost(
        `/api/stories/collections/${collectionId}/stories`,
        { story_id: storyId }
      );
      return res.ok;
    } catch (err) {
      console.error("[useCollections] Add story failed:", err);
      return false;
    }
  };

  const removeStoryFromCollection = async (
    collectionId: string,
    storyId: string
  ): Promise<boolean> => {
    try {
      const res = await apiDelete(
        `/api/stories/collections/${collectionId}/stories`,
        { story_id: storyId }
      );
      return res.ok;
    } catch (err) {
      console.error("[useCollections] Remove story failed:", err);
      return false;
    }
  };

  return {
    collections,
    loading,
    error,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    fetchCollectionDetail,
    addStoryToCollection,
    removeStoryFromCollection,
  };
}
