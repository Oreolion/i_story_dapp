// Collection Detail Screen - View and manage a story collection
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useCollections } from "../../hooks/useCollections";
import type { CollectionWithStories, StoryDataType } from "../../types";
import {
  GlassCard,
  GradientButton,
  AnimatedListItem,
  Badge,
  GRADIENTS,
} from "../../components/ui";

export default function CollectionDetailScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const {
    fetchCollectionDetail,
    updateCollection,
    deleteCollection,
    removeStoryFromCollection,
  } = useCollections();

  const [collection, setCollection] = useState<CollectionWithStories | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadCollection = useCallback(async () => {
    if (!collectionId) return;
    const data = await fetchCollectionDetail(collectionId);
    if (data) {
      setCollection(data);
      setEditTitle(data.title);
      setEditDescription(data.description || "");
    }
    setLoading(false);
  }, [collectionId]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollection();
    setRefreshing(false);
  };

  const handleSaveEdit = async () => {
    if (!collectionId || !editTitle.trim()) return;
    const success = await updateCollection(collectionId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });
    if (success) {
      setCollection((prev) =>
        prev
          ? { ...prev, title: editTitle.trim(), description: editDescription.trim() || null }
          : null
      );
      setEditing(false);
      Toast.show({ type: "success", text1: "Collection updated" });
    } else {
      Toast.show({ type: "error", text1: "Failed to update collection" });
    }
  };

  const handleToggleVisibility = async () => {
    if (!collectionId || !collection) return;
    const newPublic = !collection.is_public;
    const success = await updateCollection(collectionId, { is_public: newPublic });
    if (success) {
      setCollection((prev) => (prev ? { ...prev, is_public: newPublic } : null));
      Toast.show({
        type: "success",
        text1: newPublic ? "Collection is now public" : "Collection is now private",
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Collection",
      "This will remove the collection but not the stories. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!collectionId) return;
            const success = await deleteCollection(collectionId);
            if (success) {
              Toast.show({ type: "success", text1: "Collection deleted" });
              router.back();
            } else {
              Toast.show({ type: "error", text1: "Failed to delete" });
            }
          },
        },
      ]
    );
  };

  const handleRemoveStory = (storyId: string, storyTitle: string) => {
    Alert.alert("Remove Story", `Remove "${storyTitle}" from this collection?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!collectionId) return;
          const success = await removeStoryFromCollection(collectionId, storyId);
          if (success) {
            setCollection((prev) =>
              prev
                ? {
                    ...prev,
                    stories: prev.stories.filter((s) => String(s.id) !== storyId),
                    story_count: prev.story_count - 1,
                  }
                : null
            );
            Toast.show({ type: "success", text1: "Story removed" });
          }
        },
      },
    ]);
  };

  const renderStory = ({ item, index }: { item: StoryDataType; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        onPress={() => router.push(`/story/${item.id}`)}
        activeOpacity={0.8}
      >
        <GlassCard intensity="light" style={{ padding: 16, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={{ marginTop: 4, fontSize: 13, color: "#94a3b8" }}
                numberOfLines={2}
              >
                {item.content}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveStory(String(item.id), item.title)}
              style={{ padding: 8 }}
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 8, flexDirection: "row", gap: 6 }}>
            <Badge text={item.mood} />
            <Text style={{ fontSize: 11, color: "#64748b" }}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#94a3b8" }}>Loading collection...</Text>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#94a3b8" }}>Collection not found</Text>
        <GradientButton
          onPress={() => router.back()}
          title="Go Back"
          gradient={GRADIENTS.primary}
          style={{ marginTop: 16 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={handleToggleVisibility} style={{ padding: 4 }}>
            {collection.is_public ? (
              <Eye size={20} color="#4ade80" />
            ) : (
              <EyeOff size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditing(!editing)}
            style={{ padding: 4 }}
          >
            <Edit3 size={20} color="#a78bfa" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
            <Trash2 size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title & Description */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        {editing ? (
          <View style={{ gap: 8 }}>
            <GlassCard
              intensity="light"
              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}
                placeholder="Collection title"
                placeholderTextColor="#64748b"
              />
            </GlassCard>
            <GlassCard
              intensity="light"
              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                style={{ fontSize: 14, color: "#cbd5e1" }}
                placeholder="Description (optional)"
                placeholderTextColor="#64748b"
                multiline
              />
            </GlassCard>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <GradientButton
                  onPress={handleSaveEdit}
                  title="Save"
                  gradient={GRADIENTS.success}
                  icon={<Check size={16} color="#fff" />}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton
                  onPress={() => setEditing(false)}
                  title="Cancel"
                  gradient={GRADIENTS.error}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
              {collection.title}
            </Text>
            {collection.description && (
              <Text style={{ marginTop: 4, fontSize: 14, color: "#94a3b8" }}>
                {collection.description}
              </Text>
            )}
            <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
              <Badge
                text={`${collection.story_count} ${collection.story_count === 1 ? "story" : "stories"}`}
              />
              <Badge
                text={collection.is_public ? "Public" : "Private"}
                variant={collection.is_public ? "success" : "warning"}
              />
            </View>
          </>
        )}
      </View>

      {/* Stories List */}
      <FlatList
        data={collection.stories || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStory}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ color: "#94a3b8", marginBottom: 16 }}>
              No stories in this collection yet
            </Text>
            <GradientButton
              onPress={() => router.push("/library")}
              title="Add Stories"
              gradient={GRADIENTS.primary}
              icon={<Plus size={16} color="#fff" />}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
