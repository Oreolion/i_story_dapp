"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";

import { useApp } from "../../../../components/Provider";
import { useAuth } from "../../../../components/AuthProvider";
import { supabaseClient } from "../../../../app/utils/supabase/supabaseClient";
import { STORY_NFT_ADDRESS } from "../../../../lib/contracts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Layers,
  BookOpen,
  Calendar,
  Share2,
  Box,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  ipfs_hash: string;
  story_ids: string[];
  author: {
    name: string;
    wallet_address: string;
    avatar: string;
  };
}

interface StoryChapter {
  id: string;
  title: string;
  content: string;
  created_at: string;
  mood: string;
}

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);

  const router = useRouter();
  const { isConnected } = useApp();

  const [book, setBook] = useState<BookData | null>(null);
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = supabaseClient;

  useEffect(() => {
    if (!supabase) return;

    const fetchBook = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Book Metadata
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select(
            `
            *,
            author:users!books_author_id_fkey (name, wallet_address, avatar)
          `
          )
          .eq("id", bookId)
          .maybeSingle();

        if (bookError) throw bookError;
        if (!bookData) {
          setBook(null);
          return;
        }

        // 2. Fetch Author Details (Fallback if join fails)
        let authorProfile = bookData.author;
        if (!authorProfile && bookData.author_id) {
          const { data: authorData } = await supabase
            .from("users")
            .select("name, wallet_address, avatar")
            .eq("id", bookData.author_id)
            .single();
          authorProfile = authorData;
        }

        setBook({
          ...bookData,
          author: authorProfile || {
            name: "Unknown",
            wallet_address: "",
            avatar: "",
          },
        });

        // 3. Fetch Stories included in this book
        if (bookData.story_ids && bookData.story_ids.length > 0) {
          const { data: storiesData } = await supabase
            .from("stories")
            .select("id, title, content, created_at, mood")
            .in("id", bookData.story_ids)
            .order("created_at", { ascending: true });

          // Safe cast
          setChapters((storiesData || []) as StoryChapter[]);
        }
      } catch (err) {
        console.error("Error fetching book:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <BookOpen className="w-16 h-16 text-gray-300" />
        <h2 className="text-2xl font-semibold text-gray-700">Book Not Found</h2>
        <p className="text-gray-500">This collection may have been deleted.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Return to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
        <div className="flex gap-2">
          {/* View on Chain Button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() =>
              window.open(
                `https://sepolia.basescan.org/address/${STORY_NFT_ADDRESS}`,
                "_blank"
              )
            }
          >
            <Box className="w-4 h-4 mr-2" /> View on BaseScan
          </Button>

          {book.ipfs_hash && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://gateway.pinata.cloud/ipfs/${book.ipfs_hash}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" /> View IPFS
            </Button>
          )}
        </div>
      </div>

      {/* Book Cover / Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-center">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1">
                NFT Collection
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              {book.title}
            </h1>
            <p className="text-xl text-indigo-200 max-w-2xl font-light leading-relaxed">
              {book.description}
            </p>

            <div className="flex flex-wrap items-center gap-8 mt-10 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <Avatar className="border-2 border-white/50 h-10 w-10">
                  <AvatarImage src={book.author?.avatar} />
                  <AvatarFallback className="text-black">
                    {book.author?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="opacity-60 text-xs uppercase tracking-wider">
                    Author
                  </p>
                  <p className="font-semibold">
                    {book.author?.name || "Anonymous"}
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-sm">
                <p className="opacity-60 text-xs uppercase tracking-wider">
                  Published
                </p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(book.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-sm">
                <p className="opacity-60 text-xs uppercase tracking-wider">
                  Chapters
                </p>
                <p className="font-semibold">{chapters.length}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
        </div>
      </motion.div>

      {/* Table of Contents / Chapters List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Layers className="w-5 h-5 text-purple-600" />
          <h2>Table of Contents</h2>
        </div>

        {chapters.map((chapter, index) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={chapter.id}
          >
            <Link href={`/story/${chapter.id}`} passHref>
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-purple-500 group cursor-pointer bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-baseline">
                    <CardTitle className="text-lg">
                      <span className="text-gray-400 mr-3">
                        #{String(index + 1).padStart(2, "0")}
                      </span>
                      {chapter.title}
                    </CardTitle>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-sm pl-10">
                    {chapter.content}
                  </p>
                  {chapter.mood && (
                    <div className="mt-3 pl-10">
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal opacity-70"
                      >
                        Mood: {chapter.mood}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>This book has no chapters yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
