"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

import { useApp } from "../../components/Provider";
import { useAuth } from "../../components/AuthProvider";
import { emailService } from "../utils/emailService";
import { useStoryNFT } from "../hooks/useStoryNFT";
import { supabaseClient } from "../utils/supabase/supabaseClient";
import { ipfsService } from "../utils/ipfsService";
import { useBackgroundMode } from "@/contexts/BackgroundContext";
import { useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import {
  User,
  Settings,
  Award,
  Link,
  Wallet,
  Check,
  Chrome,
  Heart,
  Eye,
  BookOpen,
  Coins,
  Save,
  Trophy,
  Target,
  Clock,
  Zap,
  Shield,
  Loader2,
  Edit3,
  Sparkles,
} from "lucide-react";

import { WeeklyReflectionSection } from "@/components/WeeklyReflection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// --- Types ---
interface UserProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar: string | null;
  created_at?: string;
}

type ProfileFormData = {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  email: string;
};

// Helper for truncation
const truncateAddress = (addr: string | undefined | null) => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Helper for Heatmap color - uses growth color scale
const getHeatmapColor = (count: number) => {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count === 1) return "bg-[hsl(var(--growth-200))] dark:bg-[hsl(var(--growth-900)/0.6)]";
  if (count <= 3) return "bg-[hsl(var(--growth-400))] dark:bg-[hsl(var(--growth-700))]";
  return "bg-[hsl(var(--growth-600))] dark:bg-[hsl(var(--growth-500))]";
};

export default function ProfilePage() {
  const { user: wagmiUser, isConnected } = useApp();
  const { address } = useAccount();
  const { profile: authInfo, signInWithGoogle, refreshProfile } = useAuth();
  const supabase = supabaseClient;
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  // Set background mode for this page
  useBackgroundMode('profile');

  const { mintBook, isPending: isMinting } = useStoryNFT();

  // Data State
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
    email: "",
  });
  
  // Stats & Activity State
  const [stats, setStats] = useState({ stories: 0, books: 0, likes: 0, views: 0, monthlyStories: 0, streak: 0 });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<{date: string, count: number}[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [todaysStories, setTodaysStories] = useState<any[]>([]);
  
  // Preferences State (Local UI state for now)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    publicProfile: true,
    aiEnhancement: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("overview");

  const handleLinkWallet = async () => {
    if (!authInfo?.id || !address) {
      openConnectModal?.();
      return;
    }
    setIsLinking(true);
    try {
      const message = `Link wallet ${address.toLowerCase()} to iStory account ${authInfo.id}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/auth/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authInfo.id,
          walletAddress: address,
          signature,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Linking failed");
      toast.success("Wallet linked successfully!");
      await refreshProfile();
    } catch (err: any) {
      if (err.message?.includes("User rejected")) {
        toast.error("Signature rejected");
      } else {
        toast.error(err.message || "Failed to link wallet");
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      await signInWithGoogle();
      // OAuth redirect will handle the rest
    } catch {
      toast.error("Failed to start Google sign-in");
      setIsLinking(false);
    }
  };

  // --- 1. Fetch All Data ---
  useEffect(() => {
    if (!supabase || !authInfo?.id) {
        if (isConnected === false) setIsLoading(false);
        return;
    }

    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        // A. Fetch Profile
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authInfo.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profile);

        // B. Fetch Stories
        const { data: stories, error: storyError } = await supabase
          .from("stories")
          .select("id, created_at, title, content, likes, audio_url")
          .eq("author_id", authInfo.id)
          .order("created_at", { ascending: false });

        if (storyError) throw storyError;

        // C. Fetch Books
        const { count: booksCount } = await supabase
          .from("books")
          .select("*", { count: 'exact', head: true })
          .eq("author_id", authInfo.id);

        // --- Calculations ---
        const totalLikes = stories?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0;
        const now = new Date();
        
        // Monthly Stories
        const monthlyStories = stories?.filter(s => {
            const d = new Date(s.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length || 0;

        // Streak Logic
        let currentStreak = 0;
        const activityMap = new Map<string, number>();
        
        // Map all stories to dates
        stories?.forEach(s => {
            const date = new Date(s.created_at).toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + 1);
        });

        // Calculate Streak (Check previous days consecutively)
        for (let i = 0; i < 365; i++) {
             const d = new Date();
             d.setDate(now.getDate() - i);
             const dateStr = d.toISOString().split('T')[0];
             if (activityMap.has(dateStr)) {
                 currentStreak++;
             } else if (i > 0 && activityMap.has(new Date().toISOString().split('T')[0]) === false) {
                 // Allow streak to continue if today just started and we haven't posted YET, 
                 // but stop if we missed yesterday.
                 if(i > 1) break; 
             } else {
                 break;
             }
        }

        setStats({
            stories: stories?.length || 0,
            books: booksCount || 0,
            likes: totalLikes,
            views: totalLikes * 3 + (stories?.length || 0) * 5,
            monthlyStories,
            streak: currentStreak
        });

        // --- Activity List Data (Last 14 Days) ---
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - i);
            return d.toISOString().split('T')[0];
        });

        const listData = last14Days.map(date => {
             // Find specific stories for this date to sum likes
             const dayStories = stories?.filter(s => s.created_at.startsWith(date));
             const likes = dayStories?.reduce((acc, s) => acc + (s.likes || 0), 0) || 0;
             const entries = dayStories?.length || 0;
             return { date, entries, likes, views: likes * 4 };
        }).filter(d => d.entries > 0); // Only show days with activity
        
        setActivityData(listData);

        // --- Heatmap Data (Last 6 Months) ---
        const heatmap = [];
        // Create a grid of roughly 24 weeks (approx 6 months)
        for (let i = 168; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            heatmap.push({
                date: dateStr,
                count: activityMap.get(dateStr) || 0
            });
        }
        setHeatmapData(heatmap);

        // --- Achievements ---
        const newAchievements = [
            { id: 1, name: "First Story", description: "Recorded your first journal entry", earned: (stories?.length || 0) > 0, date: stories?.[stories.length - 1]?.created_at },
            { id: 2, name: "Prolific Writer", description: "Recorded 10+ stories", earned: (stories?.length || 0) >= 10, date: null },
            { id: 3, name: "Community Star", description: "Received 50+ total likes", earned: totalLikes >= 50, date: null },
            { id: 4, name: "Book Author", description: "Compiled your first digital book", earned: (booksCount || 0) > 0, date: null },
            { id: 5, name: "Daily Grinder", description: "Wrote 3 stories in one day", earned: Math.max(...Array.from(activityMap.values()), 0) >= 3, date: null },
            { id: 6, name: "Vocalist", description: "Recorded a story with audio", earned: stories?.some(s => s.audio_url), date: null },
        ];
        setAchievements(newAchievements);

        // --- Identify Today's Stories (For Daily Journal) ---
        const todayStr = now.toISOString().split('T')[0];
        setTodaysStories(stories?.filter(s => s.created_at.startsWith(todayStr)) || []);

      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [supabase, authInfo?.id]);

  // --- Sync Form ---
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        avatar: profileData.avatar || "",
        email: profileData.email || "",
      });
    }
  }, [profileData]);

  // --- Actions ---

  const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!supabase || !authInfo?.id) return toast.error("Not authenticated");

  setIsSaving(true);
  try {
    const { error } = await supabase
      .from("users")
      .update(formData)
      .eq("id", authInfo.id);

    if (error) throw error;

    // --- NEW: Check if we should send a welcome email ---
    // Logic: If email is present AND different from what we had (or it's first setup)
    if (formData.email && formData.email !== profileData?.email && preferences.emailNotifications) {
       toast.promise(
         emailService.sendWelcomeEmail(formData.email, formData.name || "Writer"),
         {
           loading: 'Sending confirmation email...',
           success: 'Profile saved & Email sent!',
           error: 'Profile saved, but email failed.',
         }
       );
    } else {
       toast.success("Profile updated!");
    }
    // ---------------------------------------------------

    setProfileData(prev => prev ? ({...prev, ...formData}) : null);
    setCurrentTab("overview");
  } catch (err: any) {
    toast.error(`Save failed: ${err.message}`);
  } finally {
    setIsSaving(false);
  }
};

  const togglePreference = (key: keyof typeof preferences) => {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
      toast.success("Preference updated");
  };

  const handleCompileDailyJournal = async () => {
    if (todaysStories.length < 2) return toast.error("Need at least 2 stories today to compile.");
    if (!authInfo?.id || !supabase) return;

    const toastId = toast.loading("Compiling Daily Journal...");

    try {
       // 1. Create Metadata
       const dateStr = new Date().toLocaleDateString();
       const metadata = {
           name: `Daily Journal - ${dateStr}`,
           description: `A collection of ${todaysStories.length} moments captured on ${dateStr}.`,
           external_url: "https://istory.vercel.app",
           attributes: [
               { trait_type: "Author", value: authInfo.name },
               { trait_type: "Date", value: dateStr },
               { trait_type: "Type", value: "Daily Journal" }
           ],
           stories: todaysStories.map(s => ({ title: s.title, content: s.content, date: s.created_at }))
       };

       // 2. Upload to IPFS
       const ipfsResult = await ipfsService.uploadMetadata(metadata);
       if(!ipfsResult?.hash) throw new Error("IPFS upload failed");
       
       // 3. Mint
       await mintBook(`ipfs://${ipfsResult.hash}`);

       // 4. Save to DB
       const bookData = {
           author_id: authInfo.id,
           author_wallet: authInfo.wallet_address,
           title: `Daily Journal - ${dateStr}`,
           description: `Reflections from ${dateStr}`,
           story_ids: todaysStories.map(s => s.id),
           ipfs_hash: ipfsResult.hash,
       };

       const { error } = await supabase.from("books").insert([bookData]);
       if (error) throw error;

       toast.success("Daily Journal Minted!", { id: toastId });
       
       // Refresh stats
       setStats(prev => ({ ...prev, books: prev.books + 1 }));

    } catch (err: any) {
        console.error(err);
        const msg = err.message || "Failed";
        if (msg.includes("User rejected")) toast.error("Minting cancelled", { id: toastId });
        else toast.error("Failed to compile journal", { id: toastId });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  // --- Render ---

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <User className="w-12 h-12 text-[hsl(var(--memory-500))]" />
        <h2 className="text-2xl font-semibold">Please Connect Your Wallet</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Connect your wallet to view or edit your profile.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--memory-500))]" />
        <h2 className="text-2xl font-semibold">Loading Profile Data...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-[hsl(var(--memory-600))] to-[hsl(var(--insight-600))] rounded-full flex items-center justify-center shadow-lg"
        >
          <User className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Profile & <span className="text-gradient-memory">Settings</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Manage your account, track your progress, and view your achievements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 sticky">
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl top-24">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage
                  src={profileData?.avatar || "/default-avatar.jpg"}
                  alt={profileData?.name || "User"}
                />
                <AvatarFallback>
                  {profileData?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="flex flex-col items-center space-y-3">
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profileData?.name || "Unnamed User"}
                  </h2>
                  {profileData?.bio && (
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {profileData?.bio}
                    </p>
                  )}
                  {profileData?.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      📍 {profileData?.location}
                    </p>
                  )}
                  {profileData?.website && (
                    <a
                      href={profileData?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      🌐 Website
                    </a>
                  )}
                </>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {truncateAddress(address)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {wagmiUser?.balance || "0"} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {profileData?.created_at
                      ? new Date(profileData.created_at).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setCurrentTab("settings")}
                className="w-full bg-linear-to-r from-purple-600 to-indigo-600"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6 bg-linear-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-lg">Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                    <BookOpen className="w-5 h-5 mx-auto text-purple-600" />
                    <div className="text-lg font-bold">{stats.stories}</div>
                    <div className="text-xs text-gray-500">Stories</div>
                </div>
                <div className="text-center space-y-1">
                    <Heart className="w-5 h-5 mx-auto text-red-500" />
                    <div className="text-lg font-bold">{stats.likes}</div>
                    <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="text-center space-y-1">
                    <Eye className="w-5 h-5 mx-auto text-blue-600" />
                    <div className="text-lg font-bold">{stats.views}</div>
                    <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center space-y-1">
                    <Coins className="w-5 h-5 mx-auto text-emerald-600" />
                    <div className="text-lg font-bold">{stats.books}</div>
                    <div className="text-xs text-gray-500">Books</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* 1. Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Daily Journal Compilation Feature */}
              {todaysStories.length > 1 && (
                 <Card className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-dashed border-purple-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Sparkles className="w-5 h-5" /> Daily Recap Available
                        </CardTitle>
                        <CardDescription>
                            You have recorded <strong>{todaysStories.length} stories</strong> today. Would you like to bundle them into a Daily Journal NFT?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={handleCompileDailyJournal} 
                            disabled={isMinting}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isMinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <BookOpen className="w-4 h-4 mr-2"/>}
                            {isMinting ? "Minting..." : `Compile Daily Journal (${new Date().toLocaleDateString()})`}
                        </Button>
                    </CardContent>
                 </Card>
              )}

              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Writing Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Daily Writing Streak</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stats.streak} days</span>
                    </div>
                    <Progress value={Math.min((stats.streak / 7) * 100, 100)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Stories</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stats.monthlyStories}/10 stories</span>
                    </div>
                    <Progress value={Math.min((stats.monthlyStories / 10) * 100, 100)} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Community Engagement</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stats.likes}/100 likes</span>
                    </div>
                    <Progress value={Math.min((stats.likes / 100) * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Reflection Section */}
              <ErrorBoundary fallbackMessage="Unable to load weekly reflection">
                <WeeklyReflectionSection />
              </ErrorBoundary>
            </TabsContent>

            {/* 2. Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Your Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.earned
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.earned ? "bg-emerald-100 dark:bg-emerald-900" : "bg-gray-200 dark:bg-gray-700"}`}>
                            <Award className={`w-5 h-5 ${achievement.earned ? "text-emerald-600" : "text-gray-400"}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">{achievement.name}</h4>
                            <p className="text-xs text-gray-500">{achievement.description}</p>
                            {achievement.earned && achievement.date && <p className="text-[10px] text-emerald-600 mt-1">Earned: {new Date(achievement.date).toLocaleDateString()}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* 3. Activity Tab (With Heatmap & List) */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Contribution Heatmap</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Heatmap Grid - GitHub Style */}
                  <div className="flex flex-col space-y-2 mb-8">
                    {/* Month Labels (Approximate distribution) */}
                    <div className="flex justify-between px-8 text-xs text-gray-400 select-none">
                      <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                    </div>

                    <div className="flex gap-2 items-start overflow-x-auto pb-2">
                      {/* Weekday Labels */}
                      <div className="grid grid-rows-7 gap-1 text-[10px] text-gray-400 leading-2.5 pt-0.5 select-none">
                        <span className="h-2.5"></span> 
                        <span className="h-2.5">Mon</span>
                        <span className="h-2.5"></span> 
                        <span className="h-2.5">Wed</span>
                        <span className="h-2.5"></span> 
                        <span className="h-2.5">Fri</span>
                        <span className="h-2.5"></span> 
                      </div>

                      {/* Grid Container */}
                      <div className="grid grid-rows-7 grid-flow-col gap-1">
                        {(() => {
                          // 1. Generate a calendar for the last ~365 days aligned to Sunday
                          const today = new Date();
                          const days = [];
                          
                          // Start roughly 52 weeks ago
                          const startDate = new Date(today);
                          startDate.setDate(today.getDate() - 364);
                          
                          // Rewind start date to the previous Sunday to align with grid rows (Row 1 = Sun)
                          while (startDate.getDay() !== 0) {
                            startDate.setDate(startDate.getDate() - 1);
                          }

                          // Fill array until today
                          const iterDate = new Date(startDate);
                          // Add a few extra days to finish the week if needed, or stop at today
                          while (iterDate <= today || iterDate.getDay() !== 0) { 
                             if (iterDate > today && iterDate.getDay() === 0) break;
                             days.push(new Date(iterDate));
                             iterDate.setDate(iterDate.getDate() + 1);
                          }

                          // 2. Map visual grid
                          return days.map((date, i) => {
                            const dateStr = date.toISOString().split('T')[0];
                            
                            // Find match in your existing heatmapData
                            // Assumes heatmapData has { date: "YYYY-MM-DD", count: number }
                            const match = heatmapData.find(d => d.date.startsWith(dateStr));
                            const count = match ? match.count : 0;

                            return (
                              <div
                                key={i}
                                title={`${date.toDateString()}: ${count} stories`}
                                className={`w-3 h-3 rounded-[6px] ${getHeatmapColor(count)}`}
                              />
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Recent List */}
                  <h3 className="text-sm font-semibold mb-4 text-gray-500">Recent Activity</h3>
                  <div className="space-y-4">
                    {activityData.length > 0 ? (
                      activityData.map((day) => (
                        <div
                          key={day.date}
                          className="border-l-4 border-purple-200 dark:border-purple-800 pl-4 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {new Date(day.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="flex items-center space-x-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span>{day.entries} entries</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{day.likes} likes</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        No recent activity recorded.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" value={formData.bio} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={formData.location} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" value={formData.website} onChange={handleInputChange} />
                        </div>
                    </div>
                    <Button type="submit" disabled={isSaving} className="w-full bg-linear-to-r from-purple-600 to-indigo-600">
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </form>
                  
                  {/* Linked Accounts Section */}
                  <div className="space-y-4 border-t pt-6 dark:border-gray-700">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Link className="w-5 h-5" /> Linked Accounts
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Link both Google and Web3 wallet for a unified experience.
                      </p>

                      {/* Google Account */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            authInfo?.auth_provider === "google" || authInfo?.auth_provider === "both"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}>
                            <Chrome className={`w-5 h-5 ${
                              authInfo?.auth_provider === "google" || authInfo?.auth_provider === "both"
                                ? "text-green-600" : "text-gray-400"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Google Account</p>
                            {authInfo?.auth_provider === "google" || authInfo?.auth_provider === "both" ? (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Linked{authInfo?.email ? ` (${authInfo.email})` : ""}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Not linked</p>
                            )}
                          </div>
                        </div>
                        {authInfo?.auth_provider !== "google" && authInfo?.auth_provider !== "both" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleLinkGoogle}
                            disabled={isLinking}
                          >
                            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link Google"}
                          </Button>
                        )}
                      </div>

                      {/* Web3 Wallet */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            authInfo?.auth_provider === "wallet" || authInfo?.auth_provider === "both"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}>
                            <Wallet className={`w-5 h-5 ${
                              authInfo?.auth_provider === "wallet" || authInfo?.auth_provider === "both"
                                ? "text-green-600" : "text-gray-400"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Web3 Wallet</p>
                            {authInfo?.auth_provider === "wallet" || authInfo?.auth_provider === "both" ? (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Linked ({truncateAddress(authInfo?.wallet_address)})
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Not linked</p>
                            )}
                          </div>
                        </div>
                        {authInfo?.auth_provider !== "wallet" && authInfo?.auth_provider !== "both" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleLinkWallet}
                            disabled={isLinking}
                          >
                            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : !address ? "Connect Wallet" : "Link Wallet"}
                          </Button>
                        )}
                      </div>

                      {authInfo?.auth_provider === "both" && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Both accounts linked. You can sign in with either Google or wallet.
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Preferences Section */}
                  <div className="space-y-4 border-t pt-6 dark:border-gray-700">
                      <h3 className="text-lg font-semibold">Preferences</h3>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="space-y-0.5">
                              <Label className="text-base">Email Notifications</Label>
                              <p className="text-xs text-gray-500">Receive updates about new followers and tips.</p>
                          </div>
                          <Button variant={preferences.emailNotifications ? "default" : "outline"} onClick={() => togglePreference("emailNotifications")} size="sm">
                             {preferences.emailNotifications ? "Enabled" : "Disabled"}
                          </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="space-y-0.5">
                              <Label className="text-base">Public Profile</Label>
                              <p className="text-xs text-gray-500">Allow others to see your stories on the social feed.</p>
                          </div>
                          <Button variant={preferences.publicProfile ? "default" : "outline"} onClick={() => togglePreference("publicProfile")} size="sm">
                             {preferences.publicProfile ? <Eye className="w-4 h-4 mr-2"/> : <Shield className="w-4 h-4 mr-2"/>}
                             {preferences.publicProfile ? "Public" : "Private"}
                          </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="space-y-0.5">
                              <Label className="text-base">AI Enhancements</Label>
                              <p className="text-xs text-gray-500">Automatically suggest improvements for your stories.</p>
                          </div>
                          <Button variant={preferences.aiEnhancement ? "default" : "outline"} onClick={() => togglePreference("aiEnhancement")} size="sm">
                             {preferences.aiEnhancement ? <Zap className="w-4 h-4 mr-2 fill-current"/> : "Disabled"}
                             {preferences.aiEnhancement ? "On" : "Off"}
                          </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}