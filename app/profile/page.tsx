"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/components/Provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Wallet,
  Settings,
  Award,
  TrendingUp,
  Calendar,
  Heart,
  Eye,
  BookOpen,
  Coins,
  Edit3,
  Save,
  Trophy,
  Target,
  Clock,
  Zap,
  Shield,
  Gift,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSignMessage } from "wagmi";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";
import { Textarea } from "@/components/ui/textarea";

// --- Fallback data (unchanged, kept for safety) ---
const fallbackAchievements = [
  {
    id: 1,
    name: "First Story",
    description: "Recorded your first journal entry",
    earned: true,
    date: "2025-01-15",
  },
  {
    id: 2,
    name: "10-Day Streak",
    description: "Recorded entries for 10 consecutive days",
    earned: true,
    date: "2025-01-20",
  },
  {
    id: 3,
    name: "Community Star",
    description: "Received 100+ likes on a single story",
    earned: true,
    date: "2025-01-18",
  },
  {
    id: 4,
    name: "Book Author",
    description: "Compiled your first digital book",
    earned: false,
    date: null,
  },
  {
    id: 5,
    name: "Viral Story",
    description: "Story shared 50+ times",
    earned: false,
    date: null,
  },
  {
    id: 6,
    name: "Top Writer",
    description: "Ranked in top 10% of writers",
    earned: false,
    date: null,
  },
];

const fallbackActivityData = [
  { date: "2025-01-20", entries: 2, likes: 24, views: 156 },
  { date: "2025-01-19", entries: 1, likes: 18, views: 89 },
  { date: "2025-01-18", entries: 3, likes: 67, views: 298 },
  { date: "2025-01-17", entries: 1, likes: 12, views: 76 },
  { date: "2025-01-16", entries: 2, likes: 34, views: 187 },
  { date: "2025-01-15", entries: 1, likes: 8, views: 45 },
];

const fallbackProfile = {
  name: "Alex Johnson",
  bio: "Digital storyteller sharing life's moments on the blockchain. Passionate about mindfulness, travel, and human connections.",
  location: "San Francisco, CA",
  website: "alexjohnson.eth",
  joinDate: "January 2025",
  avatar:
    "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
};

export default function ProfilePage() {
  const { user, isConnected } = useApp(); // your provider/context
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(fallbackProfile);
  const [achievements, setAchievements] = useState(fallbackAchievements);
  const [activityData, setActivityData] = useState(fallbackActivityData);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const { signMessageAsync } = useSignMessage();

  // Helper: create supabase client once (client-side)
  const supabase = supabaseClient;

  // Fetch profile & related data from Supabase (client-side)
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Get session (client-side)
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) {
          console.warn("Supabase getSession error:", sessionErr);
        }
        const session = sessionData?.session ?? null;
        setIsSignedIn(!!session);

        // If wallet address is available via your app provider, fetch user data
        if (user?.address) {
          // Normalize address to lowercase (consistency)
          const wallet = (user.address as string).toLowerCase();

          // Users table
          const { data: userData, error: userErr } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", wallet)
            .maybeSingle();

          if (userErr) {
            console.warn("Profile fetch user error:", userErr);
          }

          if (userData) {
            // Merge DB fields with fallback
            setProfile({
              ...fallbackProfile,
              name: userData.name || fallbackProfile.name,
              bio: userData.bio || fallbackProfile.bio,
              location: userData.location || fallbackProfile.location,
              website: userData.website || fallbackProfile.website,
              joinDate: userData.created_at
                ? new Date(userData.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : fallbackProfile.joinDate,
              avatar: userData.avatar_url || fallbackProfile.avatar,
            });
          } else {
            // No DB record yet — keep fallback
            setProfile(fallbackProfile);
          }

          // Achievements (if table exists)
          try {
            const { data: achData, error: achErr } = await supabase
              .from("user_achievements")
              .select("*")
              .eq("wallet_address", wallet)
              .order("date", { ascending: false });

            if (!achErr && achData && achData.length > 0) {
              setAchievements(achData);
            } else {
              setAchievements(fallbackAchievements);
            }
          } catch (err) {
            console.warn("Achievements fetch failed:", err);
            setAchievements(fallbackAchievements);
          }

          // Activity
          try {
            const { data: actData, error: actErr } = await supabase
              .from("user_activity")
              .select("*")
              .eq("wallet_address", wallet)
              .order("date", { ascending: false })
              .limit(6);

            if (actErr) throw actErr; // Will catch 404 as error
            setActivityData(
              actData?.length > 0 ? actData : fallbackActivityData
            );
          } catch (err) {
            console.warn("Activity fetch failed:", err);
            setActivityData(fallbackActivityData);
          }
        } else {
          // No connected wallet -> use fallback
          setProfile(fallbackProfile);
          setAchievements(fallbackAchievements);
          setActivityData(fallbackActivityData);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setProfile(fallbackProfile);
        setAchievements(fallbackAchievements);
        setActivityData(fallbackActivityData);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user?.address, supabase]); // re-run when wallet address changes

  // Web3 sign-in handler (uses wagmi signMessage)
  const handleWeb3SignIn = async () => {
    if (!user?.address) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      const message = "Sign in to iStory with wallet";
      // signMessageAsync throws if user rejects
      const signature = await signMessageAsync({ message });

      // POST to your auth API route (server handles verification/upsert)
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: user.address, message, signature }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Sign-in failed:", res.status, text);
        toast.error("Sign-in failed");
        return;
      }

      const data = await res.json();
      console.log("Sign-in response:", data);
      if (data?.success) {
        toast.success("Signed in with wallet!");
        setIsSignedIn(true);

        // re-fetch profile now that user exists server-side
        // small pause recommended to allow auth/session propagation
        setTimeout(async () => {
          const sup = supabaseClient;
          const { data: userData } = await sup
            .from("users")
            .select("*")
            .eq("wallet_address", (user.address as string).toLowerCase())
            .maybeSingle();
          if (userData) {
            setProfile({
              ...fallbackProfile,
              name: userData.name || fallbackProfile.name,
              bio: userData.bio || fallbackProfile.bio,
              location: userData.location || fallbackProfile.location,
              website: userData.website || fallbackProfile.website,
              joinDate: userData.created_at
                ? new Date(userData.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : fallbackProfile.joinDate,
              avatar: userData.avatar_url || fallbackProfile.avatar,
            });
          }
        }, 500);
      } else {
        toast.error("Sign-in failed");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error?.code === "ACTION_REJECTED") {
        toast.error("Signature rejected");
      } else {
        toast.error("Sign-in failed");
      }
    }
  };

  // Save profile updates to Supabase
  const handleSaveProfile = async () => {
    if (!isSignedIn || !user?.address) {
      toast.error("Sign in first");
      return;
    }
    try {
      const sup = supabaseClient;
      const updates = {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        avatar_url: profile.avatar,
      };
      const { error } = await sup
        .from("users")
        .update(updates)
        .eq("wallet_address", (user.address as string).toLowerCase());
      if (error) {
        console.error("Save profile error:", error);
        toast.error("Save failed");
      } else {
        toast.success("Profile updated");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Save profile exception:", err);
      toast.error("Save failed");
    }
  };

  // Loading skeleton / indicator
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-96 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  // Main render (unchanged structure)
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <User className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Manage your account, track your progress, and view your achievements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage
                  src={profile.avatar || "/default-avatar.png"}
                  alt={profile.name || "User"}
                />
                <AvatarFallback>
                  {profile.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + Basic Info */}
              <div className="flex flex-col items-center space-y-3">
                {isEditing ? (
                  <div className="w-full space-y-3 text-left">
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-300">
                        Name
                      </Label>
                      <Input
                        value={profile.name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-300">
                        Bio
                      </Label>
                      <Textarea
                        value={profile.bio || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        placeholder="Tell your story..."
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-300">
                        Location
                      </Label>
                      <Input
                        value={profile.location || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, location: e.target.value })
                        }
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-300">
                        Website
                      </Label>
                      <Input
                        value={profile.website || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, website: e.target.value })
                        }
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-300">
                        Avatar URL
                      </Label>
                      <Input
                        value={profile.avatar || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, avatar: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profile.name || "Unnamed User"}
                    </h2>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground text-center max-w-xs">
                        {profile.bio}
                      </p>
                    )}
                    {profile.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📍 {profile.location}
                      </p>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        🌐 {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </>
                )}
              </div>

              {/* Wallet + Token Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Wallet
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {user?.address ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Balance
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.balance ?? "0"} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    $STORY Tokens
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    {user?.storyTokens ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Member Since
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {profile.joinDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isSignedIn && (
                <Button
                  onClick={handleWeb3SignIn}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  Sign In with Wallet
                </Button>
              )}

              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>

              {isEditing && (
                <Button
                  onClick={handleSaveProfile}
                  variant="secondary"
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-lg">Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Stories",
                    value: "24",
                    icon: BookOpen,
                    color: "text-purple-600",
                  },
                  {
                    label: "Likes",
                    value: "456",
                    icon: Heart,
                    color: "text-red-500",
                  },
                  {
                    label: "Views",
                    value: "2.1K",
                    icon: Eye,
                    color: "text-blue-600",
                  },
                  {
                    label: "Tokens",
                    value: "150",
                    icon: Coins,
                    color: "text-emerald-600",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center space-y-1">
                      <Icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
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
                      <span className="text-sm font-medium">
                        Daily Writing Streak
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        12/30 days
                      </span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Monthly Stories
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        24/50 stories
                      </span>
                    </div>
                    <Progress value={48} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Community Engagement
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        456/1000 likes
                      </span>
                    </div>
                    <Progress value={45.6} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Recent Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityData.slice(0, 5).map((day, index) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-600">
                            {day.entries} stories
                          </span>
                          <span className="text-red-500">
                            {day.likes} likes
                          </span>
                          <span className="text-blue-600">
                            {day.views} views
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Your Achievements</span>
                  </CardTitle>
                  <CardDescription>
                    Unlock badges by reaching milestones in your storytelling
                    journey
                  </CardDescription>
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
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              achievement.earned
                                ? "bg-emerald-100 dark:bg-emerald-900"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <Award
                              className={`w-5 h-5 ${
                                achievement.earned
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${
                                achievement.earned
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {achievement.name}
                            </h4>
                            <p
                              className={`text-sm mt-1 ${
                                achievement.earned
                                  ? "text-gray-600 dark:text-gray-300"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {achievement.description}
                            </p>
                            {achievement.earned && achievement.date && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                Earned on{" "}
                                {new Date(
                                  achievement.date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Activity History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityData.map((day, index) => (
                      <div
                        key={day.date}
                        className="border-l-4 border-purple-200 dark:border-purple-800 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
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
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{day.views} views</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-emerald-600">
                              +{Math.floor(day.likes * 0.5 + day.entries * 2)}{" "}
                              $STORY
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile({ ...profile, website: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive updates about your stories
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Privacy Settings</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Control who can see your stories
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Features</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable enhanced AI capabilities
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
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
