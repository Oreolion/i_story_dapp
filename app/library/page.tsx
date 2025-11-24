"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

// FIX: Correct relative paths
import { useApp } from "../../components/Provider";
import { useAuth } from "../../components/AuthProvider";
import { useStoryNFT } from "../hooks/useStoryNFT";
import { supabaseClient } from "../utils/supabase/supabaseClient";
import { ipfsService } from "../utils/ipfsService";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Search,
  Calendar,
  Heart,
  Eye,
  Download,
  Share2,
  Plus,
  Sparkles,
  FileText,
  Volume2,
  Loader2,
  CheckCircle2,
  X,
  Library,
} from "lucide-react";

// --- Types ---
interface BaseEntry {
  id: string;
  title: string;
  created_at: string;
  likes: number;
  views: number;
  mood?: string;
  tags?: string[];
}

interface StoryEntry extends BaseEntry {
  type: "entry";
  content: string;
  has_audio: boolean;
  audio_url: string | null;
}

interface BookEntry extends BaseEntry {
  type: "book";
  description: string;
  story_ids: string[];
  ipfs_hash?: string;
}

type LibraryItem = StoryEntry | BookEntry;

const moodColors: { [key: string]: string } = {
  peaceful: "bg-green-100 dark:bg-green-900 text-green-600",
  excited: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600",
  nostalgic: "bg-purple-100 dark:bg-purple-900 text-purple-600",
  thoughtful: "bg-blue-100 dark:bg-blue-900 text-blue-600",
  neutral: "bg-gray-100 dark:bg-gray-800 text-gray-600",
  unknown: "bg-gray-100 dark:bg-gray-800 text-gray-600",
};

export default function LibraryPage() {
  const { isConnected } = useApp();
  const authInfo = useAuth();
  const supabase = supabaseClient;
  const router = useRouter();
  
  // Blockchain Hook
  const { mintBook, isPending: isMinting } = useStoryNFT();

  // Data State
  const [entries, setEntries] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Compilation State
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  
  // New Book Form State
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookDesc, setNewBookDesc] = useState("");
  const [isSavingBook, setIsSavingBook] = useState(false);

  // --- 1. Fetch Data ---
  const fetchData = async () => {
    if (!authInfo?.id || !supabase) return;
    setIsLoading(true);

    try {
      // Fetch Stories
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("author_id", authInfo.id)
        .order("created_at", { ascending: false });

      if (storiesError) throw storiesError;

      // Fetch Books
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .eq("author_id", authInfo.id)
        .order("created_at", { ascending: false });

      const formattedStories: StoryEntry[] = (storiesData || []).map((s) => ({
        type: "entry",
        id: s.id,
        title: s.title || "Untitled Story",
        content: s.content || "",
        created_at: s.created_at,
        likes: s.likes || 0,
        views: s.views || 0,
        has_audio: s.has_audio,
        audio_url: s.audio_url,
        mood: s.mood || "neutral",
        tags: s.tags || [],
      }));

      const formattedBooks: BookEntry[] = (booksData || []).map((b) => ({
        type: "book",
        id: b.id,
        title: b.title || "Untitled Book",
        description: b.description || "",
        created_at: b.created_at,
        likes: b.likes || 0,
        views: b.views || 0,
        story_ids: b.story_ids || [],
        ipfs_hash: b.ipfs_hash,
        mood: "excited",
        tags: ["compilation"],
      }));

      const allEntries = [...formattedStories, ...formattedBooks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(allEntries);
    } catch (err: any) {
      console.error("Library fetch error:", err);
      // toast.error("Failed to load library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && authInfo?.id) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, authInfo?.id, supabase]);

  // --- 2. Event Handlers ---
  const toggleSelection = (id: string) => {
    const next = new Set(selectedStoryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStoryIds(next);
  };

  const handleStartCompile = () => {
    setIsCompiling(true);
    setActiveFilter("entries"); // Switch to entries tab
    setSelectedStoryIds(new Set());
    toast("Select stories to add to your book", { icon: "📚" });
  };

  const handleCancelCompile = () => {
    setIsCompiling(false);
    setSelectedStoryIds(new Set());
  };

  const handleOpenBookDialog = () => {
    if (selectedStoryIds.size < 2) {
      return toast.error("Please select at least 2 stories.");
    }
    setNewBookTitle("");
    setNewBookDesc("");
    setIsBookDialogOpen(true);
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) return toast.error("Please enter a book title");
    if (!supabase || !authInfo?.id) return;

    setIsSavingBook(true);
    try {
      // 1. Gather Data
      const selectedStories = entries.filter(e => 
        e.type === 'entry' && selectedStoryIds.has(e.id)
      ) as StoryEntry[];

      const metadata = {
        name: newBookTitle,
        description: newBookDesc,
        external_url: "https://istory.vercel.app",
        attributes: [
           { trait_type: "Author", value: authInfo.name },
           { trait_type: "Stories", value: selectedStories.length },
        ],
        stories: selectedStories.map(s => ({
           title: s.title,
           content: s.content,
           audio: s.audio_url,
           date: s.created_at
        }))
      };

      // 2. IPFS Upload
      toast.loading("Uploading Metadata...", { id: "book-toast" });
      const ipfsResult = await ipfsService.uploadMetadata(metadata);
      if(!ipfsResult?.hash) throw new Error("IPFS upload failed");
      const tokenURI = `ipfs://${ipfsResult.hash}`;

      // 3. Mint NFT
      toast.loading("Minting NFT...", { id: "book-toast" });
      await mintBook(tokenURI); 
      
      // 4. Save DB
      const bookData = {
        author_id: authInfo.id,
        author_wallet: authInfo.wallet_address,
        title: newBookTitle,
        description: newBookDesc,
        story_ids: Array.from(selectedStoryIds),
        ipfs_hash: ipfsResult.hash, 
      };

      const { error } = await supabase.from("books").insert([bookData]);
      if (error) throw error;

      toast.success("Book Created & Minted!", { id: "book-toast" });
      setIsBookDialogOpen(false);
      setIsCompiling(false);
      setSelectedStoryIds(new Set());
      fetchData();

    } catch (err: any) {
      console.error("Create book error:", err);
      const msg = err.message || "Failed to create book";
      if (msg.includes("User rejected")) toast.error("Minting cancelled", { id: "book-toast" });
      else toast.error("Failed to create book", { id: "book-toast" });
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleCardClick = (entry: LibraryItem) => {
    if (isCompiling && entry.type === "entry") {
      toggleSelection(entry.id);
    } else if (!isCompiling) {
        if (entry.type === "entry") {
            router.push(`/story/${entry.id}`);
        } else if (entry.type === "book") {
            // NEW: Navigate to the book viewer
            router.push(`/book/${entry.id}`);
        }
    }
  };

  // --- 3. Filtering ---
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.type === "entry" && entry.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "entries" && entry.type === "entry") ||
      (activeFilter === "books" && entry.type === "book") ||
      (activeFilter === "audio" && entry.type === "entry" && entry.has_audio);

    return matchesSearch && matchesFilter;
  });

  // --- 4. Render ---

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header (Restored Centered Layout) */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <Library className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Your Story Library
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          All your journal entries and compiled books in one place
        </p>
      </div>

      {/* Stats Cards (Restored Grid Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Entries",
            value: entries.filter((e) => e.type === "entry").length,
            icon: FileText,
          },
          {
            label: "Books Created",
            value: entries.filter((e) => e.type === "book").length,
            icon: BookOpen,
          },
          {
            label: "Total Likes",
            value: entries.reduce((sum, e) => sum + e.likes, 0),
            icon: Heart,
          },
          {
            label: "Total Views",
            value: entries.reduce((sum, e) => sum + e.views, 0),
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

      {/* Search and Filters (Restored Card Layout) */}
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
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="entries" className="text-xs">Entries</TabsTrigger>
                <TabsTrigger value="books" className="text-xs">Books</TabsTrigger>
                <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
        </div>
      ) : (
        /* Content Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card 
                  className={`h-full border-0 shadow-lg transition-all duration-300 relative overflow-hidden group
                    ${isCompiling && entry.type === 'entry' ? 'cursor-pointer hover:ring-2 hover:ring-purple-500' : 'cursor-pointer hover:shadow-xl hover:scale-[1.01]'}
                    ${selectedStoryIds.has(entry.id) ? 'ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm'}
                  `}
                  onClick={() => handleCardClick(entry)}
                >
                  {/* Selection Indicator */}
                  {isCompiling && entry.type === 'entry' && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${selectedStoryIds.has(entry.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white/80'}
                      `}>
                        {selectedStoryIds.has(entry.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between pr-8">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {entry.type === "book" ? (
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-purple-600" />
                          )}
                          {entry.type === "entry" && entry.has_audio && (
                            <Volume2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {entry.type === "book" && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              Collection
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {entry.title}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={moodColors[entry.mood || "neutral"]}
                      >
                        {entry.mood}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                      {entry.type === "book" && (
                        <div className="flex items-center space-x-1 text-indigo-600">
                          <FileText className="w-4 h-4" />
                          <span>{entry.story_ids.length} Stories</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 min-h-[4.5rem]">
                      {entry.type === "entry" ? entry.content : entry.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {entry.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {!isCompiling && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" className="h-8">
                            <Eye className="w-4 h-4 mr-1" /> {entry.views}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8">
                            <Heart className="w-4 h-4 mr-1" /> {entry.likes}
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                           <Button size="sm" variant="ghost" className="h-8">
                            <Share2 className="w-4 h-4" />
                           </Button>
                           {entry.type === "book" && (
                            <Button size="sm" variant="ghost" className="h-8 text-indigo-600">
                              <Download className="w-4 h-4" />
                            </Button>
                           )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEntries.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No stories found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {searchQuery
              ? `No matches for "${searchQuery}".`
              : "Start your journey by recording your first story!"}
          </p>
        </div>
      )}

      {/* Quick Actions (Restored at Bottom) */}
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
            
            <div className="flex gap-2">
              {isCompiling ? (
                <>
                  <Button variant="outline" onClick={handleCancelCompile} className="border-red-200 text-red-600 hover:bg-red-50">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleOpenBookDialog} 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    disabled={selectedStoryIds.size < 2}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> 
                    Create Book ({selectedStoryIds.size})
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleStartCompile}
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Compile Book
                  </Button>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600" onClick={() => router.push('/record')}>
                    <Plus className="w-4 h-4 mr-2" /> New Entry
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Book Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Compile Digital Book</DialogTitle>
            <DialogDescription>
              Create a collection from your selected {selectedStoryIds.size} stories.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Memories 2024"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="What is this collection about?"
                value={newBookDesc}
                onChange={(e) => setNewBookDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBook} 
              disabled={isSavingBook || isMinting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {(isSavingBook || isMinting) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isMinting ? "Minting NFT..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}