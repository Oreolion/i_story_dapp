"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { motion } from "framer-motion";
import { useApp } from "@/components/Provider"; // <-- USE useApp
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Search,
  Calendar,
  Heart,
  Eye,
  Download,
  Share2,
  Filter,
  Plus,
  Sparkles,
  FileText,
  Volume2,
  Loader2, // Added Loader2
} from "lucide-react";

// Mock data remains the same
const mockEntries = [
  {
    id: 1,
    title: "Morning Walk Reflections",
    content:
      "Today was an incredible day. I woke up early and went for a walk in the park. The morning mist was still hanging over the lake...",
    date: "2025-01-20",
    likes: 24,
    views: 156,
    hasAudio: true,
    mood: "peaceful",
    tags: ["nature", "reflection", "morning"],
    type: "entry",
  },
  {
    id: 2,
    title: "My First Digital Book",
    content:
      "A collection of stories from my summer adventures, compiled into a beautiful digital book NFT.",
    date: "2025-01-18",
    likes: 89,
    views: 342,
    hasAudio: false,
    mood: "excited",
    tags: ["adventure", "summer", "travel"],
    type: "book",
  },
  {
    id: 3,
    title: "Grandmother's Stories",
    content:
      "Recording the beautiful stories my grandmother shared about her youth and the old country...",
    date: "2025-01-15",
    likes: 156,
    views: 523,
    hasAudio: true,
    mood: "nostalgic",
    tags: ["family", "history", "memories"],
    type: "entry",
  },
  {
    id: 4,
    title: "Career Reflections",
    content:
      "A deep dive into my professional journey, lessons learned, and dreams for the future.",
    date: "2025-01-12",
    likes: 67,
    views: 298,
    hasAudio: false,
    mood: "thoughtful",
    tags: ["career", "growth", "future"],
    type: "entry",
  },
];
const moodColors: { [key: string]: string } = {
  // Added index signature
  peaceful: "bg-green-100 dark:bg-green-900 text-green-600",
  excited: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600",
  nostalgic: "bg-purple-100 dark:bg-purple-900 text-purple-600",
  thoughtful: "bg-blue-100 dark:bg-blue-900 text-blue-600",
};

export default function LibraryPage() {
  const { user, isConnected } = useApp(); // <-- Use useApp for connection status
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true); // Basic loading state

  // Simulate loading (can be removed if only checking isConnected)
  useEffect(() => {
    // Give Provider a moment to determine connection status
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const filteredEntries = mockEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "entries" && entry.type === "entry") ||
      (activeFilter === "books" && entry.type === "book") ||
      (activeFilter === "audio" && entry.hasAudio);

    return matchesSearch && matchesFilter;
  });
  // Auth Guard using isConnected from useApp()
  // Show loading spinner first
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // If loading is done and not connected, show message
  if (!isConnected) {
    return (
      <div className="text-center space-y-8 py-16">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-purple-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect your wallet to access your personal story library.
          </p>
        </div>
      </div>
    );
  }

  // --- Main Render (Wallet is connected) ---
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <BookOpen className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Your Story Library
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          All your journal entries and compiled books in one place
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Entries",
            value: mockEntries.filter((e) => e.type === "entry").length,
            icon: FileText,
          },
          {
            label: "Books Created",
            value: mockEntries.filter((e) => e.type === "book").length,
            icon: BookOpen,
          },
          {
            label: "Total Likes",
            value: mockEntries.reduce((sum, e) => sum + e.likes, 0),
            icon: Heart,
          },
          {
            label: "Total Views",
            value: mockEntries.reduce((sum, e) => sum + e.views, 0),
            icon: Eye,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      {/* Search and Filters */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search your stories, tags, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs
              value={activeFilter}
              onValueChange={setActiveFilter}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="entries" className="text-xs">
                  Entries
                </TabsTrigger>
                <TabsTrigger value="books" className="text-xs">
                  Books
                </TabsTrigger>
                <TabsTrigger value="audio" className="text-xs">
                  Audio
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {entry.type === "book" ? (
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-purple-600" />
                      )}
                      {entry.hasAudio && (
                        <Volume2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                      {entry.title}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      moodColors[entry.mood as keyof typeof moodColors]
                    }
                  >
                    {entry.mood}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{entry.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{entry.views}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {entry.content}
                </p>

                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                  {entry.type === "book" && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No stories found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {searchQuery
              ? `No stories match "${searchQuery}". Try adjusting your search or filters.`
              : "Start creating your first story to see it here."}
          </p>
        </div>
      )}
      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to create more stories?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Record new entries or compile existing ones into digital books
              </p>
            </div>
            <div className="flex space-x-4">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Compile Book
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>{" "}
    </div>
  );
}