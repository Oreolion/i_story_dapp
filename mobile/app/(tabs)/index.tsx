// Home Screen - Hero, quick actions, stats, token balance
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mic, BookOpen, Users, TrendingUp } from "lucide-react-native";
import { useAccount } from "wagmi";
import { useAuthStore } from "../../stores/authStore";
import { apiGet } from "../../lib/api";

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState({ stories: 0, books: 0, followers: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiGet<{ user: { stories_count?: number } }>(
        "/api/user/profile"
      );
      if (res.ok && res.data) {
        setStats((prev) => ({
          ...prev,
          stories: res.data?.user?.stories_count || 0,
        }));
      }
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, [isAuthenticated]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="py-6">
          <Text className="text-3xl font-bold text-white">
            {user?.name ? `Welcome, ${user.name}` : "Welcome to e-Story"}
          </Text>
          <Text className="mt-1 text-base text-slate-400">
            Your voice. Your story. On-chain forever.
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push("/record")}
            className="flex-1 items-center rounded-2xl bg-violet-600 p-4"
          >
            <Mic size={28} color="#fff" />
            <Text className="mt-2 font-semibold text-white">Record</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/library")}
            className="flex-1 items-center rounded-2xl bg-slate-800 p-4"
          >
            <BookOpen size={28} color="#a78bfa" />
            <Text className="mt-2 font-semibold text-slate-300">Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/social")}
            className="flex-1 items-center rounded-2xl bg-slate-800 p-4"
          >
            <Users size={28} color="#a78bfa" />
            <Text className="mt-2 font-semibold text-slate-300">Community</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {isAuthenticated && (
          <View className="mt-6 flex-row gap-3">
            <View className="flex-1 rounded-xl bg-slate-800 p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.stories}
              </Text>
              <Text className="text-sm text-slate-400">Stories</Text>
            </View>
            <View className="flex-1 rounded-xl bg-slate-800 p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.books}
              </Text>
              <Text className="text-sm text-slate-400">Books</Text>
            </View>
            <View className="flex-1 rounded-xl bg-slate-800 p-4">
              <TrendingUp size={20} color="#4ade80" />
              <Text className="mt-1 text-sm text-slate-400">Streak</Text>
            </View>
          </View>
        )}

        {/* Wallet Status */}
        {isConnected && address && (
          <View className="mt-4 rounded-xl bg-slate-800/50 p-4">
            <Text className="text-sm text-slate-400">Connected Wallet</Text>
            <Text className="mt-1 font-mono text-xs text-violet-400">
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
          </View>
        )}

        {/* Login CTA */}
        {!isAuthenticated && (
          <View className="mt-8 items-center rounded-2xl bg-slate-800 p-6">
            <Text className="text-lg font-semibold text-white">
              Start your journey
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Connect your wallet or sign in with Google to begin recording
              stories.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              className="mt-4 rounded-full bg-violet-600 px-8 py-3"
            >
              <Text className="font-semibold text-white">Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Spacer for tab bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
