// Book Detail Screen - Table of contents, chapters, IPFS link
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react-native";
import { apiGet } from "../../lib/api";

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
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-slate-400">{loading ? "Loading..." : "Book not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4">
        <View className="flex-row items-center gap-3 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <BookOpen size={20} color="#a78bfa" />
          <Text className="flex-1 text-lg font-semibold text-white">{book.title}</Text>
        </View>

        <Text className="mb-4 text-sm text-slate-400">{book.description}</Text>
        <Text className="mb-6 text-xs text-slate-500">
          By {book.author_name} · {new Date(book.created_at).toLocaleDateString()}
        </Text>

        {/* Table of Contents */}
        <Text className="mb-3 text-base font-semibold text-white">
          Chapters ({book.stories.length})
        </Text>
        {book.stories.map((story, idx) => (
          <TouchableOpacity
            key={story.id}
            onPress={() => router.push(`/story/${story.id}`)}
            className="mb-2 flex-row items-center gap-3 rounded-xl bg-slate-800 p-4"
          >
            <Text className="text-lg font-bold text-violet-400">{idx + 1}</Text>
            <Text className="flex-1 text-white">{story.title}</Text>
          </TouchableOpacity>
        ))}

        {/* IPFS Link */}
        {book.ipfs_hash && (
          <View className="mt-6 rounded-xl bg-slate-800 p-4">
            <Text className="mb-2 text-sm text-slate-400">Stored on IPFS</Text>
            <View className="flex-row items-center gap-2">
              <ExternalLink size={16} color="#a78bfa" />
              <Text className="font-mono text-xs text-violet-400">
                ipfs://{book.ipfs_hash.slice(0, 20)}...
              </Text>
            </View>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
