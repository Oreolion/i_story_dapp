'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/components/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Gift
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSignMessage } from 'wagmi';
import { createSupabaseClient } from '@/app/utils/supabase/supabaseClient';

const fallbackAchievements = [
  { id: 1, name: "First Story", description: "Recorded your first journal entry", earned: true, date: "2025-01-15" },
  { id: 2, name: "10-Day Streak", description: "Recorded entries for 10 consecutive days", earned: true, date: "2025-01-20" },
  { id: 3, name: "Community Star", description: "Received 100+ likes on a single story", earned: true, date: "2025-01-18" },
  { id: 4, name: "Book Author", description: "Compiled your first digital book", earned: false, date: null },
  { id: 5, name: "Viral Story", description: "Story shared 50+ times", earned: false, date: null },
  { id: 6, name: "Top Writer", description: "Ranked in top 10% of writers", earned: false, date: null }
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
  avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
};

export default function ProfilePage() {
  const { user, isConnected } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(fallbackProfile);
  const [achievements, setAchievements] = useState(fallbackAchievements);
  const [activityData, setActivityData] = useState(fallbackActivityData);
  const [isSignedIn, setIsSignedIn] = useState(false); 
  const { signMessageAsync } = useSignMessage();

  // Fetch Supabase profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      console.log('Session fetch:', session); // Debug log
      setIsSignedIn(!!session.session);
      if (session.session && user?.address) {
        const { data, error } = await supabase.from('users').select('*').eq('wallet_address', user.address).single();
        console.log('Profile fetch:', data, error); // Debug log
        if (data) {
          // Merge with fallback for all fields
          setProfile({
            ...fallbackProfile,
            name: data.name || fallbackProfile.name,
            bio: data.bio || fallbackProfile.bio,
            location: data.location || fallbackProfile.location,
            website: data.website || fallbackProfile.website,
            joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : fallbackProfile.joinDate,
            avatar: data.avatar_url || fallbackProfile.avatar
          });
        } else {
          // No user data, use full fallback
          setProfile(fallbackProfile);
        }
      } else {
        // No session or address, use fallback
        setProfile(fallbackProfile);
      }

      // Fetch achievements with fallback (assume 'user_achievements' table; adjust if needed)
      if (session.session && user?.address) {
        const { data: achData, error: achError } = await supabase
          .from('user_achievements') // Adjust table name if different
          .select('*')
          .eq('wallet_address', user.address)
          .order('date', { ascending: false });
        console.log('Achievements fetch:', achData, achError);
        if (achData && !achError) {
          setAchievements(achData.length > 0 ? achData : fallbackAchievements);
        } else {
          setAchievements(fallbackAchievements);
        }
      } else {
        setAchievements(fallbackAchievements);
      }

      // Fetch activity with fallback (assume 'user_activity' table; adjust if needed)
      if (session.session && user?.address) {
        const { data: actData, error: actError } = await supabase
          .from('user_activity') // Adjust table name if different
          .select('*')
          .eq('wallet_address', user.address)
          .order('date', { ascending: false })
          .limit(6);
        console.log('Activity fetch:', actData, actError);
        if (actData && !actError) {
          setActivityData(actData.length > 0 ? actData : fallbackActivityData);
        } else {
          setActivityData(fallbackActivityData);
        }
      } else {
        setActivityData(fallbackActivityData);
      }
    };
    fetchProfile();
  }, [user?.address]);

  const handleWeb3SignIn = async () => {
    try {
      const message = 'Sign in to iStory with wallet';
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ address: user?.address, message, signature }),
      });
      const data = await res.json();
      console.log('Sign-in response:', data); // Debug log
      if (data.success) {
        setIsSignedIn(true);
        toast.success('Signed in with wallet!');
        // Re-fetch profile after sign-in
        const supabase = createSupabaseClient();
        const { data: userData } = await supabase.from('users').select('*').eq('wallet_address', user.address).single();
        if (userData) {
          setProfile({
            ...fallbackProfile,
            name: userData.name || fallbackProfile.name,
            bio: userData.bio || fallbackProfile.bio,
            location: userData.location || fallbackProfile.location,
            website: userData.website || fallbackProfile.website,
            joinDate: userData.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : fallbackProfile.joinDate,
            avatar: userData.avatar_url || fallbackProfile.avatar
          });
        }
      }
    } catch (error) {
      toast.error('Sign-in failed');
      console.error('Auth error:', error); // Debug log
    }
  };

  const handleSaveProfile = async () => {
    if (!isSignedIn) {
      toast.error('Sign in first');
      return;
    }
    const supabase = createSupabaseClient();
    const { error } = await supabase.from('users').update({ 
      name: profile.name, 
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      avatar_url: profile.avatar  // If updating avatar
    }).eq('wallet_address', user?.address);
    console.log('Save profile error:', error); // Debug log
    if (error) {
      toast.error('Save failed');
    } else {
      toast.success('Profile updated');
      setIsEditing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center space-y-8 py-16">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-purple-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connect Your Wallet</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect your Web3 wallet to access your profile and settings.
          </p>
        </div>
      </div>
    );
  }

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
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <CardDescription>{profile.bio}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {user?.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                    <Award className="w-3 h-3 mr-1" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{user?.address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.balance} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">$STORY Tokens</span>
                  <span className="text-sm font-medium text-emerald-600">{user?.storyTokens}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">{profile.joinDate}</span>
                </div>
              </div>
              {!isSignedIn && (
                <Button onClick={handleWeb3SignIn} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                  Sign In with Wallet
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
              {isEditing && (
                <Button onClick={handleSaveProfile} variant="secondary" className="w-full">
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
                  { label: 'Stories', value: '24', icon: BookOpen, color: 'text-purple-600' },
                  { label: 'Likes', value: '456', icon: Heart, color: 'text-red-500' },
                  { label: 'Views', value: '2.1K', icon: Eye, color: 'text-blue-600' },
                  { label: 'Tokens', value: '150', icon: Coins, color: 'text-emerald-600' }
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center space-y-1">
                      <Icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
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
              {/* Writing Goals */}
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">12/30 days</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Stories</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">24/50 stories</span>
                    </div>
                    <Progress value={48} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Community Engagement</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">456/1000 likes</span>
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
                      <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{new Date(day.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-600">{day.entries} stories</span>
                          <span className="text-red-500">{day.likes} likes</span>
                          <span className="text-blue-600">{day.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Your Achievements</span>
                  </CardTitle>
                  <CardDescription>
                    Unlock badges by reaching milestones in your storytelling journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.earned
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            achievement.earned ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {achievement.earned ? (
                              <Award className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Award className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              achievement.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {achievement.name}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              achievement.earned ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {achievement.description}
                            </p>
                            {achievement.earned && achievement.date && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                Earned on {new Date(achievement.date).toLocaleDateString()}
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
            {/* Activity Tab */}
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
                      <div key={day.date} className="border-l-4 border-purple-200 dark:border-purple-800 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
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
                              +{Math.floor(day.likes * 0.5 + day.entries * 2)} $STORY
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Settings Tab */}
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
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates about your stories</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Privacy Settings</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Control who can see your stories</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Features</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enable enhanced AI capabilities</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
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