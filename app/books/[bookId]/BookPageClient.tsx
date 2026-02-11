"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";

// FIX: Explicit root-relative paths
// [bookId] -> book -> app -> root -> app -> utils
import { supabaseClient } from "../../../app/utils/supabase/supabaseClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Calendar,
  ArrowLeft,
  User,
  Share2,
  ExternalLink,
  Loader2,
  Layers
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
}

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<BookData | null>(null);
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = supabaseClient;

  useEffect(() => {
    const fetchBook = async () => {
      if (!supabase) return;
      try {
        setIsLoading(true);
        
        // 1. Fetch Book Metadata
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select(`
            *,
            author:users!books_author_id_fkey (name, wallet_address, avatar)
          `)
          .eq("id", bookId)
          .single();

        if (bookError) throw bookError;
        setBook(bookData);

        // 2. Fetch Stories included in this book
        if (bookData.story_ids && bookData.story_ids.length > 0) {
            const { data: storiesData } = await supabase
                .from("stories")
                .select("id, title, content, created_at")
                .in("id", bookData.story_ids)
                .order("created_at", { ascending: true });
            
            setChapters(storiesData || []);
        }

      } catch (err) {
        console.error("Error fetching book:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBook();
  }, [bookId, supabase]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-purple-600"/></div>;
  if (!book) return <div className="min-h-screen flex items-center justify-center">Book Not Found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
            </Button>
            {book.ipfs_hash && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${book.ipfs_hash}`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View on IPFS
                </Button>
            )}
        </div>

        {/* Book Cover / Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">NFT Collection</Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{book.title}</h1>
                <p className="text-lg text-indigo-200 max-w-2xl">{book.description}</p>
                
                <div className="flex items-center gap-6 mt-8">
                    <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-white/50">
                            <AvatarImage src={book.author.avatar} alt={book.author.name || "Author"} />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                            <p className="opacity-70">Author</p>
                            <p className="font-semibold">{book.author.name || "Anonymous"}</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div className="text-sm">
                        <p className="opacity-70">Published</p>
                        <p className="font-semibold">{new Date(book.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div className="text-sm">
                        <p className="opacity-70">Chapters</p>
                        <p className="font-semibold">{chapters.length}</p>
                    </div>
                </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
        </div>

        {/* Table of Contents / Chapters */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                <Layers className="w-5 h-5 text-purple-600" />
                <h2>Table of Contents</h2>
            </div>

            {chapters.map((chapter, index) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={chapter.id}
                >
                    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-purple-500">
                        <CardHeader>
                            <div className="flex justify-between items-baseline">
                                <CardTitle className="text-lg">
                                    <span className="text-gray-400 mr-3">#{index + 1}</span>
                                    {chapter.title}
                                </CardTitle>
                                <span className="text-xs text-gray-400 font-mono">
                                    {new Date(chapter.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                                {chapter.content}
                            </p>
                            <div className="mt-4">
                                <Link href={`/story/${chapter.id}`}>
                                    <Button variant="link" className="p-0 text-purple-600">Read full entry &rarr;</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    </div>
  );
}