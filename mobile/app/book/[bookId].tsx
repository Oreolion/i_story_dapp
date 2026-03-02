// Book Detail Screen - Table of contents, chapters, IPFS link
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react-native";
import { apiGet } from "../../lib/api";
import {
  GlassCard,
  AnimatedListItem,
  Badge,
  SkeletonLoader,
  GRADIENTS,
} from "../../components/ui";

interface BookData {
  id: string;
  title: string;
  description: string;
  author_name: string;
  ipfs_hash: string;
  stories: { id: number; title: string; content: string }[];
  created_at: string;
}

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiGet<{ book: BookData }>(`/api/books/${bookId}`);
        if (res.ok && res.data) {
          setBook(res.data.book);
        }
      } catch (err) {
        console.error("[BookDetail] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetch();
  }, [bookId]);

  if (loading || !book) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", paddingHorizontal: 16 }}>
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <SkeletonLoader variant="title" />
        <View style={{ marginTop: 16 }}>
          <SkeletonLoader variant="card" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <BookOpen size={20} color="#a78bfa" />
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "600", color: "#fff" }}>{book.title}</Text>
          </View>
        </AnimatedListItem>

        <AnimatedListItem index={1}>
          <Text style={{ marginBottom: 16, fontSize: 14, color: "#94a3b8", lineHeight: 20 }}>
            {book.description}
          </Text>
          <Text style={{ marginBottom: 24, fontSize: 12, color: "#64748b" }}>
            By {book.author_name} · {new Date(book.created_at).toLocaleDateString()}
          </Text>
        </AnimatedListItem>

        {/* Table of Contents */}
        <AnimatedListItem index={2}>
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "600", color: "#fff" }}>
            Chapters ({book.stories.length})
          </Text>
        </AnimatedListItem>

        {book.stories.map((story, idx) => (
          <AnimatedListItem key={story.id} index={idx + 3}>
            <TouchableOpacity
              onPress={() => router.push(`/story/${story.id}`)}
              activeOpacity={0.8}
            >
              <GlassCard
                intensity="light"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{idx + 1}</Text>
                </LinearGradient>
                <Text style={{ flex: 1, fontSize: 14, color: "#fff" }}>{story.title}</Text>
              </GlassCard>
            </TouchableOpacity>
          </AnimatedListItem>
        ))}

        {/* IPFS Link */}
        {book.ipfs_hash && (
          <AnimatedListItem index={book.stories.length + 3}>
            <GlassCard intensity="medium" style={{ padding: 16, marginTop: 24 }}>
              <Text style={{ marginBottom: 8, fontSize: 13, color: "#94a3b8" }}>Stored on IPFS</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ExternalLink size={16} color="#a78bfa" />
                <Badge text={`ipfs://${book.ipfs_hash.slice(0, 20)}...`} variant="violet" />
              </View>
            </GlassCard>
          </AnimatedListItem>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
